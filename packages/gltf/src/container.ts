// Container-preserving read/write path for glTF/GLB assets. Deliberately
// separate from parseGlb/writeGlb in index.ts (untouched, still used by the
// viewer): those discard everything but the JSON/BIN chunks and always
// re-stringify the whole document, which is fine for rendering but not for
// an editing workflow that must leave everything outside the edited
// subtree byte-identical. See docs' R3 plan, section A2.
//
// The core idea: `parseContainer` keeps the JSON chunk's *raw text* (with
// its original 0x20 padding) alongside the parsed `json` object, and
// `locateJsonSpan` + `applyEdits` let a caller replace one JSON subtree by
// text-splicing that raw string instead of re-serializing the whole
// document. `writeContainer` then only ever touches the JSON chunk's bytes;
// every other GLB chunk (BIN, and any unrecognized chunk type) is carried
// through byte-verbatim, in its original position.

export type GlbChunk = { type: number; bytes: Uint8Array };

export type Container =
  | {
      kind: "glb";
      chunks: GlbChunk[];
      jsonChunkIndex: number;
      jsonText: string;
      json: any;
      binaryChunk?: ArrayBuffer;
    }
  | { kind: "gltf"; jsonText: string; json: any };

export type JsonSpan = { start: number; end: number };

export type JsonEdit = { start: number; end: number; replacement: string };

const GLB_MAGIC = 0x46546c67;
const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;

// ---------------------------------------------------------------------------
// parseContainer / writeContainer
// ---------------------------------------------------------------------------

export function parseContainer(input: Uint8Array | string): Container {
  if (typeof input === "string") {
    return { kind: "gltf", jsonText: input, json: JSON.parse(input) };
  }
  if (!isGlbBytes(input)) {
    const jsonText = new TextDecoder().decode(input);
    return { kind: "gltf", jsonText, json: JSON.parse(jsonText) };
  }
  return parseGlbContainer(input);
}

function isGlbBytes(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 12) {
    return false;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return view.getUint32(0, true) === GLB_MAGIC;
}

function parseGlbContainer(bytes: Uint8Array): Container {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const totalLength = view.getUint32(8, true);
  if (totalLength !== bytes.byteLength) {
    throw new Error("GLB length mismatch.");
  }

  let offset = 12;
  const chunks: GlbChunk[] = [];
  let jsonChunkIndex = -1;
  let jsonText: string | undefined;
  let json: any;
  let binaryChunk: ArrayBuffer | undefined;

  while (offset < bytes.byteLength) {
    const chunkLength = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;
    if (chunkEnd > bytes.byteLength) {
      throw new Error("GLB chunk out of bounds.");
    }

    // Uint8Array#slice always copies into a fresh, exactly-sized
    // ArrayBuffer regardless of the source view's own byteOffset — so
    // chunk.bytes.buffer below is safe to hand out as an owned ArrayBuffer.
    const chunkBytes = bytes.slice(chunkStart, chunkEnd);

    // Every chunk is retained, in order, regardless of type — this is the
    // fix for parseGlb's silent drop of anything that isn't JSON/BIN.
    chunks.push({ type: chunkType, bytes: chunkBytes });

    if (chunkType === CHUNK_JSON && jsonChunkIndex === -1) {
      jsonChunkIndex = chunks.length - 1;
      jsonText = new TextDecoder().decode(chunkBytes);
      json = JSON.parse(jsonText);
    } else if (chunkType === CHUNK_BIN && binaryChunk === undefined) {
      binaryChunk = chunkBytes.buffer;
    }

    offset = chunkEnd;
  }

  if (jsonChunkIndex === -1 || jsonText === undefined) {
    throw new Error("GLB missing JSON chunk.");
  }

  return { kind: "glb", chunks, jsonChunkIndex, jsonText, json, binaryChunk };
}

// Mirrors parseGlb/writeGlb's padding convention in index.ts (JSON padded
// with ASCII space 0x20, BIN with 0x00) — replicated here rather than
// imported so this module has zero coupling to the existing GLB path.
function padTo4(bytes: Uint8Array, padByte: number): Uint8Array {
  const remainder = bytes.length % 4;
  if (remainder === 0) {
    return bytes;
  }
  const padded = new Uint8Array(bytes.length + (4 - remainder));
  padded.set(bytes);
  padded.fill(padByte, bytes.length);
  return padded;
}

