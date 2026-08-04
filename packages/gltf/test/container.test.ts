import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  applyEdits,
  locateJsonSpan,
  parseContainer,
  spliceGraph,
  writeContainer,
  type Container
} from "../src/container.js";

const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;
const CHUNK_UNKNOWN = 0x58545845; // arbitrary, deliberately not JSON or BIN

const CORPUS_GLB = path.resolve(
  import.meta.dirname,
  "../../../external/glTF-Test-Assets-Interactivity/Tests/Interactivity/flow/doN/glTF-Binary/doN.glb"
);

function pad4(bytes: Uint8Array, padByte: number): Uint8Array {
  const remainder = bytes.length % 4;
  if (remainder === 0) return bytes;
  const out = new Uint8Array(bytes.length + (4 - remainder));
  out.set(bytes);
  out.fill(padByte, bytes.length);
  return out;
}

function buildGlbBytes(chunks: Array<{ type: number; data: Uint8Array }>): Uint8Array {
  let total = 12;
  for (const c of chunks) total += 8 + c.data.length;
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, total, true);
  let offset = 12;
  for (const c of chunks) {
    view.setUint32(offset, c.data.length, true);
    view.setUint32(offset + 4, c.type, true);
    out.set(c.data, offset + 8);
    offset += 8 + c.data.length;
  }
  return out;
}

function minimalInteractivityJson(graphExtra: Record<string, unknown> = {}) {
  return {
    asset: { version: "2.0" },
    extensionsUsed: ["KHR_interactivity"],
    extensions: {
      KHR_interactivity: {
        graph: 0,
        graphs: [{ types: [], declarations: [], nodes: [], ...graphExtra }]
      }
    }
  };
}

// ---------------------------------------------------------------------------
// locateJsonSpan scanner decoys
// ---------------------------------------------------------------------------

describe("locateJsonSpan", () => {
  it("is not fooled by the target key spelled out inside a string value", () => {
    const text = JSON.stringify({
      note: "this mentions extensions.KHR_interactivity.graphs but is just prose",
      extensions: { KHR_interactivity: { graphs: [{ real: true }] } }
    });
    const span = locateJsonSpan(text, ["extensions", "KHR_interactivity", "graphs", 0]);
    expect(span).toBeDefined();
    expect(JSON.parse(text.slice(span!.start, span!.end))).toEqual({ real: true });
  });

  it("threads runs of escaped quotes and backslashes without desyncing", () => {
    const text = JSON.stringify({
      note: 'she said \\"KHR_interactivity\\" and used a literal backslash \\\\ too',
      target: { nested: 42 }
    });
    const span = locateJsonSpan(text, ["target", "nested"]);
    expect(span).toBeDefined();
    expect(text.slice(span!.start, span!.end)).toBe("42");
  });

  it("navigates mixed nested arrays/objects to a deep target", () => {
    const doc = { arr: [[1, 2], [3, { deep: [4, 5, { target: "here" }] }]], other: 1 };
    const text = JSON.stringify(doc);
    const span = locateJsonSpan(text, ["arr", 1, 1, "deep", 2, "target"]);
    expect(span).toBeDefined();
    expect(JSON.parse(text.slice(span!.start, span!.end))).toBe("here");
  });

  it("passes through unicode (including surrogate pairs) unharmed", () => {
    const doc = { emoji: "party 🎉 rocket 🚀", target: "oké" };
    const text = JSON.stringify(doc);
    const span = locateJsonSpan(text, ["target"]);
    expect(span).toBeDefined();
    expect(JSON.parse(text.slice(span!.start, span!.end))).toBe("oké");
  });

  it("distinguishes an integer-shaped object key from an array index", () => {
    const text = JSON.stringify({ "0": "objValue", arr: ["a0", "a1", "a2"] });
    const objSpan = locateJsonSpan(text, ["0"]);
    expect(objSpan).toBeDefined();
    expect(JSON.parse(text.slice(objSpan!.start, objSpan!.end))).toBe("objValue");

    const arrSpan = locateJsonSpan(text, ["arr", 1]);
    expect(arrSpan).toBeDefined();
    expect(JSON.parse(text.slice(arrSpan!.start, arrSpan!.end))).toBe("a1");
  });

  it("returns undefined (not a throw) for a structurally absent path", () => {
    const text = JSON.stringify({ asset: { version: "2.0" } });
    expect(locateJsonSpan(text, ["extensions", "KHR_interactivity", "graphs", 0])).toBeUndefined();
    expect(locateJsonSpan(text, ["asset", "missing"])).toBeUndefined();
  });

  it("locates the whole document with an empty path", () => {
    const text = JSON.stringify({ a: 1 });
    const span = locateJsonSpan(text, []);
    expect(span).toEqual({ start: 0, end: text.length });
  });
});

