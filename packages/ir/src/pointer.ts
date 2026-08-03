// KHR_interactivity JSON Pointer Template parsing/formatting: pointer/get,
// pointer/set, pointer/interpolate all carry a `pointer` config string whose
// "/"-delimited segments are either literal reference tokens, an int
// template parameter `[name]`, or a ref template parameter `{name}`. A
// literal segment that needs a literal bracket character doubles it
// (`[[` -> `[`, `]]` -> `]`, `{{` -> `{`, `}}` -> `}`); standard JSON Pointer
// escapes (`~0` -> `~`, `~1` -> `/`) are untouched here — they're a separate,
// pre-existing escaping layer we don't decode.
import type { PtrSegment, PtrTemplate } from "./model.js";

const INT_PARAM = /^\[([^[\]]+)\]$/;
const REF_PARAM = /^\{([^{}]+)\}$/;

export function parsePointerTemplate(pointer: string): PtrTemplate {
  const raw = pointer.split("/");
  // Pointers always start with "/"; raw[0] is the empty string before it.
  const segments: PtrSegment[] = [];
  for (let i = 1; i < raw.length; i += 1) {
    const seg = raw[i];
    const intMatch = INT_PARAM.exec(seg);
    if (intMatch) {
      segments.push({ k: "int", name: intMatch[1] });
      continue;
    }
    const refMatch = REF_PARAM.exec(seg);
    if (refMatch) {
      segments.push({ k: "ref", name: refMatch[1] });
      continue;
    }
    const text = seg.replace(/\[\[/g, "[").replace(/\]\]/g, "]").replace(/\{\{/g, "{").replace(/\}\}/g, "}");
    segments.push({ k: "lit", text });
  }
  return { segments };
}

// Ordered list of the template's parameter names (int then ref, in the order
// they appear in the pointer) — matches the dynamic value-socket names the
// spec generates for a pointer/get|set|interpolate node's `pointerTemplate`
// configSockets.
export function pointerTemplateParams(template: PtrTemplate): Array<{ name: string; kind: "int" | "ref" }> {
  const out: Array<{ name: string; kind: "int" | "ref" }> = [];
  for (const seg of template.segments) {
    if (seg.k === "int" || seg.k === "ref") {
      out.push({ name: seg.name, kind: seg.k });
    }
  }
  return out;
}

export function formatPointerTemplate(template: PtrTemplate): string {
  const parts = template.segments.map((seg) => {
    if (seg.k === "int") {
      return `[${seg.name}]`;
    }
    if (seg.k === "ref") {
      return `{${seg.name}}`;
    }
    return seg.text.replace(/\[/g, "[[").replace(/\]/g, "]]").replace(/\{/g, "{{").replace(/\}/g, "}}");
  });
  return `/${parts.join("/")}`;
}