export function writeContainer(container: Container): Uint8Array | string {
  if (container.kind === "gltf") {
    return container.jsonText;
  }

  const jsonBytes = padTo4(new TextEncoder().encode(container.jsonText), 0x20);
  const chunkBytesList = container.chunks.map((chunk, index) =>
    index === container.jsonChunkIndex ? jsonBytes : chunk.bytes
  );

  let totalLength = 12;
  for (const bytes of chunkBytesList) {
    totalLength += 8 + bytes.length;
  }

  const out = new Uint8Array(totalLength);
  const view = new DataView(out.buffer);
  view.setUint32(0, GLB_MAGIC, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, totalLength, true);

  let offset = 12;
  for (let i = 0; i < chunkBytesList.length; i += 1) {
    const bytes = chunkBytesList[i];
    view.setUint32(offset, bytes.length, true);
    view.setUint32(offset + 4, container.chunks[i].type, true);
    out.set(bytes, offset + 8);
    offset += 8 + bytes.length;
  }

  return out;
}

// ---------------------------------------------------------------------------
// locateJsonSpan: single-pass, string-aware JSON path scanner
// ---------------------------------------------------------------------------
//
// Rather than a generic "parse everything and remember every path", this
// walks the text guided by the target path: at each step it expects the
// container kind the next path segment implies (object for a string key,
// array for a numeric index), scans that container's entries structurally
// (string literal in key position, followed by ':', for objects; comma-
// separated elements for arrays), and skips every entry it isn't looking
// for via a string/bracket-aware balanced skip. Because "is this a key"
// is decided purely by position (right after '{' or ',', followed by a
// ':') rather than by searching the text for the target key's spelling,
// occurrences of the same text inside string *values* anywhere in the
// document can never be mistaken for a match.
export function locateJsonSpan(text: string, path: (string | number)[]): JsonSpan | undefined {
  let pos = skipWhitespace(text, 0);
  for (const segment of path) {
    if (pos >= text.length) {
      return undefined;
    }
    if (typeof segment === "string") {
      if (text[pos] !== "{") {
        return undefined;
      }
      const found = findObjectKey(text, pos, segment);
      if (found === undefined) {
        return undefined;
      }
      pos = found;
    } else {
      if (text[pos] !== "[") {
        return undefined;
      }
      const found = findArrayIndex(text, pos, segment);
      if (found === undefined) {
        return undefined;
      }
      pos = found;
    }
  }
  const start = pos;
  const end = skipValue(text, pos);
  return { start, end };
}

function skipWhitespace(text: string, i: number): number {
  let j = i;
  while (j < text.length) {
    const ch = text[j];
    if (ch !== " " && ch !== "\t" && ch !== "\n" && ch !== "\r") {
      break;
    }
    j += 1;
  }
  return j;
}

// Assumes text[i] === '"'. Explicit in-string state: a backslash always
// introduces a two-character escape (\", \\, \/, \b, \f, \n, \r, \t, or the
// leading "\u" of a \uXXXX sequence whose four hex digits are never
// special characters themselves), so advancing by exactly 2 on every
// backslash correctly threads runs of escaped backslashes/quotes without
// ever mistaking an escaped quote for the terminator.
function parseString(text: string, i: number): number {
  let j = i + 1;
  while (j < text.length) {
    const ch = text[j];
    if (ch === "\\") {
      j += 2;
      continue;
    }
    if (ch === '"') {
      return j + 1;
    }
    j += 1;
  }
  throw new Error(`Unterminated JSON string starting at ${i}`);
}

// Assumes text[i] is '{' or '['. String-aware balanced-bracket skip: depth
// counts any '{'/'[' as +1 and '}'/']' as -1, but strings are consumed
// whole via parseString first so brackets inside string values never
// perturb the count. Returns the index just past the matching close.
function skipBalanced(text: string, i: number): number {
  let depth = 0;
  let j = i;
  while (j < text.length) {
    const ch = text[j];
    if (ch === '"') {
      j = parseString(text, j);
      continue;
    }
    if (ch === "{" || ch === "[") {
      depth += 1;
      j += 1;
      continue;
    }
    if (ch === "}" || ch === "]") {
      depth -= 1;
      j += 1;
      if (depth === 0) {
        return j;
      }
      continue;
    }
    j += 1;
  }
  throw new Error(`Unbalanced JSON starting at ${i}`);
}

