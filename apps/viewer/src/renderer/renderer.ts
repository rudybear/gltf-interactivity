import type { RenderMaterial, RenderPrimitive, RenderScene, RenderSampler } from "@gltfi/gltf";
import type { Mat4 } from "./math.js";
import type { WebGpuContext } from "../shared/webgpu.js";

type RenderMesh = {
  vertexBuffer: GPUBuffer;
  normalBuffer: GPUBuffer;
  colorBuffer: GPUBuffer;
  tangentBuffer: GPUBuffer;
  jointBuffer: GPUBuffer;
  weightBuffer: GPUBuffer;
  uvBuffer: GPUBuffer;
  instanceBuffer: GPUBuffer;
  indexBuffer?: GPUBuffer;
  indexCount?: number;
  vertexCount: number;
  indexFormat?: GPUIndexFormat;
  instanceCount: number;
  materialIndex: number;
  skinBindGroup: GPUBindGroup;
  skinBuffer: GPUBuffer;
  skinUniformBuffer: GPUBuffer;
  jointCount: number;
};

export class Renderer {
  private ctx: WebGpuContext;
  private device: GPUDevice;
  private animationFrameId: number | null = null;
  private pipelineOpaqueCullBack: GPURenderPipeline;
  private pipelineOpaqueDoubleSided: GPURenderPipeline;
  private pipelineBlendCullBack: GPURenderPipeline;
  private pipelineBlendDoubleSided: GPURenderPipeline;
  private mesh: RenderMesh[] = [];
  private uniformBuffer: GPUBuffer;
  private debugBuffer: GPUBuffer;
  private uniformBindGroup: GPUBindGroup;
  private materialBindGroups: GPUBindGroup[] = [];
  private materialUniformBuffers: GPUBuffer[] = [];
  private materials: RenderMaterial[] = [];
  private textures: GPUTexture[] = [];
  private samplers: GPUSampler[] = [];
  private textureSizes: Array<{ width: number; height: number }> = [];
  private whiteTexture: GPUTexture;
  private blackTexture: GPUTexture;
  private normalTexture: GPUTexture;
  private metalRoughTexture: GPUTexture;
  private occlusionTexture: GPUTexture;
  private clearcoatTexture: GPUTexture;
  private clearcoatRoughnessTexture: GPUTexture;
  private sheenColorTexture: GPUTexture;
  private sheenRoughnessTexture: GPUTexture;
  private iblDiffuseTexture: GPUTexture;
  private iblSpecularTexture: GPUTexture;
  private iblSheenTexture: GPUTexture;
  private brdfLutTexture: GPUTexture;
  private defaultSkinBindGroup: GPUBindGroup;
  private defaultSkinBuffer: GPUBuffer;
  private defaultSkinUniform: GPUBuffer;
  private iblSampler: GPUSampler;
  private iblMaxLod = 0;
  private iblEnabled = true;
  private iblIntensity = 1.0;
  private iblLoaded = false;
  private useDebugUv = false;
  private ignoreTexture = false;
  private showTextureMode = 0;
  private flipV = true;
  private sheenBoost = 1.0;
  private defaultSampler: GPUSampler;
  private depthTexture: GPUTexture;
  private viewProjectionProvider: (() => { viewProj: Mat4; cameraPos: [number, number, number] }) | null = null;
  private lastError: string | null = null;
  private deviceLostReason: string | null = null;
  private pipelineError: string | null = null;
  private bindGroupError: string | null = null;

