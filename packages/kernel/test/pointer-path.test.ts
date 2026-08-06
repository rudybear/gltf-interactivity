// F6: the pointer-path grammar (parsePointerTemplate/resolvePointerTemplate)
// and the KHR_interactivity virtual-pointer family table, extracted out of
// @gltfi/runtime's interpreter.ts (see pointer-path.ts's own header for the
// full provenance). These tests exercise the extracted functions directly
// (independent of @gltfi/runtime) so a host embedding this table has a
// contract to depend on beyond "matches whatever interpreter.ts currently
// does".
import { describe, expect, it } from "vitest";
import { KHR_INTERACTIVITY_VIRTUAL_POINTERS, parsePointerTemplate, resolvePointerTemplate } from "../src/pointer-path.js";

describe("parsePointerTemplate", () => {
  it("returns an empty array for a pointer with no template parameters", () => {
    expect(parsePointerTemplate("/nodes/3/translation")).toEqual([]);
  });

  it("parses a single int-kind template parameter (square brackets)", () => {
    expect(parsePointerTemplate("/nodes/[nodeIndex]/translation")).toEqual([{ name: "nodeIndex", kind: "int" }]);
  });

  it("parses a single ref-kind template parameter (curly braces)", () => {
    expect(parsePointerTemplate("/extensions/KHR_interactivity/delays/{delayRef}")).toEqual([
      { name: "delayRef", kind: "ref" }
    ]);
  });

  it("parses multiple template parameters of mixed kind, in pointer order", () => {
    expect(parsePointerTemplate("/nodes/[nodeIndex]/weights/[weightIndex]")).toEqual([
      { name: "nodeIndex", kind: "int" },
      { name: "weightIndex", kind: "int" }
    ]);
    expect(parsePointerTemplate("/materials/[materialIndex]/extensions/foo/{someRef}")).toEqual([
      { name: "materialIndex", kind: "int" },
      { name: "someRef", kind: "ref" }
    ]);
  });

  it("does not treat an empty-name bracket segment as a template parameter", () => {
    expect(parsePointerTemplate("/nodes/[]/translation")).toEqual([]);
    expect(parsePointerTemplate("/nodes/{}/translation")).toEqual([]);
  });
});

describe("resolvePointerTemplate", () => {
  it("substitutes an int-kind parameter with a decimal index", () => {
    expect(resolvePointerTemplate("/nodes/[nodeIndex]/translation", { nodeIndex: 3 })).toBe("/nodes/3/translation");
  });

  it("defaults a missing int-kind parameter's value to 0", () => {
    expect(resolvePointerTemplate("/nodes/[nodeIndex]/translation", {})).toBe("/nodes/0/translation");
  });

  it("substitutes a ref-kind parameter whose reference matches the accumulated prefix", () => {
    expect(
      resolvePointerTemplate("/nodes/{nodeRef}/translation", { nodeRef: "/nodes/5" })
    ).toBe("/nodes/5/translation");
  });

  it("returns null for a ref-kind parameter whose reference's collection doesn't match the template's own prefix", () => {
    // Template says "/nodes/{...}" but the supplied ref points at a
    // material — not a valid substitution.
    expect(
      resolvePointerTemplate("/nodes/{someRef}/translation", { someRef: "/materials/2" })
    ).toBeNull();
  });

  it("returns null for a ref-kind parameter with no value at all", () => {
    expect(resolvePointerTemplate("/nodes/{nodeRef}/translation", {})).toBeNull();
  });

  it("passes a delay:/event: runtime-reference token through unresolved", () => {
    expect(
      resolvePointerTemplate("/extensions/KHR_interactivity/delays/{delayRef}", { delayRef: "delay:7" })
    ).toBe("/extensions/KHR_interactivity/delays/delay:7");
    expect(
      resolvePointerTemplate("/extensions/KHR_interactivity/events/{eventRef}", { eventRef: "event:custom:2" })
    ).toBe("/extensions/KHR_interactivity/events/event:custom:2");
  });

  it("round-trips a pointer with no template parameters unchanged", () => {
    expect(resolvePointerTemplate("/nodes/3/translation", {})).toBe("/nodes/3/translation");
  });
});

describe("KHR_INTERACTIVITY_VIRTUAL_POINTERS", () => {
  it("every family's pattern matches its own documented example shape", () => {
    const examples: Record<string, string> = {
      "activeCamera/position": "/extensions/KHR_interactivity/activeCamera/position",
      "activeCamera/rotation": "/extensions/KHR_interactivity/activeCamera/rotation",
      "asset/majorVersion": "/extensions/KHR_interactivity/asset/majorVersion",
      "asset/minorVersion": "/extensions/KHR_interactivity/asset/minorVersion",
      "asset/extensions/{name}/enabled": "/extensions/KHR_interactivity/asset/extensions/{extName}/enabled",
      "limits/*": "/extensions/KHR_interactivity/limits/maxActiveDelays",
      "animations/{n}/extensions/KHR_interactivity/isPlaying": "/animations/2/extensions/KHR_interactivity/isPlaying",
      "animations/{n}/extensions/KHR_interactivity/{minTime,maxTime,playhead,virtualPlayhead}":
        "/animations/2/extensions/KHR_interactivity/playhead",
      "delays/{delayRef}": "/extensions/KHR_interactivity/delays/{delayRef}",
      "events/{eventRef}": "/extensions/KHR_interactivity/events/{eventRef}"
    };
    expect(Object.keys(examples).sort()).toEqual(KHR_INTERACTIVITY_VIRTUAL_POINTERS.map((f) => f.family).sort());
    for (const entry of KHR_INTERACTIVITY_VIRTUAL_POINTERS) {
      const example = examples[entry.family];
      expect(entry.pattern.test(example), `${entry.family}'s pattern should match "${example}"`).toBe(true);
    }
  });

  it("every family declares a value type and read-only flag", () => {
    for (const entry of KHR_INTERACTIVITY_VIRTUAL_POINTERS) {
      expect(typeof entry.type).toBe("string");
      expect(typeof entry.readOnly).toBe("boolean");
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });
});
