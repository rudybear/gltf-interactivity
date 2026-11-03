// In-memory glTF + binary fixture builder shared by the animation tests of
// kernel, runtime (interpreter) and runtime-lib. Builds just enough JSON
// (accessors/bufferViews/animations/nodes) plus one binary chunk to exercise
// the accessor decoder and sampler; no files, no GLB container.

export class BinBuilder {
  private bytes: number[] = [];
  gltf: any = { nodes: [{}], accessors: [], bufferViews: [], animations: [] };

  // Appends raw bytes (4-byte aligned) and returns the offset.
  private push(data: number[]): number {
    while (this.bytes.length % 4 !== 0) {
      this.bytes.push(0);
    }
    const offset = this.bytes.length;
    this.bytes.push(...data);
    return offset;
  }

  static f32Bytes(values: number[]): number[] {
    const view = new DataView(new ArrayBuffer(values.length * 4));
    values.forEach((v, i) => view.setFloat32(i * 4, v, true));
    return Array.from(new Uint8Array(view.buffer));
  }

  static intBytes(values: number[], size: 1 | 2 | 4, signed: boolean): number[] {
    const view = new DataView(new ArrayBuffer(values.length * size));
    values.forEach((v, i) => {
      if (size === 1) {
        if (signed) view.setInt8(i, v);
        else view.setUint8(i, v);
      } else if (size === 2) {
        if (signed) view.setInt16(i * 2, v, true);
        else view.setUint16(i * 2, v, true);
      } else {
        view.setUint32(i * 4, v, true);
      }
    });
    return Array.from(new Uint8Array(view.buffer));
  }

  bufferView(data: number[], byteStride?: number): number {
    const view: any = { buffer: 0, byteOffset: this.push(data), byteLength: data.length };
    if (byteStride) view.byteStride = byteStride;
    this.gltf.bufferViews.push(view);
    return this.gltf.bufferViews.length - 1;
  }

  accessor(def: any): number {
    this.gltf.accessors.push(def);
    return this.gltf.accessors.length - 1;
  }

  // Tightly packed float accessor (SCALAR ones get min/max, like times).
  floats(type: string, values: number[], comps: number): number {
    const def: any = {
      bufferView: this.bufferView(BinBuilder.f32Bytes(values)),
      componentType: 5126,
      count: values.length / comps,
      type
    };
    if (type === "SCALAR" && values.length > 0) {
      def.min = [Math.min(...values)];
      def.max = [Math.max(...values)];
    }
    return this.accessor(def);
  }

  // Adds an animation with one sampler+channel per entry; returns its index.
  animation(channels: Array<{ input: number; output: number; interpolation?: string; path: string; node?: number }>): number {
    const samplers = channels.map((c) => ({ input: c.input, output: c.output, interpolation: c.interpolation }));
    this.gltf.animations.push({
      samplers,
      channels: channels.map((c, i) => ({ sampler: i, target: { node: c.node ?? 0, path: c.path } }))
    });
    return this.gltf.animations.length - 1;
  }

  build(): { gltf: any; bin: Uint8Array } {
    this.gltf.buffers = [{ byteLength: this.bytes.length }];
    return { gltf: this.gltf, bin: new Uint8Array(this.bytes) };
  }
}

export function binView(bin: Uint8Array): DataView {
  return new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
}

// CUBICSPLINE translation, one 2-keyframe clip over [0, 2].
// Key0: in=0 v=0 out=(1,2,3); key1: in=(4,5,6) v=(10,10,10) out=0.
export function cubicTranslationFixture() {
  const b = new BinBuilder();
  const input = b.floats("SCALAR", [0, 2], 1);
  const output = b.floats("VEC3", [0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 10, 10, 10, 0, 0, 0], 3);
  b.animation([{ input, output, interpolation: "CUBICSPLINE", path: "translation" }]);
  return b.build();
}

// CUBICSPLINE rotation over [0, 1] whose Hermite result is not unit length.
export function cubicRotationFixture() {
  const b = new BinBuilder();
  const input = b.floats("SCALAR", [0, 1], 1);
  const s = Math.SQRT1_2;
  const output = b.floats(
    "VEC4",
    [0, 0, 0, 0, /* in0 */ 0, 0, 0, 1, /* v0 */ 0, 0, 0.8, 0, /* out0 */ 0, 0, 0, 0.4, /* in1 */ 0, 0, s, s, /* v1 */ 0, 0, 0, 0 /* out1 */],
    4
  );
  b.animation([{ input, output, interpolation: "CUBICSPLINE", path: "rotation" }]);
  return b.build();
}