  constructor(ctx: WebGpuContext) {
    this.ctx = ctx;
    this.device = ctx.device;
    const pipelines = this.createPipelines(ctx.device, ctx.format);
    this.pipelineOpaqueCullBack = pipelines.opaqueCullBack;
    this.pipelineOpaqueDoubleSided = pipelines.opaqueDoubleSided;
    this.pipelineBlendCullBack = pipelines.blendCullBack;
    this.pipelineBlendDoubleSided = pipelines.blendDoubleSided;
    const { device } = ctx;
    this.uniformBuffer = device.createBuffer({
      size: 112,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.debugBuffer = device.createBuffer({
      size: 48,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.whiteTexture = this.createSolidTexture([255, 255, 255, 255]);
    this.blackTexture = this.createSolidTexture([0, 0, 0, 255]);
    this.normalTexture = this.createSolidTexture([128, 128, 255, 255]);
    this.metalRoughTexture = this.createSolidTexture([255, 255, 255, 255]);
    this.occlusionTexture = this.createSolidTexture([255, 255, 255, 255]);
    this.clearcoatTexture = this.createSolidTexture([0, 0, 0, 255]);
    this.clearcoatRoughnessTexture = this.createSolidTexture([255, 255, 255, 255]);
    this.sheenColorTexture = this.createSolidTexture([0, 0, 0, 255]);
    this.sheenRoughnessTexture = this.createSolidTexture([255, 255, 255, 255]);
    this.iblDiffuseTexture = this.createSolidCubeTexture([64, 80, 96, 255]);
    this.iblSpecularTexture = this.createSolidCubeTexture([64, 80, 96, 255]);
    this.iblSheenTexture = this.createSolidCubeTexture([64, 80, 96, 255]);
    this.iblMaxLod = 0;
    this.iblLoaded = false;
    this.brdfLutTexture = this.createBrdfLutTexture(128);
    this.defaultSkinBuffer = device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    this.defaultSkinUniform = device.createBuffer({
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(this.defaultSkinUniform, 0, new Uint32Array([0, 0, 0, 0]));
    this.defaultSkinBindGroup = device.createBindGroup({
      layout: this.pipelineOpaqueCullBack.getBindGroupLayout(2),
      entries: [
        { binding: 0, resource: { buffer: this.defaultSkinBuffer } },
        { binding: 1, resource: { buffer: this.defaultSkinUniform } }
      ]
    });
    this.defaultSampler = device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
      addressModeU: "repeat",
      addressModeV: "repeat"
    });
    this.iblSampler = device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
      mipmapFilter: "linear",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge"
    });
    this.uniformBindGroup = this.createUniformBindGroup();
    this.depthTexture = this.createDepthTexture();
    device.lost.then((info) => {
      this.deviceLostReason = info.message || "GPU device lost.";
    });
  }

  resize() {
    const { device, context, format } = this.ctx;
    context.configure({ device, format, alphaMode: "opaque" });
    this.depthTexture.destroy();
    this.depthTexture = this.createDepthTexture();
  }

  start() {
    const render = () => {
      this.drawFrame();
      this.animationFrameId = requestAnimationFrame(render);
    };
    render();
  }

  stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  setScene(scene: RenderScene, images: Array<ImageBitmap | null>) {
    this.materials = scene.materials.length ? scene.materials : [defaultMaterial()];
    this.textures = images.map((bitmap) => (bitmap ? this.createTextureFromBitmap(bitmap) : this.whiteTexture));
    this.textureSizes = images.map((bitmap) => ({
      width: bitmap ? bitmap.width : 1,
      height: bitmap ? bitmap.height : 1
    }));
    this.samplers = scene.samplers.map((sampler) => this.createSampler(sampler));
    const results = this.materials.map((material) => this.createMaterialBindGroup(material));
    this.materialBindGroups = results.map((entry) => entry.bindGroup);
    this.materialUniformBuffers = results.map((entry) => entry.buffer);
    this.setMesh(scene.primitives);
  }

  async probeTexturePixel(index: number, x = 0, y = 0): Promise<[number, number, number, number] | null> {
    const texture = this.textures[index];
    if (!texture) {
      return null;
    }
    const size = this.textureSizes[index] ?? { width: 1, height: 1 };
    const originX = Math.min(size.width - 1, Math.max(0, x));
    const originY = Math.min(size.height - 1, Math.max(0, y));
    const { device } = this;
    const buffer = device.createBuffer({
      size: 256,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
    const encoder = device.createCommandEncoder();
    encoder.copyTextureToBuffer(
      { texture, origin: { x: originX, y: originY, z: 0 } },
      { buffer, bytesPerRow: 256 },
      { width: 1, height: 1, depthOrArrayLayers: 1 }
    );
    device.queue.submit([encoder.finish()]);
    await buffer.mapAsync(GPUMapMode.READ);
    const data = new Uint8Array(buffer.getMappedRange());
    const rgba: [number, number, number, number] = [data[0], data[1], data[2], data[3]];
    buffer.unmap();
    return rgba;
  }

  setDebugUv(enabled: boolean) {
    this.useDebugUv = enabled;
  }

  setIgnoreTexture(enabled: boolean) {
    this.ignoreTexture = enabled;
  }

  setShowTextureMode(mode: number) {
    this.showTextureMode = mode;
  }

  setFlipV(enabled: boolean) {
    this.flipV = enabled;
  }

  setSheenBoost(value: number) {
    this.sheenBoost = value;
  }

  setIblEnabled(enabled: boolean) {
    this.iblEnabled = enabled;
  }

  setIblIntensity(intensity: number) {
    this.iblIntensity = intensity;
  }

  async loadIblFromKtx2Urls(diffuseUrl: string, specularUrl: string, sheenUrl?: string) {
    const [diffuse, specular, sheen] = await Promise.all([
      this.loadCubeTextureFromKtx2(diffuseUrl),
      this.loadCubeTextureFromKtx2(specularUrl),
      sheenUrl ? this.loadCubeTextureFromKtx2(sheenUrl) : Promise.resolve(null)
    ]);
    if (diffuse) {
      this.iblDiffuseTexture.destroy();
      this.iblDiffuseTexture = diffuse.texture;
    }
    if (specular) {
      this.iblSpecularTexture.destroy();
      this.iblSpecularTexture = specular.texture;
      this.iblMaxLod = specular.maxLod;
    }
    if (sheen) {
      this.iblSheenTexture.destroy();
      this.iblSheenTexture = sheen.texture;
    }
    this.iblLoaded = Boolean(diffuse && specular);
    this.uniformBindGroup = this.createUniformBindGroup();
  }

  setMesh(primitives: RenderPrimitive[]) {
    const { device } = this.ctx;
    this.mesh = primitives.map((primitive) => {
      const vertexBuffer = device.createBuffer({
        size: primitive.positions.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });
      device.queue.writeBuffer(
        vertexBuffer,
        0,
        primitive.positions.buffer as ArrayBuffer,
        primitive.positions.byteOffset,
        primitive.positions.byteLength
      );

      const normalBuffer = device.createBuffer({
        size: primitive.normals.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });
      device.queue.writeBuffer(
        normalBuffer,
        0,
        primitive.normals.buffer as ArrayBuffer,
        primitive.normals.byteOffset,
        primitive.normals.byteLength
      );

      const colorBuffer = device.createBuffer({
        size: primitive.colors.byteLength || 16,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });
      if (primitive.colors.byteLength) {
        device.queue.writeBuffer(
          colorBuffer,
          0,
          primitive.colors.buffer as ArrayBuffer,
          primitive.colors.byteOffset,
          primitive.colors.byteLength
        );
      }

      const tangentBuffer = device.createBuffer({
        size: primitive.tangents.byteLength || 16,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });
      if (primitive.tangents.byteLength) {
        device.queue.writeBuffer(
          tangentBuffer,
          0,
          primitive.tangents.buffer as ArrayBuffer,
          primitive.tangents.byteOffset,
          primitive.tangents.byteLength
        );
      }

      const jointBuffer = device.createBuffer({
        size: primitive.joints.byteLength || 8,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });
      if (primitive.joints.byteLength) {
        this.writeBufferAligned(jointBuffer, primitive.joints);
      }

      const weightBuffer = device.createBuffer({
        size: primitive.weights.byteLength || 16,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });
      if (primitive.weights.byteLength) {
        device.queue.writeBuffer(
          weightBuffer,
          0,
          primitive.weights.buffer as ArrayBuffer,
          primitive.weights.byteOffset,
          primitive.weights.byteLength
        );
      }

      const vertexCount = primitive.positions.length / 3;
      const combinedUvs = new Float32Array(vertexCount * 4);
      for (let i = 0; i < vertexCount; i += 1) {
        const uv0Base = i * 2;
        const uv1Base = i * 2;
        const outBase = i * 4;
        combinedUvs[outBase] = primitive.uvs[uv0Base] ?? 0;
        combinedUvs[outBase + 1] = primitive.uvs[uv0Base + 1] ?? 0;
        combinedUvs[outBase + 2] = primitive.uvs1[uv1Base] ?? 0;
        combinedUvs[outBase + 3] = primitive.uvs1[uv1Base + 1] ?? 0;
      }
      const uvBuffer = device.createBuffer({
        size: combinedUvs.byteLength || 16,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });
      if (combinedUvs.byteLength) {
        device.queue.writeBuffer(uvBuffer, 0, combinedUvs.buffer as ArrayBuffer);
      }

      const instanceBuffer = device.createBuffer({
        size: primitive.instances.byteLength || 64,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });
      if (primitive.instances.byteLength) {
        device.queue.writeBuffer(
          instanceBuffer,
          0,
          primitive.instances.buffer as ArrayBuffer,
          primitive.instances.byteOffset,
          primitive.instances.byteLength
        );
      }

      let indexBuffer: GPUBuffer | undefined;
      let indexCount: number | undefined;
      let indexFormat: GPUIndexFormat | undefined;

      if (primitive.indices) {
        indexBuffer = device.createBuffer({
          // writeBufferAligned pads writes to 4-byte multiples; the buffer
          // must be at least that large or the padded write is rejected,
          // which invalidates the whole frame.
          size: Math.ceil(primitive.indices.byteLength / 4) * 4,
          usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
        });
        this.writeBufferAligned(indexBuffer, primitive.indices);
        indexCount = primitive.indices.length;
        indexFormat = primitive.indices instanceof Uint32Array ? "uint32" : "uint16";
      }

      const instanceCount = primitive.instances.length ? primitive.instances.length / 16 : 1;
      const jointCount = primitive.jointMatrices ? primitive.jointMatrices.length / 16 : 0;
      const skinUniformBuffer = device.createBuffer({
        size: 32,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      device.queue.writeBuffer(skinUniformBuffer, 0, new Uint32Array([jointCount, 0, 0, 0]));
      const skinBuffer = device.createBuffer({
        size: Math.max(64, primitive.jointMatrices?.byteLength ?? 64),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
      });
      if (primitive.jointMatrices && primitive.jointMatrices.byteLength) {
        device.queue.writeBuffer(
          skinBuffer,
          0,
          primitive.jointMatrices.buffer as ArrayBuffer,
          primitive.jointMatrices.byteOffset,
          primitive.jointMatrices.byteLength
        );
      }
      const skinBindGroup = device.createBindGroup({
        layout: this.pipelineOpaqueCullBack.getBindGroupLayout(2),
        entries: [
          { binding: 0, resource: { buffer: skinBuffer } },
          { binding: 1, resource: { buffer: skinUniformBuffer } }
        ]
      });

      return {
        vertexBuffer,
        normalBuffer,
        colorBuffer,
        tangentBuffer,
        jointBuffer,
        weightBuffer,
        uvBuffer,
        instanceBuffer,
        indexBuffer,
        indexCount,
        indexFormat,
        vertexCount,
        instanceCount,
        materialIndex: primitive.materialIndex ?? 0,
        skinBindGroup,
        skinBuffer,
        skinUniformBuffer,
        jointCount
      };
    });
  }

  updateInstanceBuffers(primitives: RenderPrimitive[]) {
    const { device } = this.ctx;
    for (let i = 0; i < primitives.length; i += 1) {
      const primitive = primitives[i];
      const mesh = this.mesh[i];
      if (!mesh) {
        continue;
      }
      const nextCount = primitive.instances.length ? primitive.instances.length / 16 : 1;
      if (mesh.instanceBuffer.size < primitive.instances.byteLength) {
        mesh.instanceBuffer = device.createBuffer({
          size: primitive.instances.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
      }
      if (primitive.instances.byteLength) {
        device.queue.writeBuffer(
          mesh.instanceBuffer,
          0,
          primitive.instances.buffer as ArrayBuffer,
          primitive.instances.byteOffset,
          primitive.instances.byteLength
        );
      }
      mesh.instanceCount = nextCount;
    }
  }

  updateMaterialUniforms(materials: RenderMaterial[]) {
    const count = Math.min(materials.length, this.materialUniformBuffers.length);
    for (let i = 0; i < count; i += 1) {
      const buffer = this.materialUniformBuffers[i];
      if (!buffer) {
        continue;
      }
      const data = this.materialUniformData(materials[i]);
      this.device.queue.writeBuffer(buffer, 0, data.buffer as ArrayBuffer, data.byteOffset, data.byteLength);
    }
  }

  updateSkinBuffers(primitives: RenderPrimitive[]) {
    const { device } = this.ctx;
    for (let i = 0; i < primitives.length; i += 1) {
      const primitive = primitives[i];
      const mesh = this.mesh[i];
      if (!mesh) {
        continue;
      }
      if (!primitive.jointMatrices || primitive.jointMatrices.length === 0) {
        device.queue.writeBuffer(mesh.skinUniformBuffer, 0, new Uint32Array([0, 0, 0, 0]));
        continue;
      }
      const jointCount = primitive.jointMatrices.length / 16;
      if (mesh.jointCount !== jointCount) {
        mesh.jointCount = jointCount;
        device.queue.writeBuffer(mesh.skinUniformBuffer, 0, new Uint32Array([jointCount, 0, 0, 0]));
      }
      if (mesh.skinBuffer.size < primitive.jointMatrices.byteLength) {
        mesh.skinBuffer = device.createBuffer({
          size: primitive.jointMatrices.byteLength,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        mesh.skinBindGroup = device.createBindGroup({
          layout: this.pipelineOpaqueCullBack.getBindGroupLayout(2),
          entries: [
            { binding: 0, resource: { buffer: mesh.skinBuffer } },
            { binding: 1, resource: { buffer: mesh.skinUniformBuffer } }
          ]
        });
      }
      device.queue.writeBuffer(
        mesh.skinBuffer,
        0,
        primitive.jointMatrices.buffer as ArrayBuffer,
        primitive.jointMatrices.byteOffset,
        primitive.jointMatrices.byteLength
      );
    }
  }

  setViewProjectionProvider(provider: () => { viewProj: Mat4; cameraPos: [number, number, number] }) {
    this.viewProjectionProvider = provider;
  }

  getDiagnostics() {
    return {
      lastError: this.lastError ?? "none",
      pipelineError: this.pipelineError ?? "none",
      bindGroupError: this.bindGroupError ?? "none",
      deviceLost: this.deviceLostReason ?? "no",
      meshCount: this.mesh.length,
      instanceCount: this.mesh.reduce((total, m) => total + m.instanceCount, 0),
      textureCount: this.textures.length,
      iblLoaded: this.iblLoaded ? "yes" : "no",
      iblMaxLod: this.iblMaxLod
    };
  }

  private drawFrame() {
    const { device, context } = this.ctx;
    const commandEncoder = device.createCommandEncoder();
    const view = context.getCurrentTexture().createView();

    const pass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view,
          clearValue: { r: 0.96, g: 0.94, b: 0.91, a: 1.0 },
          loadOp: "clear",
          storeOp: "store"
        }
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store"
      }
    });
    if (this.viewProjectionProvider) {
      const { viewProj, cameraPos } = this.viewProjectionProvider();
      device.queue.writeBuffer(
        this.uniformBuffer,
        0,
        viewProj.buffer as ArrayBuffer,
        viewProj.byteOffset,
        viewProj.byteLength
      );
      const light = new Float32Array([0.2, 0.8, 0.6, 0]);
      device.queue.writeBuffer(
        this.uniformBuffer,
        64,
        light.buffer as ArrayBuffer,
        light.byteOffset,
        light.byteLength
      );
      const cam = new Float32Array([cameraPos[0], cameraPos[1], cameraPos[2], 0]);
      device.queue.writeBuffer(
        this.uniformBuffer,
        80,
        cam.buffer as ArrayBuffer,
        cam.byteOffset,
        cam.byteLength
      );
      const ibl = new Float32Array([
        this.iblIntensity,
        this.iblMaxLod,
        this.iblEnabled ? 1 : 0,
        0
      ]);
      device.queue.writeBuffer(
        this.uniformBuffer,
        96,
        ibl.buffer as ArrayBuffer,
        ibl.byteOffset,
        ibl.byteLength
      );
      const debug = new Float32Array([
        this.useDebugUv ? 1 : 0,
        this.ignoreTexture ? 1 : 0,
        this.showTextureMode,
        this.flipV ? 1 : 0,
        this.sheenBoost,
        this.showTextureMode > 4.5 ? 1 : 0,
        0,
        0
      ]);
      device.queue.writeBuffer(
        this.debugBuffer,
        0,
        debug.buffer as ArrayBuffer,
        debug.byteOffset,
        debug.byteLength
      );
    }

    if (!this.pipelineError) {
      pass.setBindGroup(0, this.uniformBindGroup);
      for (const mesh of this.mesh) {
        const material = this.materials[mesh.materialIndex] ?? defaultMaterial();
        const useBlend = material.alphaMode === 2;
        const pipeline = material.doubleSided
          ? (useBlend ? this.pipelineBlendDoubleSided : this.pipelineOpaqueDoubleSided)
          : (useBlend ? this.pipelineBlendCullBack : this.pipelineOpaqueCullBack);
        pass.setPipeline(pipeline);
        pass.setBindGroup(1, this.materialBindGroups[mesh.materialIndex] ?? this.materialBindGroups[0]);
        pass.setBindGroup(2, mesh.skinBindGroup ?? this.defaultSkinBindGroup);
        pass.setVertexBuffer(0, mesh.vertexBuffer);
        pass.setVertexBuffer(1, mesh.normalBuffer);
        pass.setVertexBuffer(2, mesh.colorBuffer);
        pass.setVertexBuffer(3, mesh.tangentBuffer);
        pass.setVertexBuffer(4, mesh.jointBuffer);
        pass.setVertexBuffer(5, mesh.weightBuffer);
        pass.setVertexBuffer(6, mesh.uvBuffer);
        pass.setVertexBuffer(7, mesh.instanceBuffer);
        if (mesh.indexBuffer && mesh.indexCount && mesh.indexFormat) {
          pass.setIndexBuffer(mesh.indexBuffer, mesh.indexFormat);
          pass.drawIndexed(mesh.indexCount, mesh.instanceCount);
        } else {
          pass.draw(mesh.vertexCount, mesh.instanceCount);
        }
      }
    }
    pass.end();
    device.pushErrorScope("validation");
    device.queue.submit([commandEncoder.finish()]);
    device.popErrorScope().then((error) => {
      if (error) {
        this.lastError = error.message;
      }
    });
  }

  private createTextureFromBitmap(bitmap: ImageBitmap): GPUTexture {
    const { device } = this.ctx;
    const mipLevelCount = this.getMipLevelCount(bitmap.width, bitmap.height);
    const texture = device.createTexture({
      size: [bitmap.width, bitmap.height, 1],
      format: "rgba8unorm",
      mipLevelCount,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC
    });
    const baseData = this.bitmapToImageData(bitmap);
    this.writeTextureLevel(texture, baseData, bitmap.width, bitmap.height, 0, 0, 4);
    this.generateMipmaps(texture, baseData, bitmap.width, bitmap.height);
    return texture;
  }

  private bitmapToImageData(bitmap: ImageBitmap): Uint8Array {
    const width = bitmap.width;
    const height = bitmap.height;
    const canvas = typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(width, height)
      : document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return new Uint8Array(width * height * 4);
    }
    ctx.translate(0, height);
    ctx.scale(1, -1);
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, width, height);
    return new Uint8Array(imageData.data);
  }

  private createSolidTexture(color: [number, number, number, number]): GPUTexture {
    const { device } = this.ctx;
    const texture = device.createTexture({
      size: [1, 1, 1],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC
    });
    device.queue.writeTexture(
      { texture },
      new Uint8Array(color),
      { bytesPerRow: 4 },
      { width: 1, height: 1, depthOrArrayLayers: 1 }
    );
    return texture;
  }

  private createSolidCubeTexture(color: [number, number, number, number]): GPUTexture {
    const { device } = this.ctx;
    const texture = device.createTexture({
      size: [1, 1, 6],
      dimension: "2d",
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    });
    for (let face = 0; face < 6; face += 1) {
      device.queue.writeTexture(
        { texture, origin: { x: 0, y: 0, z: face } },
        new Uint8Array(color),
        { bytesPerRow: 4 },
        { width: 1, height: 1, depthOrArrayLayers: 1 }
      );
    }
    return texture;
  }

  private createBrdfLutTexture(size: number): GPUTexture {
    const { device } = this.ctx;
    const data = this.generateBrdfLut(size);
    const texture = device.createTexture({
      size: [size, size, 1],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    });
    this.writeTextureLevel(texture, data, size, size, 0, 0, 4);
    return texture;
  }

  private generateBrdfLut(size: number): Uint8Array {
    const result = new Uint8Array(size * size * 4);
    const sampleCount = 512;
    for (let y = 0; y < size; y += 1) {
      const roughness = (y + 0.5) / size;
      for (let x = 0; x < size; x += 1) {
        const ndotv = (x + 0.5) / size;
        const [a, b] = this.integrateBrdf(ndotv, roughness, sampleCount);
        const idx = (y * size + x) * 4;
        result[idx] = Math.max(0, Math.min(255, Math.round(a * 255)));
        result[idx + 1] = Math.max(0, Math.min(255, Math.round(b * 255)));
        result[idx + 2] = 0;
        result[idx + 3] = 255;
      }
    }
    return result;
  }

  private integrateBrdf(ndotv: number, roughness: number, sampleCount: number): [number, number] {
    const V = [Math.sqrt(Math.max(0, 1 - ndotv * ndotv)), 0, ndotv];
    let A = 0;
    let B = 0;
    for (let i = 0; i < sampleCount; i += 1) {
      const xi = this.hammersley(i, sampleCount);
      const H = this.importanceSampleGGX(xi[0], xi[1], roughness);
      const VdotH = Math.max(0, V[0] * H[0] + V[1] * H[1] + V[2] * H[2]);
      const L = [
        2 * VdotH * H[0] - V[0],
        2 * VdotH * H[1] - V[1],
        2 * VdotH * H[2] - V[2]
      ];
      const NdotL = Math.max(L[2], 0);
      const NdotH = Math.max(H[2], 0);
      if (NdotL > 0) {
        const G = this.geometrySmith(ndotv, NdotL, roughness);
        const GVis = (G * VdotH) / Math.max(NdotH * ndotv, 1e-5);
        const Fc = Math.pow(1 - VdotH, 5);
        A += (1 - Fc) * GVis;
        B += Fc * GVis;
      }
    }
    return [A / sampleCount, B / sampleCount];
  }

  private geometrySmith(ndotv: number, ndotl: number, roughness: number): number {
    const r = roughness + 1.0;
    const k = (r * r) / 8.0;
    const ggxV = ndotv / (ndotv * (1 - k) + k);
    const ggxL = ndotl / (ndotl * (1 - k) + k);
    return ggxV * ggxL;
  }

  private importanceSampleGGX(u: number, v: number, roughness: number): [number, number, number] {
    const a = roughness * roughness;
    const phi = 2 * Math.PI * u;
    const cosTheta = Math.sqrt((1 - v) / (1 + (a * a - 1) * v));
    const sinTheta = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta));
    return [Math.cos(phi) * sinTheta, Math.sin(phi) * sinTheta, cosTheta];
  }

  private hammersley(i: number, n: number): [number, number] {
    return [i / n, this.radicalInverseVdc(i)];
  }

  private radicalInverseVdc(bits: number): number {
    let v = bits >>> 0;
    v = ((v << 16) | (v >>> 16)) >>> 0;
    v = ((v & 0x55555555) << 1) | ((v & 0xaaaaaaaa) >>> 1);
    v = ((v & 0x33333333) << 2) | ((v & 0xcccccccc) >>> 2);
    v = ((v & 0x0f0f0f0f) << 4) | ((v & 0xf0f0f0f0) >>> 4);
    v = ((v & 0x00ff00ff) << 8) | ((v & 0xff00ff00) >>> 8);
    return v * 2.3283064365386963e-10;
  }

  private float32ToFloat16(value: number): number {
    return Math.max(0, Math.min(65535, Math.round(value * 65535)));
  }

  private createUniformBindGroup() {
    const { device } = this.ctx;
    device.pushErrorScope("validation");
    const bindGroup = device.createBindGroup({
      layout: this.pipelineOpaqueCullBack.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
        { binding: 1, resource: { buffer: this.debugBuffer } },
        { binding: 2, resource: this.iblSampler },
        { binding: 3, resource: this.iblDiffuseTexture.createView({ dimension: "cube" }) },
        { binding: 4, resource: this.iblSpecularTexture.createView({ dimension: "cube" }) },
        { binding: 5, resource: this.brdfLutTexture.createView() },
        { binding: 6, resource: this.iblSheenTexture.createView({ dimension: "cube" }) }
      ]
    });
    device.popErrorScope().then((error) => {
      if (error) {
        this.bindGroupError = error.message;
      } else {
        this.bindGroupError = "none";
      }
    });
    return bindGroup;
  }

  private async loadCubeTextureFromKtx2(url: string): Promise<{ texture: GPUTexture; maxLod: number } | null> {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const buffer = await response.arrayBuffer();
    const parsed = this.parseKtx2(buffer);
    if (!parsed) {
      return null;
    }
    const { width, height, faceCount, levelCount, format, levels, bytesPerPixel } = parsed;
    const texture = this.device.createTexture({
      size: [width, height, faceCount],
      dimension: "2d",
      format,
      mipLevelCount: levelCount,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    });
    for (let level = 0; level < levelCount; level += 1) {
      const levelWidth = Math.max(1, width >> level);
      const levelHeight = Math.max(1, height >> level);
      const levelBytes = levels[level];
      if (!levelBytes) {
        continue;
      }
      const faceStride = Math.floor(levelBytes.byteLength / faceCount);
      const faceSize = levelWidth * levelHeight * bytesPerPixel;
      for (let face = 0; face < faceCount; face += 1) {
        const offset = levelBytes.byteOffset + face * faceStride;
        const length = Math.min(faceSize, levelBytes.byteLength - face * faceStride);
        const slice = new Uint8Array(buffer, offset, length);
        this.writeTextureLevel(texture, slice, levelWidth, levelHeight, level, face, bytesPerPixel);
      }
    }
    return { texture, maxLod: levelCount - 1 };
  }

  private parseKtx2(buffer: ArrayBuffer): {
    width: number;
    height: number;
    faceCount: number;
    levelCount: number;
    format: GPUTextureFormat;
    bytesPerPixel: number;
    levels: Array<{ byteOffset: number; byteLength: number }>;
  } | null {
    const headerSize = 80;
    if (buffer.byteLength < headerSize) {
      return null;
    }
    const view = new DataView(buffer);
    const identifier = new Uint8Array(buffer, 0, 12);
    const expected = [0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a];
    for (let i = 0; i < expected.length; i += 1) {
      if (identifier[i] !== expected[i]) {
        return null;
      }
    }
    const vkFormat = view.getUint32(12, true);
    const width = view.getUint32(20, true);
    const height = view.getUint32(24, true);
    const faceCount = view.getUint32(36, true) || 1;
    const levelCount = view.getUint32(40, true) || 1;
    const supercompression = view.getUint32(44, true);
    const dfdByteOffset = view.getUint32(48, true);
    const dfdByteLength = view.getUint32(52, true);
    const kvdByteOffset = view.getUint32(56, true);
    const kvdByteLength = view.getUint32(60, true);
    const sgdByteOffset = Number(view.getBigUint64(64, true));
    const sgdByteLength = Number(view.getBigUint64(72, true));
    if (supercompression !== 0) {
      return null;
    }
    const mapping = this.mapKtx2Format(vkFormat);
    if (!mapping) {
      return null;
    }
    const { format, bytesPerPixel } = mapping;
    const levelIndexOffset = headerSize;
    const levels: Array<{ byteOffset: number; byteLength: number }> = [];
    for (let i = 0; i < levelCount; i += 1) {
      const base = levelIndexOffset + i * 24;
      const byteOffset = Number(view.getBigUint64(base, true));
      const byteLength = Number(view.getBigUint64(base + 8, true));
      levels.push({ byteOffset, byteLength });
    }
    if (dfdByteOffset === 0 || dfdByteLength === 0) {
      return null;
    }
    if (kvdByteOffset !== 0 && kvdByteLength === 0) {
      return null;
    }
    if (sgdByteOffset !== 0 && sgdByteLength === 0) {
      return null;
    }
    return { width, height, faceCount, levelCount, format, bytesPerPixel, levels };
  }

  private mapKtx2Format(vkFormat: number): { format: GPUTextureFormat; bytesPerPixel: number } | null {
    switch (vkFormat) {
      case 97:
        return { format: "rgba16float", bytesPerPixel: 8 };
      default:
        return null;
    }
  }

  private getMipLevelCount(width: number, height: number): number {
    return Math.floor(Math.log2(Math.max(width, height))) + 1;
  }

  private generateMipmaps(texture: GPUTexture, baseData: Uint8Array, width: number, height: number) {
    let prev = baseData;
    let prevWidth = width;
    let prevHeight = height;
    const levels = this.getMipLevelCount(width, height);
    for (let level = 1; level < levels; level += 1) {
      const nextWidth = Math.max(1, Math.floor(prevWidth / 2));
      const nextHeight = Math.max(1, Math.floor(prevHeight / 2));
      const next = new Uint8Array(nextWidth * nextHeight * 4);
      for (let y = 0; y < nextHeight; y += 1) {
        for (let x = 0; x < nextWidth; x += 1) {
          for (let c = 0; c < 4; c += 1) {
            let sum = 0;
            for (let dy = 0; dy < 2; dy += 1) {
              for (let dx = 0; dx < 2; dx += 1) {
                const sx = Math.min(prevWidth - 1, x * 2 + dx);
                const sy = Math.min(prevHeight - 1, y * 2 + dy);
                sum += prev[(sy * prevWidth + sx) * 4 + c];
              }
            }
            next[(y * nextWidth + x) * 4 + c] = Math.round(sum / 4);
          }
        }
      }
      this.writeTextureLevel(texture, next, nextWidth, nextHeight, level, 0, 4);
      prev = next;
      prevWidth = nextWidth;
      prevHeight = nextHeight;
    }
  }

  private writeTextureLevel(
    texture: GPUTexture,
    data: ArrayBufferView,
    width: number,
    height: number,
    mipLevel: number,
    arrayLayer: number,
    bytesPerPixel: number
  ) {
    const { device } = this.ctx;
    const bytesPerRow = width * bytesPerPixel;
    const alignedBytesPerRow = Math.ceil(bytesPerRow / 256) * 256;
    const padded = new Uint8Array(alignedBytesPerRow * height);
    const raw = data instanceof Uint8Array
      ? data
      : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    for (let y = 0; y < height; y += 1) {
      const srcOffset = y * bytesPerRow;
      const dstOffset = y * alignedBytesPerRow;
      padded.set(raw.subarray(srcOffset, srcOffset + bytesPerRow), dstOffset);
    }
    device.queue.writeTexture(
      { texture, mipLevel, origin: { x: 0, y: 0, z: arrayLayer } },
      padded,
      { bytesPerRow: alignedBytesPerRow, rowsPerImage: height },
      { width, height, depthOrArrayLayers: 1 }
    );
  }
  private createSampler(sampler: RenderSampler): GPUSampler {
    const magFilter = sampler.magFilter === 9728 ? "nearest" : "linear";
    let minFilter: GPUFilterMode = "linear";
    let mipmapFilter: GPUMipmapFilterMode = "linear";
    switch (sampler.minFilter) {
      case 9728:
        minFilter = "nearest";
        mipmapFilter = "nearest";
        break;
      case 9729:
        minFilter = "linear";
        mipmapFilter = "nearest";
        break;
      case 9984:
        minFilter = "nearest";
        mipmapFilter = "nearest";
        break;
      case 9985:
        minFilter = "linear";
        mipmapFilter = "nearest";
        break;
      case 9986:
        minFilter = "nearest";
        mipmapFilter = "linear";
        break;
      case 9987:
        minFilter = "linear";
        mipmapFilter = "linear";
        break;
      default:
        break;
    }

    return this.device.createSampler({
      magFilter,
      minFilter,
      mipmapFilter,
      addressModeU: this.mapWrap(sampler.wrapS),
      addressModeV: this.mapWrap(sampler.wrapT)
    });
  }

  private mapWrap(wrap: number): GPUAddressMode {
    switch (wrap) {
      case 33071:
        return "clamp-to-edge";
      case 33648:
        return "mirror-repeat";
      default:
        return "repeat";
    }
  }

  private createPipelines(device: GPUDevice, format: GPUTextureFormat) {
    const shader = device.createShaderModule({
      code: `
        const PI = 3.14159265359;

        struct SceneUniforms {
          viewProj: mat4x4<f32>,
          lightDir: vec3<f32>,
          padding: f32,
          cameraPos: vec3<f32>,
          padding2: f32,
          ibl: vec4<f32>,
        }

        struct DebugUniforms {
          showUv: f32,
          ignoreTexture: f32,
          showTextureMode: f32,
          flipV: f32,
          sheenBoost: f32,
          sheenDebug: f32,
          padding: vec3<f32>,
        }

        @group(0) @binding(0) var<uniform> scene: SceneUniforms;
        @group(0) @binding(1) var<uniform> debug: DebugUniforms;
        @group(0) @binding(2) var iblSampler: sampler;
        @group(0) @binding(3) var iblDiffuse: texture_cube<f32>;
        @group(0) @binding(4) var iblSpecular: texture_cube<f32>;
        @group(0) @binding(5) var brdfLut: texture_2d<f32>;
        @group(0) @binding(6) var iblSheen: texture_cube<f32>;

        struct SkinUniforms {
          jointCount: u32,
          padding: vec3<u32>,
        }

        @group(2) @binding(0) var<storage, read> jointMatrices: array<mat4x4<f32>>;
        @group(2) @binding(1) var<uniform> skin: SkinUniforms;

        struct TextureTransform {
          scaleOffset: vec4<f32>,
          rotation: vec2<f32>,
          texCoord: f32,
          hasTexture: f32,
        }

        struct MaterialUniforms {
          baseColorFactor: vec4<f32>,
          metallicRoughness: vec4<f32>,
          emissiveFactor: vec4<f32>,
          flags: vec4<f32>,
          clearcoatSheen: vec4<f32>,
          sheenColorFactor: vec4<f32>,
          baseColorTransform: TextureTransform,
          metallicRoughnessTransform: TextureTransform,
          normalTransform: TextureTransform,
          occlusionTransform: TextureTransform,
          emissiveTransform: TextureTransform,
          clearcoatTransform: TextureTransform,
          clearcoatRoughnessTransform: TextureTransform,
          clearcoatNormalTransform: TextureTransform,
          sheenColorTransform: TextureTransform,
          sheenRoughnessTransform: TextureTransform,
        }

        @group(1) @binding(0) var<uniform> material: MaterialUniforms;
        @group(1) @binding(1) var baseSampler: sampler;
        @group(1) @binding(2) var baseTexture: texture_2d<f32>;
        @group(1) @binding(3) var mrSampler: sampler;
        @group(1) @binding(4) var mrTexture: texture_2d<f32>;
        @group(1) @binding(5) var normalSampler: sampler;
        @group(1) @binding(6) var normalTexture: texture_2d<f32>;
        @group(1) @binding(7) var occlusionSampler: sampler;
        @group(1) @binding(8) var occlusionTexture: texture_2d<f32>;
        @group(1) @binding(9) var emissiveSampler: sampler;
        @group(1) @binding(10) var emissiveTexture: texture_2d<f32>;
        @group(1) @binding(11) var clearcoatSampler: sampler;
        @group(1) @binding(12) var clearcoatTexture: texture_2d<f32>;
        @group(1) @binding(13) var clearcoatRoughnessSampler: sampler;
        @group(1) @binding(14) var clearcoatRoughnessTexture: texture_2d<f32>;
        @group(1) @binding(15) var clearcoatNormalSampler: sampler;
        @group(1) @binding(16) var clearcoatNormalTexture: texture_2d<f32>;
        @group(1) @binding(17) var sheenColorSampler: sampler;
        @group(1) @binding(18) var sheenColorTexture: texture_2d<f32>;
        @group(1) @binding(19) var sheenRoughnessSampler: sampler;
        @group(1) @binding(20) var sheenRoughnessTexture: texture_2d<f32>;

        struct VertexInput {
          @location(0) position : vec3<f32>,
          @location(1) normal : vec3<f32>,
          @location(2) color : vec4<f32>,
          @location(3) tangent : vec4<f32>,
          @location(4) joints : vec4<u32>,
          @location(5) weights : vec4<f32>,
          @location(6) uv0 : vec2<f32>,
          @location(7) uv1 : vec2<f32>,
          @location(8) m0 : vec4<f32>,
          @location(9) m1 : vec4<f32>,
          @location(10) m2 : vec4<f32>,
          @location(11) m3 : vec4<f32>,
        }

        struct VertexOutput {
          @builtin(position) position : vec4<f32>,
          @location(0) normal : vec3<f32>,
          @location(1) color : vec4<f32>,
          @location(2) tangent : vec4<f32>,
          @location(3) uv0 : vec2<f32>,
          @location(4) uv1 : vec2<f32>,
          @location(5) worldPos : vec3<f32>,
        }

        struct FragmentInput {
          @location(0) normal : vec3<f32>,
          @location(1) color : vec4<f32>,
          @location(2) tangent : vec4<f32>,
          @location(3) uv0 : vec2<f32>,
          @location(4) uv1 : vec2<f32>,
          @location(5) worldPos : vec3<f32>,
          @builtin(front_facing) frontFacing : bool,
        }

        fn rotateUv(uv: vec2<f32>, rotation: vec2<f32>) -> vec2<f32> {
          let c = rotation.x;
          let s = rotation.y;
          return vec2<f32>(c * uv.x - s * uv.y, s * uv.x + c * uv.y);
        }

        fn toLinear(color: vec3<f32>) -> vec3<f32> {
          return pow(color, vec3<f32>(2.2));
        }

        fn toSrgb(color: vec3<f32>) -> vec3<f32> {
          return pow(color, vec3<f32>(1.0 / 2.2));
        }

        fn applyTransform(uv: vec2<f32>, transform: TextureTransform) -> vec2<f32> {
          let scaled = uv * transform.scaleOffset.xy;
          let rotated = rotateUv(scaled, transform.rotation);
          return rotated + transform.scaleOffset.zw;
        }

        fn selectUv(texCoord: f32, uv0: vec2<f32>, uv1: vec2<f32>) -> vec2<f32> {
          return select(uv0, uv1, texCoord > 0.5);
        }

        fn maybeFlip(uv: vec2<f32>) -> vec2<f32> {
          if (debug.flipV > 0.5) {
            return vec2<f32>(uv.x, 1.0 - uv.y);
          }
          return uv;
        }

        @vertex
        fn vs_main(input: VertexInput) -> VertexOutput {
          var out: VertexOutput;
          let model = mat4x4<f32>(input.m0, input.m1, input.m2, input.m3);
          var skinnedPos = vec4<f32>(input.position, 1.0);
          var skinnedNormal = input.normal;
          if (skin.jointCount > 0u) {
            var skinMat = mat4x4<f32>(
              vec4<f32>(0.0), vec4<f32>(0.0), vec4<f32>(0.0), vec4<f32>(0.0)
            );
            skinMat = skinMat + jointMatrices[input.joints.x] * input.weights.x;
            skinMat = skinMat + jointMatrices[input.joints.y] * input.weights.y;
            skinMat = skinMat + jointMatrices[input.joints.z] * input.weights.z;
            skinMat = skinMat + jointMatrices[input.joints.w] * input.weights.w;
            skinnedPos = skinMat * vec4<f32>(input.position, 1.0);
            skinnedNormal = normalize((mat3x3<f32>(skinMat[0].xyz, skinMat[1].xyz, skinMat[2].xyz)) * input.normal);
          }
          let worldPos = model * skinnedPos;
          out.position = scene.viewProj * worldPos;
          out.normal = normalize((model * vec4<f32>(skinnedNormal, 0.0)).xyz);
          out.color = input.color;
          out.tangent = input.tangent;
          out.uv0 = input.uv0;
          out.uv1 = input.uv1;
          out.worldPos = worldPos.xyz;
          return out;
        }

        fn fresnelSchlick(cosTheta: f32, F0: vec3<f32>) -> vec3<f32> {
          return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
        }

        fn envBRDFApprox(roughness: f32, NoV: f32) -> vec2<f32> {
          let c0 = vec4<f32>(-1.0, -0.0275, -0.572, 0.022);
          let c1 = vec4<f32>(1.0, 0.0425, 1.04, -0.04);
          let r = roughness * c0 + c1;
          let a004 = min(r.x * r.x, exp2(-9.28 * NoV)) * r.x + r.y;
          let ab = vec2<f32>(-1.04, 1.04) * a004 + r.zw;
          return ab;
        }

        fn distributionGGX(N: vec3<f32>, H: vec3<f32>, alpha: f32) -> f32 {
          let a = alpha;
          let a2 = a * a;
          let NdotH = max(dot(N, H), 0.0);
          let denom = (NdotH * NdotH) * (a2 - 1.0) + 1.0;
          return a2 / (PI * denom * denom + 1e-5);
        }

        fn geometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
          let r = roughness + 1.0;
          let k = (r * r) / 8.0;
          return NdotV / (NdotV * (1.0 - k) + k);
        }

        fn geometrySmith(N: vec3<f32>, V: vec3<f32>, L: vec3<f32>, roughness: f32) -> f32 {
          let NdotV = max(dot(N, V), 0.0);
          let NdotL = max(dot(N, L), 0.0);
          let ggx1 = geometrySchlickGGX(NdotV, roughness);
          let ggx2 = geometrySchlickGGX(NdotL, roughness);
          return ggx1 * ggx2;
        }

        fn computeNormal(input: FragmentInput, uv: vec2<f32>) -> vec3<f32> {
          var N = normalize(input.normal);
          if (material.normalTransform.hasTexture < 0.5) {
            return N;
          }
          let nSample = textureSample(normalTexture, normalSampler, uv).xyz * 2.0 - vec3<f32>(1.0);
          let scaled = vec3<f32>(nSample.xy * material.metallicRoughness.z, nSample.z);
          let dp1 = dpdx(input.worldPos);
          let dp2 = dpdy(input.worldPos);
          let duv1 = dpdx(uv);
          let duv2 = dpdy(uv);
          let tangent = normalize(dp1 * duv2.y - dp2 * duv1.y);
          let bitangent = normalize(-dp1 * duv2.x + dp2 * duv1.x);
          let TBNDerived = mat3x3<f32>(tangent, bitangent, N);
          let T = normalize(input.tangent.xyz);
          let B = normalize(cross(N, T) * input.tangent.w);
          let TBNProvided = mat3x3<f32>(T, B, N);
          let hasTangent = abs(input.tangent.w) > 0.0;
          var TBN = TBNDerived;
          if (hasTangent) {
            TBN = TBNProvided;
          }
          return normalize(TBN * scaled);
        }

        fn computeClearcoatNormal(input: FragmentInput, uv: vec2<f32>) -> vec3<f32> {
          var N = normalize(input.normal);
          let nSample = textureSample(clearcoatNormalTexture, clearcoatNormalSampler, uv).xyz * 2.0 - vec3<f32>(1.0);
          let scaled = vec3<f32>(nSample.xy * material.clearcoatSheen.x, nSample.z);
          let dp1 = dpdx(input.worldPos);
          let dp2 = dpdy(input.worldPos);
          let duv1 = dpdx(uv);
          let duv2 = dpdy(uv);
          let tangent = normalize(dp1 * duv2.y - dp2 * duv1.y);
          let bitangent = normalize(-dp1 * duv2.x + dp2 * duv1.x);
          let TBN = mat3x3<f32>(tangent, bitangent, N);
          return normalize(TBN * scaled);
        }

        @fragment
        fn fs_main(input: FragmentInput) -> @location(0) vec4<f32> {
          var uv = maybeFlip(selectUv(material.baseColorTransform.texCoord, input.uv0, input.uv1));

          let baseUv = applyTransform(uv, material.baseColorTransform);
          let mrUv = applyTransform(
            maybeFlip(selectUv(material.metallicRoughnessTransform.texCoord, input.uv0, input.uv1)),
            material.metallicRoughnessTransform
          );
          let normalUv = applyTransform(
            maybeFlip(selectUv(material.normalTransform.texCoord, input.uv0, input.uv1)),
            material.normalTransform
          );
          let clearcoatUv = applyTransform(
            maybeFlip(selectUv(material.clearcoatTransform.texCoord, input.uv0, input.uv1)),
            material.clearcoatTransform
          );
          let clearcoatRoughnessUv = applyTransform(
            maybeFlip(selectUv(material.clearcoatRoughnessTransform.texCoord, input.uv0, input.uv1)),
            material.clearcoatRoughnessTransform
          );
          let clearcoatNormalUv = applyTransform(
            maybeFlip(selectUv(material.clearcoatNormalTransform.texCoord, input.uv0, input.uv1)),
            material.clearcoatNormalTransform
          );
          let occlusionUv = applyTransform(
            maybeFlip(selectUv(material.occlusionTransform.texCoord, input.uv0, input.uv1)),
            material.occlusionTransform
          );
          let emissiveUv = applyTransform(
            maybeFlip(selectUv(material.emissiveTransform.texCoord, input.uv0, input.uv1)),
            material.emissiveTransform
          );
          let sheenColorUv = applyTransform(
            maybeFlip(selectUv(material.sheenColorTransform.texCoord, input.uv0, input.uv1)),
            material.sheenColorTransform
          );
          let sheenRoughnessUv = applyTransform(
            maybeFlip(selectUv(material.sheenRoughnessTransform.texCoord, input.uv0, input.uv1)),
            material.sheenRoughnessTransform
          );

          if (debug.showUv > 0.5) {
            return vec4<f32>(fract(baseUv), 0.0, 1.0);
          }

          var baseColor = material.baseColorFactor * input.color;
          if (material.baseColorTransform.hasTexture > 0.5) {
            let sampled = textureSample(baseTexture, baseSampler, baseUv);
            baseColor = baseColor * vec4<f32>(toLinear(sampled.rgb), sampled.a);
          }

          if (material.flags.x > 0.5 && material.flags.x < 1.5) {
            if (baseColor.a < material.emissiveFactor.w) {
              discard;
            }
          }

          if (debug.ignoreTexture > 0.5) {
            return vec4<f32>(baseColor.rgb, baseColor.a);
          }
          if (debug.showTextureMode > 0.5 && debug.showTextureMode < 2.5) {
            var sampleUv = baseUv;
            if (debug.showTextureMode > 1.5) {
              sampleUv = vec2<f32>(0.5, 0.5);
            }
            return vec4<f32>(textureSampleLevel(baseTexture, baseSampler, sampleUv, 0.0).rgb, 1.0);
          }

          var metallic = material.metallicRoughness.x;
          var roughness = material.metallicRoughness.y;
          if (material.metallicRoughnessTransform.hasTexture > 0.5) {
            let mrSample = textureSample(mrTexture, mrSampler, mrUv);
            roughness = roughness * mrSample.g;
            metallic = metallic * mrSample.b;
          }
          roughness = clamp(roughness, 0.04, 1.0);

          var N = computeNormal(input, normalUv);
          if (material.flags.y > 0.5 && !input.frontFacing) {
            N = -N;
          }
          let V = normalize(scene.cameraPos - input.worldPos);
          let L = normalize(scene.lightDir);
          let H = normalize(V + L);
          let NdotL = max(dot(N, L), 0.0);
          let NdotV = max(dot(N, V), 0.0);
          let VdotH = max(dot(V, H), 0.0);

          let F0 = mix(vec3<f32>(0.04), baseColor.rgb, metallic);
          let alphaR = roughness * roughness;
          let F = fresnelSchlick(VdotH, F0);
          let D = distributionGGX(N, H, alphaR);
          let G = geometrySmith(N, V, L, roughness);
          let specular = (D * G * F) / max(4.0 * NdotV * NdotL, 0.001);
          let kD = (vec3<f32>(1.0) - F) * (1.0 - metallic);
          let diffuse = kD * baseColor.rgb / PI;

          var occlusion = 1.0;
          if (material.occlusionTransform.hasTexture > 0.5) {
            occlusion = mix(1.0, textureSample(occlusionTexture, occlusionSampler, occlusionUv).r, material.metallicRoughness.w);
          }

          var emissive = material.emissiveFactor.xyz;
          if (material.emissiveTransform.hasTexture > 0.5) {
            emissive = emissive * toLinear(textureSample(emissiveTexture, emissiveSampler, emissiveUv).rgb);
          }

          var clearcoatFactor = material.flags.z;
          let clearcoatSample = textureSample(clearcoatTexture, clearcoatSampler, clearcoatUv).r;
          clearcoatFactor = clearcoatFactor * mix(1.0, clearcoatSample, material.clearcoatTransform.hasTexture);
          var clearcoatRoughness = material.flags.w;
          let clearcoatRoughnessSample = textureSample(
            clearcoatRoughnessTexture,
            clearcoatRoughnessSampler,
            clearcoatRoughnessUv
          ).g;
          clearcoatRoughness = clearcoatRoughness * mix(1.0, clearcoatRoughnessSample, material.clearcoatRoughnessTransform.hasTexture);
          clearcoatRoughness = clamp(clearcoatRoughness, 0.04, 1.0);

          var sheenColor = material.sheenColorFactor.xyz;
          let sheenColorSample = toLinear(textureSample(sheenColorTexture, sheenColorSampler, sheenColorUv).rgb);
          sheenColor = sheenColor * mix(vec3<f32>(1.0), sheenColorSample, material.sheenColorTransform.hasTexture);
          var sheenRoughness = material.clearcoatSheen.y;
          let sheenRoughnessSample = textureSample(sheenRoughnessTexture, sheenRoughnessSampler, sheenRoughnessUv).a;
          sheenRoughness = sheenRoughness * mix(1.0, sheenRoughnessSample, material.sheenRoughnessTransform.hasTexture);
          sheenRoughness = clamp(sheenRoughness, 0.0, 1.0);

          let lightColor = vec3<f32>(1.0);
          var direct = (diffuse + specular) * lightColor * NdotL;
          var ambient = (baseColor.rgb * 0.03 + F0 * 0.02) * occlusion;
          var iblColor = vec3<f32>(0.0);
          if (scene.ibl.z > 0.5) {
            let diffuseEnv = textureSampleLevel(iblDiffuse, iblSampler, N, 0.0).rgb;
            let R = normalize(reflect(-V, N));
            let lod = clamp(roughness * scene.ibl.y, 0.0, scene.ibl.y);
            let specularEnv = textureSampleLevel(iblSpecular, iblSampler, R, lod).rgb;
            let kS = F;
            let kD = (vec3<f32>(1.0) - kS) * (1.0 - metallic);
            let brdfSample = textureSampleLevel(brdfLut, iblSampler, vec2<f32>(NdotV, roughness), 0.0).rg;
            let specularIbl = specularEnv * (F0 * brdfSample.x + brdfSample.y);
            iblColor = (diffuseEnv * kD * baseColor.rgb + specularIbl) * occlusion * scene.ibl.x;
            ambient = iblColor;
          }
          var Nc = computeClearcoatNormal(input, clearcoatNormalUv);
          if (material.flags.y > 0.5 && !input.frontFacing) {
            Nc = -Nc;
          }
          if (clearcoatFactor > 0.0) {
            let Hc = normalize(V + L);
            let NdotLc = max(dot(Nc, L), 0.0);
            let NdotVc = max(dot(Nc, V), 0.0);
            let VdotHc = max(dot(V, Hc), 0.0);
            let Fcc = fresnelSchlick(VdotHc, vec3<f32>(0.04));
            let Dcc = distributionGGX(Nc, Hc, clearcoatRoughness * clearcoatRoughness);
            let Gcc = geometrySmith(Nc, V, L, clearcoatRoughness);
            let clearcoatSpec = (Dcc * Gcc * Fcc) / max(4.0 * NdotVc * NdotLc, 0.001);
            direct = direct * (1.0 - clearcoatFactor * Fcc.r) + clearcoatSpec * clearcoatFactor;
            ambient = ambient * (1.0 - clearcoatFactor * Fcc.r);
          }
          var sheenContribution = vec3<f32>(0.0);
          if ((sheenColor.x + sheenColor.y + sheenColor.z) > 0.0) {
            let sheenAlpha = max(0.001, sheenRoughness * sheenRoughness);
            let NdotH = max(dot(N, H), 0.0);
            let Dsheen = (2.0 + 1.0 / sheenAlpha) * pow(NdotH, 1.0 / sheenAlpha) / (2.0 * PI);
            let Vsheen = 1.0 / max(4.0 * (NdotL + NdotV - NdotL * NdotV), 1e-5);
            let sheenSpec = sheenColor * Dsheen * Vsheen;
            sheenContribution = sheenContribution + sheenSpec * NdotL;
            direct = direct + sheenSpec * NdotL * debug.sheenBoost;
            if (scene.ibl.z > 0.5) {
              let sheenLod = clamp(sheenRoughness * scene.ibl.y, 0.0, scene.ibl.y);
              let sheenEnv = textureSampleLevel(iblSheen, iblSampler, N, sheenLod).rgb;
              let sheenIbl = sheenEnv * sheenColor * scene.ibl.x;
              ambient = ambient + sheenIbl * debug.sheenBoost;
              sheenContribution = sheenContribution + sheenIbl;
            }
          }
          if (debug.showTextureMode > 3.5 && debug.showTextureMode < 4.5) {
            return vec4<f32>(toSrgb(sheenContribution * debug.sheenBoost), 1.0);
          }
          if (debug.sheenDebug > 0.5) {
            return vec4<f32>(
              sheenColor.r,
              sheenColor.g,
              sheenColor.b,
              sheenRoughness
            );
          }
          if (debug.showTextureMode > 2.5) {
            return vec4<f32>(toSrgb(iblColor), 1.0);
          }
          let color = direct + ambient + emissive;
          let alpha = select(1.0, baseColor.a, material.flags.x > 1.5);
          return vec4<f32>(toSrgb(color), alpha);
        }
      `
    });
    shader.getCompilationInfo().then((info) => {
      const errors = info.messages.filter((msg) => msg.type === "error");
      if (errors.length > 0) {
        this.pipelineError = errors.map((msg) => msg.message).join(" | ");
      }
    });

    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [
        device.createBindGroupLayout({
          entries: [
            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
            { binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
            { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
            { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { viewDimension: "cube", sampleType: "float" } },
            { binding: 4, visibility: GPUShaderStage.FRAGMENT, texture: { viewDimension: "cube", sampleType: "float" } },
            { binding: 5, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
            { binding: 6, visibility: GPUShaderStage.FRAGMENT, texture: { viewDimension: "cube", sampleType: "float" } }
          ]
        }),
        device.createBindGroupLayout({
          entries: [
            { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
            { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
            { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
            { binding: 3, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
            { binding: 4, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
            { binding: 5, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
            { binding: 6, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
            { binding: 7, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
            { binding: 8, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
            { binding: 9, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
            { binding: 10, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
            { binding: 11, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
            { binding: 12, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
            { binding: 13, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
            { binding: 14, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
            { binding: 15, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
            { binding: 16, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
            { binding: 17, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
            { binding: 18, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
            { binding: 19, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
            { binding: 20, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } }
          ]
        }),
        device.createBindGroupLayout({
          entries: [
            { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "read-only-storage" } },
            { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } }
          ]
        })
      ]
    });

    const baseVertex: GPUVertexState = {
      module: shader,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 12,
          attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" as GPUVertexFormat }]
        },
        {
          arrayStride: 12,
          attributes: [{ shaderLocation: 1, offset: 0, format: "float32x3" as GPUVertexFormat }]
        },
        {
          arrayStride: 16,
          attributes: [{ shaderLocation: 2, offset: 0, format: "float32x4" as GPUVertexFormat }]
        },
        {
          arrayStride: 16,
          attributes: [{ shaderLocation: 3, offset: 0, format: "float32x4" as GPUVertexFormat }]
        },
        {
          arrayStride: 8,
          attributes: [{ shaderLocation: 4, offset: 0, format: "uint16x4" as GPUVertexFormat }]
        },
        {
          arrayStride: 16,
          attributes: [{ shaderLocation: 5, offset: 0, format: "float32x4" as GPUVertexFormat }]
        },
        {
          arrayStride: 16,
          attributes: [
            { shaderLocation: 6, offset: 0, format: "float32x2" as GPUVertexFormat },
            { shaderLocation: 7, offset: 8, format: "float32x2" as GPUVertexFormat }
          ]
        },
        {
          arrayStride: 64,
          stepMode: "instance",
          attributes: [
            { shaderLocation: 8, offset: 0, format: "float32x4" as GPUVertexFormat },
            { shaderLocation: 9, offset: 16, format: "float32x4" as GPUVertexFormat },
            { shaderLocation: 10, offset: 32, format: "float32x4" as GPUVertexFormat },
            { shaderLocation: 11, offset: 48, format: "float32x4" as GPUVertexFormat }
          ]
        }
      ] as GPUVertexBufferLayout[]
    };

    const baseFragment = {
      module: shader,
      entryPoint: "fs_main",
      targets: [{ format }]
    };

    const depthStencil = {
      format: "depth24plus",
      depthWriteEnabled: true,
      depthCompare: "less"
    } as const;

    const basePipeline = {
      layout: pipelineLayout,
      vertex: baseVertex,
      fragment: baseFragment,
      depthStencil,
      primitive: {
        topology: "triangle-list"
      }
    } as const;

    device.pushErrorScope("validation");
    const opaqueCullBack = device.createRenderPipeline({
      ...basePipeline,
      primitive: { topology: "triangle-list", cullMode: "back", frontFace: "ccw" }
    });
    const opaqueDoubleSided = device.createRenderPipeline({
      ...basePipeline,
      primitive: { topology: "triangle-list", cullMode: "none", frontFace: "ccw" }
    });
    const blendTargets: GPUColorTargetState[] = [{
      format,
      blend: {
        color: {
          srcFactor: "src-alpha" as GPUBlendFactor,
          dstFactor: "one-minus-src-alpha" as GPUBlendFactor,
          operation: "add" as GPUBlendOperation
        },
        alpha: {
          srcFactor: "one" as GPUBlendFactor,
          dstFactor: "one-minus-src-alpha" as GPUBlendFactor,
          operation: "add" as GPUBlendOperation
        }
      }
    }];
    const blendCullBack = device.createRenderPipeline({
      ...basePipeline,
      fragment: { ...baseFragment, targets: blendTargets },
      depthStencil: { ...depthStencil, depthWriteEnabled: false },
      primitive: { topology: "triangle-list", cullMode: "back", frontFace: "ccw" }
    });
    const blendDoubleSided = device.createRenderPipeline({
      ...basePipeline,
      fragment: { ...baseFragment, targets: blendTargets },
      depthStencil: { ...depthStencil, depthWriteEnabled: false },
      primitive: { topology: "triangle-list", cullMode: "none", frontFace: "ccw" }
    });
    device.popErrorScope().then((error) => {
      if (error) {
        this.pipelineError = error.message;
      }
    });

    return { opaqueCullBack, opaqueDoubleSided, blendCullBack, blendDoubleSided };
  }

  private createMaterialBindGroup(material: RenderMaterial) {
    const { device } = this.ctx;
    const buffer = device.createBuffer({
      size: 416,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    const data = this.materialUniformData(material);
    device.queue.writeBuffer(buffer, 0, data.buffer as ArrayBuffer, data.byteOffset, data.byteLength);

    const bindGroup = device.createBindGroup({
      layout: this.pipelineOpaqueCullBack.getBindGroupLayout(1),
      entries: [
        { binding: 0, resource: { buffer } },
        { binding: 1, resource: this.getSampler(material.baseColorTexture) },
        { binding: 2, resource: this.getTexture(material.baseColorTexture, "base").createView() },
        { binding: 3, resource: this.getSampler(material.metallicRoughnessTexture) },
        { binding: 4, resource: this.getTexture(material.metallicRoughnessTexture, "metalRough").createView() },
        { binding: 5, resource: this.getSampler(material.normalTexture) },
        { binding: 6, resource: this.getTexture(material.normalTexture, "normal").createView() },
        { binding: 7, resource: this.getSampler(material.occlusionTexture) },
        { binding: 8, resource: this.getTexture(material.occlusionTexture, "occlusion").createView() },
        { binding: 9, resource: this.getSampler(material.emissiveTexture) },
        { binding: 10, resource: this.getTexture(material.emissiveTexture, "emissive").createView() },
        { binding: 11, resource: this.getSampler(material.clearcoatTexture) },
        { binding: 12, resource: this.getTexture(material.clearcoatTexture, "clearcoat").createView() },
        { binding: 13, resource: this.getSampler(material.clearcoatRoughnessTexture) },
        { binding: 14, resource: this.getTexture(material.clearcoatRoughnessTexture, "clearcoatRoughness").createView() },
        { binding: 15, resource: this.getSampler(material.clearcoatNormalTexture) },
        { binding: 16, resource: this.getTexture(material.clearcoatNormalTexture, "clearcoatNormal").createView() },
        { binding: 17, resource: this.getSampler(material.sheenColorTexture) },
        { binding: 18, resource: this.getTexture(material.sheenColorTexture, "sheenColor").createView() },
        { binding: 19, resource: this.getSampler(material.sheenRoughnessTexture) },
        { binding: 20, resource: this.getTexture(material.sheenRoughnessTexture, "sheenRoughness").createView() }
      ]
    });
    return { bindGroup, buffer };
  }

  private writeBufferAligned(buffer: GPUBuffer, data: ArrayBufferView) {
    const { device } = this.ctx;
    const byteLength = data.byteLength;
    if (byteLength % 4 === 0) {
      device.queue.writeBuffer(buffer, 0, data.buffer as ArrayBuffer, data.byteOffset, byteLength);
      return;
    }
    const paddedLength = Math.ceil(byteLength / 4) * 4;
    const padded = new Uint8Array(paddedLength);
    padded.set(new Uint8Array(data.buffer, data.byteOffset, byteLength));
    device.queue.writeBuffer(buffer, 0, padded);
  }

  private createDepthTexture(): GPUTexture {
    const { device, context } = this.ctx;
    const canvas = (context as unknown as { canvas: HTMLCanvasElement }).canvas;
    const width = Math.max(1, canvas.width);
    const height = Math.max(1, canvas.height);
    return device.createTexture({
      size: [width, height, 1],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
  }

  private materialUniformData(material: RenderMaterial): Float32Array {
    const transforms = [
      this.textureTransform(material.baseColorTexture),
      this.textureTransform(material.metallicRoughnessTexture),
      this.textureTransform(material.normalTexture),
      this.textureTransform(material.occlusionTexture),
      this.textureTransform(material.emissiveTexture),
      this.textureTransform(material.clearcoatTexture),
      this.textureTransform(material.clearcoatRoughnessTexture),
      this.textureTransform(material.clearcoatNormalTexture),
      this.textureTransform(material.sheenColorTexture),
      this.textureTransform(material.sheenRoughnessTexture)
    ];
    const values: number[] = [
      material.baseColorFactor[0],
      material.baseColorFactor[1],
      material.baseColorFactor[2],
      material.baseColorFactor[3],
      material.metallicFactor,
      material.roughnessFactor,
      material.normalScale,
      material.occlusionStrength,
      material.emissiveFactor[0],
      material.emissiveFactor[1],
      material.emissiveFactor[2],
      material.alphaCutoff,
      material.alphaMode,
      material.doubleSided ? 1 : 0,
      material.clearcoatFactor,
      material.clearcoatRoughnessFactor,
      material.clearcoatNormalScale,
      material.sheenRoughnessFactor,
      0,
      0,
      material.sheenColorFactor[0],
      material.sheenColorFactor[1],
      material.sheenColorFactor[2],
      0
    ];
    transforms.forEach((transform) => values.push(...transform));
    return new Float32Array(values);
  }

  private textureTransform(info: RenderMaterial["baseColorTexture"]): number[] {
    if (!info) {
      return [1, 1, 0, 0, 1, 0, 0, 0];
    }
    const cosR = Math.cos(info.rotation);
    const sinR = Math.sin(info.rotation);
    return [
      info.scale[0],
      info.scale[1],
      info.offset[0],
      info.offset[1],
      cosR,
      sinR,
      info.texCoord,
      1
    ];
  }

  private getSampler(info: RenderMaterial["baseColorTexture"]): GPUSampler {
    if (!info || info.samplerIndex < 0) {
      return this.defaultSampler;
    }
    return this.samplers[info.samplerIndex] ?? this.defaultSampler;
  }

  private getTexture(
    info: RenderMaterial["baseColorTexture"],
    kind:
      | "base"
      | "metalRough"
      | "normal"
      | "occlusion"
      | "emissive"
      | "clearcoat"
      | "clearcoatRoughness"
      | "clearcoatNormal"
      | "sheenColor"
      | "sheenRoughness"
  ): GPUTexture {
    if (!info) {
      return this.defaultTextureForKind(kind);
    }
    return this.textures[info.imageIndex] ?? this.defaultTextureForKind(kind);
  }

  private defaultTextureForKind(
    kind:
      | "base"
      | "metalRough"
      | "normal"
      | "occlusion"
      | "emissive"
      | "clearcoat"
      | "clearcoatRoughness"
      | "clearcoatNormal"
      | "sheenColor"
      | "sheenRoughness"
  ) {
    switch (kind) {
      case "normal":
        return this.normalTexture;
      case "clearcoatNormal":
        return this.normalTexture;
      case "metalRough":
        return this.metalRoughTexture;
      case "clearcoat":
        return this.clearcoatTexture;
      case "clearcoatRoughness":
        return this.clearcoatRoughnessTexture;
      case "sheenColor":
        return this.sheenColorTexture;
      case "sheenRoughness":
        return this.sheenRoughnessTexture;
      case "emissive":
        return this.blackTexture;
      case "occlusion":
        return this.occlusionTexture;
      default:
        return this.whiteTexture;
    }
  }
}

function defaultMaterial(): RenderMaterial {
  return {
    baseColorFactor: [1, 1, 1, 1],
    metallicFactor: 1,
    roughnessFactor: 1,
    emissiveFactor: [0, 0, 0],
    normalScale: 1,
    occlusionStrength: 1,
    alphaMode: 0,
    alphaCutoff: 0.5,
    doubleSided: false,
    clearcoatFactor: 0,
    clearcoatRoughnessFactor: 0,
    clearcoatNormalScale: 1,
    sheenColorFactor: [0, 0, 0],
    sheenRoughnessFactor: 0,
    baseColorTexture: null,
    metallicRoughnessTexture: null,
    normalTexture: null,
    occlusionTexture: null,
    emissiveTexture: null,
    clearcoatTexture: null,
    clearcoatRoughnessTexture: null,
    clearcoatNormalTexture: null,
    sheenColorTexture: null,
    sheenRoughnessTexture: null
  };
}