// ---------------------------------------------------------------------------
// applyEdits
// ---------------------------------------------------------------------------

describe("applyEdits", () => {
  it("applies multiple edits in descending-start order so earlier offsets stay valid", () => {
    const text = "abcdefghij";
    const result = applyEdits(text, [
      { start: 2, end: 4, replacement: "XX" }, // "cd" -> "XX"
      { start: 6, end: 8, replacement: "YYYY" } // "gh" -> "YYYY"
    ]);
    expect(result).toBe("abXXefYYYYij");
  });
});

// ---------------------------------------------------------------------------
// synthetic GLB: unknown chunk preservation
// ---------------------------------------------------------------------------

describe("parseContainer/writeContainer with a synthetic unknown chunk", () => {
  function buildSynthetic() {
    const jsonBytes = pad4(new TextEncoder().encode(JSON.stringify(minimalInteractivityJson())), 0x20);
    const unknownBytes = pad4(new TextEncoder().encode("HELLO-UNKNOWN-CHUNK-DATA"), 0x00);
    const binBytes = pad4(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 0x00);
    const bytes = buildGlbBytes([
      { type: CHUNK_JSON, data: jsonBytes },
      { type: CHUNK_UNKNOWN, data: unknownBytes },
      { type: CHUNK_BIN, data: binBytes }
    ]);
    return { bytes, jsonBytes, unknownBytes, binBytes };
  }

  it("retains every chunk, in order, on parse", () => {
    const { bytes, unknownBytes, binBytes } = buildSynthetic();
    const container = parseContainer(bytes) as Container & { kind: "glb" };
    expect(container.kind).toBe("glb");
    expect(container.chunks.map((c) => c.type)).toEqual([CHUNK_JSON, CHUNK_UNKNOWN, CHUNK_BIN]);
    expect(container.jsonChunkIndex).toBe(0);
    expect(container.chunks[1].bytes).toEqual(unknownBytes);
    expect(container.chunks[2].bytes).toEqual(binBytes);
    expect(new Uint8Array(container.binaryChunk!)).toEqual(binBytes);
  });

  it("round-trips byte-identically with no edits (json length already 4-aligned)", () => {
    const { bytes } = buildSynthetic();
    const container = parseContainer(bytes);
    const out = writeContainer(container) as Uint8Array;
    expect(out).toEqual(bytes);
  });

  it("leaves the unknown chunk and BIN chunk byte-identical after a graph splice", () => {
    const { bytes, unknownBytes, binBytes } = buildSynthetic();
    const container = parseContainer(bytes);
    const { container: newContainer, report } = spliceGraph(container, 0, {
      types: [{ signature: "int" }],
      declarations: [{ op: "math/add" }],
      nodes: []
    });
    expect(report.mode).toBe("splice");
    const newBytes = writeContainer(newContainer) as Uint8Array;
    const reparsed = parseContainer(newBytes) as Container & { kind: "glb" };
    expect(reparsed.chunks.map((c) => c.type)).toEqual([CHUNK_JSON, CHUNK_UNKNOWN, CHUNK_BIN]);
    expect(reparsed.chunks[1].bytes).toEqual(unknownBytes);
    expect(reparsed.chunks[2].bytes).toEqual(binBytes);
    expect((reparsed.json as any).extensions.KHR_interactivity.graphs[0].declarations[0].op).toBe("math/add");
  });
});

// ---------------------------------------------------------------------------
// padding edge cases
// ---------------------------------------------------------------------------