const PRIMITIVE_DELIMITERS = new Set([",", "}", "]", " ", "\t", "\n", "\r"]);

// Returns the index just past the JSON value starting at i (string,
// object, array, or bare literal — number/true/false/null).
function skipValue(text: string, i: number): number {
  const ch = text[i];
  if (ch === '"') {
    return parseString(text, i);
  }
  if (ch === "{" || ch === "[") {
    return skipBalanced(text, i);
  }
  let j = i;
  while (j < text.length && !PRIMITIVE_DELIMITERS.has(text[j])) {
    j += 1;
  }
  return j;
}

// Assumes text[i] === '{'. Scans entries in key position only (string
// literal immediately followed, after whitespace, by ':') — never treats
// text appearing inside a string *value* as a key. Returns the index of
// the start of targetKey's value (post-whitespace), or undefined if the
// object closes without a match.
function findObjectKey(text: string, i: number, targetKey: string): number | undefined {
  let pos = skipWhitespace(text, i + 1);
  if (text[pos] === "}") {
    return undefined;
  }
  for (;;) {
    if (text[pos] !== '"') {
      throw new Error(`Expected JSON object key at ${pos}`);
    }
    const keyEnd = parseString(text, pos);
    const key = JSON.parse(text.slice(pos, keyEnd)) as string;
    pos = skipWhitespace(text, keyEnd);
    if (text[pos] !== ":") {
      throw new Error(`Expected ':' after JSON object key at ${pos}`);
    }
    pos = skipWhitespace(text, pos + 1);
    if (key === targetKey) {
      return pos;
    }
    pos = skipWhitespace(text, skipValue(text, pos));
    if (text[pos] === ",") {
      pos = skipWhitespace(text, pos + 1);
      continue;
    }
    if (text[pos] === "}") {
      return undefined;
    }
    throw new Error(`Expected ',' or '}' at ${pos}`);
  }
}

// Assumes text[i] === '['. Returns the index of the start of the element
// at targetIndex (post-whitespace), or undefined if the array closes first.
function findArrayIndex(text: string, i: number, targetIndex: number): number | undefined {
  let pos = skipWhitespace(text, i + 1);
  if (text[pos] === "]") {
    return undefined;
  }
  let index = 0;
  for (;;) {
    if (index === targetIndex) {
      return pos;
    }
    pos = skipWhitespace(text, skipValue(text, pos));
    if (text[pos] === ",") {
      index += 1;
      pos = skipWhitespace(text, pos + 1);
      continue;
    }
    if (text[pos] === "]") {
      return undefined;
    }
    throw new Error(`Expected ',' or ']' at ${pos}`);
  }
}

// ---------------------------------------------------------------------------
// applyEdits
// ---------------------------------------------------------------------------

// Applies edits in descending-start order so earlier spans' offsets stay
// valid as later (higher-offset) edits are applied first.
export function applyEdits(text: string, edits: JsonEdit[]): string {
  const sorted = [...edits].sort((a, b) => b.start - a.start);
  let result = text;
  for (const edit of sorted) {
    result = result.slice(0, edit.start) + edit.replacement + result.slice(edit.end);
  }
  return result;
}

// ---------------------------------------------------------------------------
// spliceGraph
// ---------------------------------------------------------------------------

export type SpliceReport = {
  mode: "splice" | "reserialize";
  spanBytesBefore: number;
  spanBytesAfter: number;
};

export type SpliceResult = { container: Container; report: SpliceReport };

