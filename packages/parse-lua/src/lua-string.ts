// Inverse of @gltfi/emit-lua's `luaStringLiteral` (emit.ts): decodes a Lua
// double-quoted string literal's RAW source text (including the surrounding
// quotes) back to the original JS string. Deliberately hand-rolled instead of
// relying on luaparse's own `StringLiteral.value` field: luaparse's default
// `encodingMode` ("none") discards string values entirely (`value: null`),
// and its alternative modes (`pseudo-latin1`/`x-user-defined`) are byte-level
// encodings that reject/mangle any JS string containing a real multi-byte
// Unicode character (code point > 0xFF) — which genuinely occurs here, since
// `luaStringLiteral` embeds non-ASCII glTF names/log templates literally
// rather than escaping them (see that function's own source: only `"`, `\`,
// `\n`, `\r`, `\t`, and control/DEL chars via `\ddd` are ever escaped;
// anything else, including multi-byte codepoints, passes through as-is). This
// function mirrors exactly that encoding, decoding only the escapes
// `luaStringLiteral` can actually produce — nothing else, since no other Lua
// string syntax (long brackets `[[...]]`, single-quoted strings, `\xHH`/`\z`)
// is ever emitted by this backend.
export function decodeLuaStringLiteral(raw: string): string {
  // `raw` is always `"..."` (luaStringLiteral only ever emits double-quoted
  // strings) — strip the surrounding quotes before decoding escapes.
  const inner = raw.slice(1, -1);
  let out = "";
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i];
    if (ch !== "\\") {
      out += ch;
      continue;
    }
    i += 1;
    const esc = inner[i];
    if (esc === '"') {
      out += '"';
    } else if (esc === "\\") {
      out += "\\";
    } else if (esc === "n") {
      out += "\n";
    } else if (esc === "r") {
      out += "\r";
    } else if (esc === "t") {
      out += "\t";
    } else if (esc >= "0" && esc <= "9") {
      // Lua's decimal byte escape (`\ddd`) is greedy up to 3 digits —
      // luaStringLiteral emits it unpadded (e.g. `\7`, `\31`, `\127`), so
      // decoding must replicate the same greedy-up-to-3-digits grammar
      // rather than assuming a fixed width.
      let digits = esc;
      while (digits.length < 3 && /[0-9]/.test(inner[i + 1] ?? "")) {
        i += 1;
        digits += inner[i];
      }
      out += String.fromCharCode(Number(digits));
    } else {
      // Not a sequence luaStringLiteral ever produces — defensively pass the
      // escaped character through raw rather than throwing, since this is
      // reached only for hand-edited/non-conforming input the surrounding
      // subset validator should already have rejected via a GL1xx code.
      out += esc ?? "";
    }
  }
  return out;
}
