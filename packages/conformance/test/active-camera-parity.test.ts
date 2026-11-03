// Interpreter vs compiled-engine parity for the per-tick setActiveCamera feed.
import { describe, expect, it } from "vitest";
import { readActiveCameraPointer, type ActiveCameraProjection } from "@gltfi/kernel";
import { createEngine } from "@gltfi/runtime-lib";
import { InteractivityRuntime } from "@gltfi/runtime";

const A = "/extensions/KHR_interactivity/activeCamera/";
const PATHS: Array<[string, "float" | "float3" | "float4"]> = [
  ["position", "float3"],
  ["rotation", "float4"],
  ["perspective/aspectRatio", "float"],
  ["perspective/yfov", "float"],
  ["perspective/znear", "float"],
  ["perspective/zfar", "float"],
  ["orthographic/xmag", "float"],
  ["orthographic/ymag", "float"],
  ["orthographic/znear", "float"],
  ["orthographic/zfar", "float"]
];

describe("setActiveCamera parity (interpreter vs compiled)", () => {
  it("every activeCamera pointer reads identically across a camera sequence", () => {
    const interp = new InteractivityRuntime({ types: [], nodes: [], variables: [], events: [], declarations: [] } as never, {}, null, { validate: false }) as unknown as {
      setActiveCamera: InteractivityRuntime["setActiveCamera"];
      runtime: {
        activeCameraPosition: number[] | null;
        activeCameraRotation: number[] | null;
        activeCameraProjection: ActiveCameraProjection | null;
      };
    };
    let compiledRead: (p: string, t: string) => unknown = () => NaN;
    const engine = createEngine((rt) => {
      compiledRead = (p, t) => rt.ptrGet(A + p, t as "float").value;
    })({ gltf: {} });
    engine.start();

    const seq: Array<[[number, number, number], [number, number, number, number], ActiveCameraProjection | null | undefined]> = [
      [[0, 1, 5], [0, 0, 0, 1], { type: "perspective", aspectRatio: 1.5, yfov: 0.7, znear: 0.1, zfar: 50 }],
      [[3, 2, 1], [0, 1, 0, 0], undefined],
      [[-1, -2, -3], [1, 0, 0, 0], { type: "orthographic", xmag: 2, ymag: 4, znear: 0.5, zfar: 20 }]
    ];
    for (const [pos, rot, proj] of seq) {
      interp.setActiveCamera(pos, rot, proj);
      engine.setActiveCamera(pos, rot, proj);
      engine.advance(0.1);
      for (const [p, t] of PATHS) {
        const expected = readActiveCameraPointer(
          {
            position: interp.runtime.activeCameraPosition,
            rotation: interp.runtime.activeCameraRotation,
            projection: interp.runtime.activeCameraProjection
          },
          A + p
        )!;
        expect(expected.type).toBe(t);
        expect(compiledRead(p, t), p).toEqual(t === "float" ? expected.value[0] : expected.value);
      }
    }
  });
});