describe("writeContainer JSON chunk padding", () => {
  function jsonTextWithResidue(residue: number): string {
    let pad = "";
    for (;;) {
      const text = JSON.stringify(minimalInteractivityJson({ pad }));
      if (new TextEncoder().encode(text).length % 4 === residue) {
        return text;
      }
      pad += "x";
    }
  }

  for (const residue of [0, 1, 2, 3]) {
    it(`pads a JSON chunk of byte-length %4 === ${residue} up to a 4-byte boundary with 0x20`, () => {
      const jsonText = jsonTextWithResidue(residue);
      const rawBytes = new TextEncoder().encode(jsonText);
      expect(rawBytes.length % 4).toBe(residue);

      const container: Container = {
        kind: "glb",
        chunks: [{ type: CHUNK_JSON, bytes: rawBytes }],
        jsonChunkIndex: 0,
        jsonText,
        json: JSON.parse(jsonText)
      };
      const out = writeContainer(container) as Uint8Array;
      const reparsed = parseContainer(out) as Container & { kind: "glb" };
      const chunkBytes = reparsed.chunks[0].bytes;

      expect(chunkBytes.length % 4).toBe(0);
      const expectedPad = (4 - (residue % 4)) % 4;
      expect(chunkBytes.length - rawBytes.length).toBe(expectedPad);
      expect(chunkBytes.slice(0, rawBytes.length)).toEqual(rawBytes);
      for (let i = rawBytes.length; i < chunkBytes.length; i += 1) {
        expect(chunkBytes[i]).toBe(0x20);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// splice on a real corpus asset
// ---------------------------------------------------------------------------

describe("spliceGraph on the doN corpus GLB", () => {
  it("splices the same graph back in with prefix/suffix and sibling keys byte-identical", () => {
    const buffer = fs.readFileSync(CORPUS_GLB);
    const originalBytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const container = parseContainer(originalBytes) as Container & { kind: "glb" };
    const khr = (container.json as any).extensions.KHR_interactivity;
    const graphIndex = khr.graph ?? 0;
    const originalGraph = khr.graphs[graphIndex];

    const span = locateJsonSpan(container.jsonText, ["extensions", "KHR_interactivity", "graphs", graphIndex]);
    expect(span).toBeDefined();
    expect(JSON.parse(container.jsonText.slice(span!.start, span!.end))).toEqual(originalGraph);

    const { container: newContainer, report } = spliceGraph(container, graphIndex, originalGraph);
    expect(report.mode).toBe("splice");

    const newContainerGlb = newContainer as Container & { kind: "glb" };
    // Prefix/suffix of the JSON text outside the spliced span are untouched.
    expect(newContainerGlb.jsonText.slice(0, span!.start)).toBe(container.jsonText.slice(0, span!.start));
    const suffixLength = container.jsonText.length - span!.end;
    expect(newContainerGlb.jsonText.slice(newContainerGlb.jsonText.length - suffixLength)).toBe(
      container.jsonText.slice(span!.end)
    );

    // The "graph" selector sibling key survives the element-level splice.
    expect((newContainerGlb.json as any).extensions.KHR_interactivity.graph).toBe(graphIndex);

    // Everything outside the JSON chunk (the BIN chunk, byte-verbatim) is untouched.
    const newBytes = writeContainer(newContainer) as Uint8Array;
    const reparsed = parseContainer(newBytes) as Container & { kind: "glb" };
    expect(reparsed.chunks.map((c) => c.type)).toEqual(container.chunks.map((c) => c.type));
    for (let i = 0; i < container.chunks.length; i += 1) {
      if (i === container.jsonChunkIndex) continue;
      expect(reparsed.chunks[i].bytes).toEqual(container.chunks[i].bytes);
    }
  });

  it("round-trips the corpus GLB byte-identically through parse+write with no edits", () => {
    const buffer = fs.readFileSync(CORPUS_GLB);
    const originalBytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const container = parseContainer(originalBytes);
    const out = writeContainer(container) as Uint8Array;
    expect(out).toEqual(originalBytes);
  });
});

// ---------------------------------------------------------------------------
// .gltf (text) variant
// ---------------------------------------------------------------------------

describe("spliceGraph on a .gltf text container", () => {
  it("splices the graph element in plain JSON text, preserving prefix/suffix", () => {
    const json = minimalInteractivityJson({ note: "original" });
    const text = JSON.stringify(json, null, 2); // pretty-printed, unlike the GLB case
    const container = parseContainer(text);
    expect(container.kind).toBe("gltf");

    const span = locateJsonSpan(container.jsonText, ["extensions", "KHR_interactivity", "graphs", 0]);
    expect(span).toBeDefined();

    const newGraph = { types: [], declarations: [{ op: "flow/sequence" }], nodes: [] };
    const { container: newContainer, report } = spliceGraph(container, 0, newGraph);
    expect(report.mode).toBe("splice");
    expect(newContainer.kind).toBe("gltf");

    expect(newContainer.jsonText.slice(0, span!.start)).toBe(container.jsonText.slice(0, span!.start));
    const suffixLength = container.jsonText.length - span!.end;
    expect(newContainer.jsonText.slice(newContainer.jsonText.length - suffixLength)).toBe(
      container.jsonText.slice(span!.end)
    );

    expect((newContainer.json as any).extensions.KHR_interactivity.graphs[0]).toEqual(newGraph);
    expect((newContainer.json as any).extensions.KHR_interactivity.graph).toBe(0);

    const written = writeContainer(newContainer);
    expect(typeof written).toBe("string");
    expect(written).toBe(newContainer.jsonText);
  });

  it("falls back to full reserialize when the extension is absent", () => {
    const text = JSON.stringify({ asset: { version: "2.0" } });
    const container = parseContainer(text);
    const newGraph = { types: [], declarations: [], nodes: [] };
    const { container: newContainer, report } = spliceGraph(container, 0, newGraph);
    expect(report.mode).toBe("reserialize");
    expect((newContainer.json as any).extensions.KHR_interactivity.graphs[0]).toEqual(newGraph);
    expect((newContainer.json as any).extensionsUsed).toContain("KHR_interactivity");
  });
});
