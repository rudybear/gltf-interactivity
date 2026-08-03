import { mat4LookAt, mat4Multiply, mat4Perspective, type Mat4, type Vec3 } from "./math.js";

export class OrbitCamera {
  private target: Vec3 = [0, 0, 0];
  private distance = 3.0;
  private minDistance = 0.15;
  private maxDistance = 60;
  private yaw = Math.PI * 0.25;
  private pitch = Math.PI * 0.15;
  private aspect = 16 / 9;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;

  setAspect(aspect: number) {
    this.aspect = aspect || 1;
  }

  setTarget(target: Vec3) {
    this.target = [...target];
  }

  setDistance(distance: number) {
    this.distance = Math.max(1e-4, distance);
    // Keep zoom limits proportional to the framed scene so both tiny and
    // huge assets stay navigable.
    this.minDistance = this.distance * 0.05;
    this.maxDistance = this.distance * 20;
  }

  onPointerDown(clientX: number, clientY: number) {
    this.dragging = true;
    this.lastX = clientX;
    this.lastY = clientY;
  }

  onPointerMove(clientX: number, clientY: number) {
    if (!this.dragging) {
      return;
    }
    const dx = clientX - this.lastX;
    const dy = clientY - this.lastY;
    this.lastX = clientX;
    this.lastY = clientY;

    this.yaw -= dx * 0.005;
    this.pitch -= dy * 0.005;
    const limit = Math.PI * 0.45;
    this.pitch = Math.max(-limit, Math.min(limit, this.pitch));
  }

  onPointerUp() {
    this.dragging = false;
  }

  onWheel(deltaY: number) {
    const zoom = Math.exp(deltaY * 0.001);
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance * zoom));
  }

  getViewProjection(): Mat4 {
    const eye = this.getEyePosition();
    const view = mat4LookAt(eye, this.target, [0, 1, 0]);
    // Scale near/far with the viewing distance so scenes of any magnitude
    // (millimeters to hundreds of meters) stay inside the depth range.
    const near = Math.max(1e-4, this.distance * 0.01);
    const far = Math.max(100, this.distance * 50);
    const proj = mat4Perspective(Math.PI / 3, this.aspect, near, far);
    return mat4Multiply(proj, view);
  }

  getEyePosition(): Vec3 {
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const cosYaw = Math.cos(this.yaw);
    const sinYaw = Math.sin(this.yaw);

    return [
      this.target[0] + this.distance * cosPitch * cosYaw,
      this.target[1] + this.distance * sinPitch,
      this.target[2] + this.distance * cosPitch * sinYaw
    ];
  }

  getRotation(): [number, number, number, number] {
    const eye = this.getEyePosition();
    const forward = normalize([
      this.target[0] - eye[0],
      this.target[1] - eye[1],
      this.target[2] - eye[2]
    ]);
    const right = normalize(cross([0, 1, 0], forward));
    const up = cross(forward, right);
    const z = [-forward[0], -forward[1], -forward[2]];
    return mat3ToQuat(
      right[0], up[0], z[0],
      right[1], up[1], z[1],
      right[2], up[2], z[2]
    );
  }
}

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

function mat3ToQuat(
  m00: number, m01: number, m02: number,
  m10: number, m11: number, m12: number,
  m20: number, m21: number, m22: number
): [number, number, number, number] {
  const trace = m00 + m11 + m22;
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    const w = 0.25 * s;
    const x = (m21 - m12) / s;
    const y = (m02 - m20) / s;
    const z = (m10 - m01) / s;
    return [x, y, z, w];
  }
  if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
    const w = (m21 - m12) / s;
    const x = 0.25 * s;
    const y = (m01 + m10) / s;
    const z = (m02 + m20) / s;
    return [x, y, z, w];
  }
  if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
    const w = (m02 - m20) / s;
    const x = (m01 + m10) / s;
    const y = 0.25 * s;
    const z = (m12 + m21) / s;
    return [x, y, z, w];
  }
  const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
  const w = (m10 - m01) / s;
  const x = (m02 + m20) / s;
  const y = (m12 + m21) / s;
  const z = 0.25 * s;
  return [x, y, z, w];
}
