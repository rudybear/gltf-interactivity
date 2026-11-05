import { describe, expect, it } from "vitest";
import { assertValidExtension, assertValidGraph, type ActiveCameraProjection } from "../src/index.js";

describe("package root exports", () => {
  it("exports assertValidExtension / assertValidGraph and the ActiveCameraProjection type", () => {
    const proj = { type: "perspective" } as ActiveCameraProjection;
    expect(proj).toBeDefined();
    expect(typeof assertValidExtension).toBe("function");
    expect(typeof assertValidGraph).toBe("function");
  });
});