// Splices a single graph element (extensions.KHR_interactivity.graphs[N])
// into the container, preserving every byte outside that element's span —
// including sibling keys like the "graph" selector and any other graphs,
// which survive purely because the edit targets one array *element*, not
// the whole KHR_interactivity object. Falls back to a full parsed-json
// mutation + JSON.stringify (byte-preservation not possible) when the
// extension/graph slot doesn't already exist in the text, or if the
// scanner unexpectedly throws.
export function spliceGraph(container: Container, graphIndex: number, newGraphJson: unknown): SpliceResult {
  const path: (string | number)[] = ["extensions", "KHR_interactivity", "graphs", graphIndex];
  const span = locateJsonSpanSafe(container.jsonText, path);

  if (span) {
    const replacement = JSON.stringify(newGraphJson);
    const edits: JsonEdit[] = [{ start: span.start, end: span.end, replacement }];
    if (!hasInteractivityExtensionsUsed(container.json)) {
      const euEdit = buildExtensionsUsedAppendEdit(container.jsonText);
      if (euEdit) {
        edits.push(euEdit);
      }
    }
    const newJsonText = applyEdits(container.jsonText, edits);
    const newJson = JSON.parse(newJsonText);
    return {
      container: rebuildContainerWithJsonText(container, newJsonText, newJson),
      report: { mode: "splice", spanBytesBefore: span.end - span.start, spanBytesAfter: replacement.length }
    };
  }

  const json = deepCloneJson(container.json);
  ensureGraphSlot(json, graphIndex, newGraphJson);
  const newJsonText = JSON.stringify(json);
  return {
    container: rebuildContainerWithJsonText(container, newJsonText, json),
    report: { mode: "reserialize", spanBytesBefore: 0, spanBytesAfter: newJsonText.length }
  };
}

function locateJsonSpanSafe(text: string, path: (string | number)[]): JsonSpan | undefined {
  try {
    return locateJsonSpan(text, path);
  } catch {
    return undefined;
  }
}

function hasInteractivityExtensionsUsed(json: any): boolean {
  return Array.isArray(json?.extensionsUsed) && json.extensionsUsed.includes("KHR_interactivity");
}

function buildExtensionsUsedAppendEdit(text: string): JsonEdit | null {
  const arraySpan = locateJsonSpanSafe(text, ["extensionsUsed"]);
  if (arraySpan) {
    const arrText = text.slice(arraySpan.start, arraySpan.end);
    if (/^\[\s*\]$/.test(arrText)) {
      return { start: arraySpan.start + 1, end: arraySpan.start + 1, replacement: '"KHR_interactivity"' };
    }
    return { start: arraySpan.end - 1, end: arraySpan.end - 1, replacement: ',"KHR_interactivity"' };
  }

  const rootSpan = locateJsonSpanSafe(text, []);
  if (!rootSpan) {
    return null;
  }
  const rootText = text.slice(rootSpan.start, rootSpan.end);
  if (/^\{\s*\}$/.test(rootText)) {
    return { start: rootSpan.start + 1, end: rootSpan.start + 1, replacement: '"extensionsUsed":["KHR_interactivity"]' };
  }
  return { start: rootSpan.end - 1, end: rootSpan.end - 1, replacement: ',"extensionsUsed":["KHR_interactivity"]' };
}

function deepCloneJson(json: any): any {
  return JSON.parse(JSON.stringify(json));
}

function ensureGraphSlot(json: any, graphIndex: number, newGraphJson: unknown): void {
  json.extensions = json.extensions ?? {};
  const ext = json.extensions;
  ext.KHR_interactivity = ext.KHR_interactivity ?? {};
  const khr = ext.KHR_interactivity;
  khr.graphs = Array.isArray(khr.graphs) ? khr.graphs : [];
  khr.graphs[graphIndex] = newGraphJson;
  if (typeof khr.graph !== "number") {
    khr.graph = graphIndex;
  }
  json.extensionsUsed = Array.isArray(json.extensionsUsed) ? json.extensionsUsed : [];
  if (!json.extensionsUsed.includes("KHR_interactivity")) {
    json.extensionsUsed.push("KHR_interactivity");
  }
}

function rebuildContainerWithJsonText(container: Container, jsonText: string, json: any): Container {
  if (container.kind === "gltf") {
    return { kind: "gltf", jsonText, json };
  }
  const chunks = container.chunks.map((chunk, index) =>
    index === container.jsonChunkIndex ? { type: chunk.type, bytes: new TextEncoder().encode(jsonText) } : chunk
  );
  return {
    kind: "glb",
    chunks,
    jsonChunkIndex: container.jsonChunkIndex,
    jsonText,
    json,
    binaryChunk: container.binaryChunk
  };
}
