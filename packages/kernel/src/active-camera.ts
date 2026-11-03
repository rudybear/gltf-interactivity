// Host-fed "active camera" state behind the read-only
// `/extensions/KHR_interactivity/activeCamera/*` pointers.
//
// Spec "Active Camera State": `position`/`rotation` are the active camera's
// global pose; `perspective/{aspectRatio,yfov,znear,zfar}` hold the projection
// when it is perspective and `orthographic/{xmag,ymag,znear,zfar}` when it is
// orthographic. "If the active camera does not use a perspective projection,
// all these four values are NaNs" (likewise for orthographic), and an
// implementation MAY provide no active camera at all, in which case position,
// rotation and every projection property are NaNs. These pointers are always
// valid (isValid true) and read-only.
// Environment-neutral (no node/DOM imports).

export type ActiveCameraProjection =
  | { type: "perspective"; aspectRatio: number; yfov: number; znear: number; zfar: number }
  | { type: "orthographic"; xmag: number; ymag: number; znear: number; zfar: number };

export type ActiveCamera = {
  position: [number, number, number];
  rotation: [number, number, number, number];
  projection?: ActiveCameraProjection | null;
};

// The camera the conformance runners hand to every engine: the corpus test
// `pointer/activeCamera` "assumes the viewer renders with an active camera,
// otherwise all values are NaN". Position/rotation are finite, the rotation is
// a unit quaternion and the projection is perspective.
export const CONFORMANCE_ACTIVE_CAMERA: ActiveCamera = {
  position: [0, 1, 5],
  rotation: [0, 0, 0, 1],
  projection: { type: "perspective", aspectRatio: 16 / 9, yfov: 0.8, znear: 0.1, zfar: 100 }
};

const CAMERA_PREFIX = "/extensions/KHR_interactivity/activeCamera/";

// Reads the activeCamera pointer `resolved` against `camera` (null => no
// camera). Returns null when `resolved` is not an activeCamera pointer.
// `type` is the value type of the pointer ("float3", "float4" or "float").
export function readActiveCameraPointer(
  camera: {
    position: readonly number[] | null | undefined;
    rotation: readonly number[] | null | undefined;
    projection?: ActiveCameraProjection | null;
  },
  resolved: string
): { type: "float" | "float3" | "float4"; value: number[] } | null {
  if (!resolved.startsWith(CAMERA_PREFIX)) {
    return null;
  }
  const path = resolved.slice(CAMERA_PREFIX.length);
  if (path === "position") {
    return { type: "float3", value: camera.position ? [...camera.position] : [NaN, NaN, NaN] };
  }
  if (path === "rotation") {
    return { type: "float4", value: camera.rotation ? [...camera.rotation] : [NaN, NaN, NaN, NaN] };
  }
  const m = /^(perspective|orthographic)\/(\w+)$/.exec(path);
  if (!m) {
    return null;
  }
  const kind = m[1];
  const prop = m[2];
  const allowed = kind === "perspective" ? ["aspectRatio", "yfov", "znear", "zfar"] : ["xmag", "ymag", "znear", "zfar"];
  if (!allowed.includes(prop)) {
    return null;
  }
  const projection = camera.projection;
  if (!projection || projection.type !== kind) {
    return { type: "float", value: [NaN] };
  }
  return { type: "float", value: [(projection as Record<string, number | string>)[prop] as number] };
}
