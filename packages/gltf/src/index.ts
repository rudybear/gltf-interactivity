export type GltfJson = {
  asset: {
    version: string;
    generator?: string;
  };
  scene?: number;
  scenes?: GltfScene[];
  nodes?: GltfNode[];
  meshes?: GltfMesh[];
  materials?: GltfMaterial[];
  textures?: GltfTexture[];
  images?: GltfImage[];
  samplers?: GltfSampler[];
  skins?: GltfSkin[];
  buffers?: Array<{ uri?: string; byteLength: number }>;
  bufferViews?: GltfBufferView[];
  accessors?: GltfAccessor[];
  animations?: unknown[];
  extensionsUsed?: string[];
  extensions?: Record<string, unknown>;
};

export type GltfDocument = {
  json: GltfJson;
  binaryChunk?: ArrayBuffer;
};

export type GltfAccessor = {
  bufferView?: number;
  byteOffset?: number;
  componentType: number;
  count: number;
  type: string;
  max?: number[];
  min?: number[];
  normalized?: boolean;
};

export type GltfBufferView = {
  buffer: number;
  byteOffset?: number;
  byteLength: number;
  byteStride?: number;
  target?: number;
};

export type GltfMesh = {
  primitives: GltfPrimitive[];
  name?: string;
};

export type GltfPrimitive = {
  attributes: Record<string, number>;
  indices?: number;
  mode?: number;
  material?: number;
};

export type GltfNode = {
  mesh?: number;
  skin?: number;
  children?: number[];
  matrix?: number[];
  translation?: [number, number, number];
  rotation?: [number, number, number, number];
  scale?: [number, number, number];
  name?: string;
  extensions?: Record<string, unknown>;
};

export type GltfScene = {
  nodes?: number[];
  name?: string;
};

export type GltfMaterial = {
  name?: string;
  doubleSided?: boolean;
  pbrMetallicRoughness?: {
    baseColorFactor?: [number, number, number, number];
    baseColorTexture?: {
      index: number;
      texCoord?: number;
      extensions?: {
        KHR_texture_transform?: GltfTextureTransform;
      };
    };
    metallicRoughnessTexture?: {
      index: number;
      texCoord?: number;
      extensions?: {
        KHR_texture_transform?: GltfTextureTransform;
      };
    };
    metallicFactor?: number;
    roughnessFactor?: number;
  };
  normalTexture?: {
    index: number;
    texCoord?: number;
    scale?: number;
    extensions?: {
      KHR_texture_transform?: GltfTextureTransform;
    };
  };
  occlusionTexture?: {
    index: number;
    texCoord?: number;
    strength?: number;
    extensions?: {
      KHR_texture_transform?: GltfTextureTransform;
    };
  };
  emissiveTexture?: {
    index: number;
    texCoord?: number;
    extensions?: {
      KHR_texture_transform?: GltfTextureTransform;
    };
  };
  emissiveFactor?: [number, number, number];
  alphaMode?: "OPAQUE" | "MASK" | "BLEND";
  alphaCutoff?: number;
  extensions?: {
    KHR_materials_clearcoat?: {
      clearcoatFactor?: number;
      clearcoatTexture?: {
        index: number;
        texCoord?: number;
        extensions?: {
          KHR_texture_transform?: GltfTextureTransform;
        };
      };
      clearcoatRoughnessFactor?: number;
      clearcoatRoughnessTexture?: {
        index: number;
        texCoord?: number;
        extensions?: {
          KHR_texture_transform?: GltfTextureTransform;
        };
      };
      clearcoatNormalTexture?: {
        index: number;
        texCoord?: number;
        scale?: number;
        extensions?: {
          KHR_texture_transform?: GltfTextureTransform;
        };
      };
    };
    KHR_materials_sheen?: {
      sheenColorFactor?: [number, number, number];
      sheenColorTexture?: {
        index: number;
        texCoord?: number;
        extensions?: {
          KHR_texture_transform?: GltfTextureTransform;
        };
      };
      sheenRoughnessFactor?: number;
      sheenRoughnessTexture?: {
        index: number;
        texCoord?: number;
        extensions?: {
          KHR_texture_transform?: GltfTextureTransform;
        };
      };
    };
  };
};

export type GltfTexture = {
  source?: number;
  sampler?: number;
};

export type GltfImage = {
  uri?: string;
  bufferView?: number;
  mimeType?: string;
};

export type GltfSampler = {
  magFilter?: number;
  minFilter?: number;
  wrapS?: number;
  wrapT?: number;
};

export type GltfSkin = {
  joints: number[];
  inverseBindMatrices?: number;
  skeleton?: number;
  name?: string;
};

export type GltfTextureTransform = {
  offset?: [number, number];
  scale?: [number, number];
  rotation?: number;
  texCoord?: number;
};

export type RenderMaterial = {
  baseColorFactor: [number, number, number, number];
  metallicFactor: number;
  roughnessFactor: number;
  emissiveFactor: [number, number, number];
  normalScale: number;
  occlusionStrength: number;
  alphaMode: number;
  alphaCutoff: number;
  doubleSided: boolean;
  clearcoatFactor: number;
  clearcoatRoughnessFactor: number;
  clearcoatNormalScale: number;
  sheenColorFactor: [number, number, number];
  sheenRoughnessFactor: number;
  baseColorTexture: RenderTextureInfo | null;
  metallicRoughnessTexture: RenderTextureInfo | null;
  normalTexture: RenderTextureInfo | null;
  occlusionTexture: RenderTextureInfo | null;
  emissiveTexture: RenderTextureInfo | null;
  clearcoatTexture: RenderTextureInfo | null;
  clearcoatRoughnessTexture: RenderTextureInfo | null;
  clearcoatNormalTexture: RenderTextureInfo | null;
  sheenColorTexture: RenderTextureInfo | null;
  sheenRoughnessTexture: RenderTextureInfo | null;
};

export type RenderTextureInfo = {
  imageIndex: number;
  samplerIndex: number;
  texCoord: number;
  scale: [number, number];
  offset: [number, number];
  rotation: number;
};

export type RenderSampler = {
  magFilter: number;
  minFilter: number;
  wrapS: number;
  wrapT: number;
};

export type RenderNode = {
  mesh?: number;
  skin?: number;
  children: number[];
  matrix?: Float32Array<ArrayBufferLike>;
  translation: [number, number, number];
  rotation: [number, number, number, number];
  scale: [number, number, number];
  worldMatrix: Float32Array<ArrayBufferLike>;
  localMatrix: Float32Array<ArrayBufferLike>;
  baseTranslation: [number, number, number];
  baseRotation: [number, number, number, number];
  baseScale: [number, number, number];
  baseMatrix?: Float32Array<ArrayBufferLike>;
  usesMatrix: boolean;
  animatedTrs: boolean;
  visible: boolean;
  baseVisible: boolean;
  selectable: boolean;
  baseSelectable: boolean;
  hoverable: boolean;
  baseHoverable: boolean;
};

export type RenderPrimitive = {
  positions: Float32Array<ArrayBufferLike>;
  normals: Float32Array<ArrayBufferLike>;
  colors: Float32Array<ArrayBufferLike>;
  tangents: Float32Array<ArrayBufferLike>;
  joints: Uint16Array<ArrayBufferLike>;
  weights: Float32Array<ArrayBufferLike>;
  uvs: Float32Array<ArrayBufferLike>;
  uvs1: Float32Array<ArrayBufferLike>;
  indices?: Uint16Array | Uint32Array;
  bounds: { min: [number, number, number]; max: [number, number, number] };
  instances: Float32Array<ArrayBufferLike>;
  materialIndex: number;
  meshIndex: number;
  nodeIndices: number[];
  skinIndex: number | null;
  jointMatrices: Float32Array<ArrayBufferLike> | null;
};

export type RenderAnimationChannel = {
  targetNode: number;
  path: "translation" | "rotation" | "scale";
  input: Float32Array;
  output: Float32Array;
  componentCount: number;
  interpolation: "LINEAR" | "STEP";
};

export type RenderAnimationPointerChannel = {
  pointer: string;
  input: Float32Array;
  output: Float32Array;
  componentCount: number;
  interpolation: "LINEAR" | "STEP";
};

export type RenderAnimation = {
  name?: string;
  duration: number;
  channels: RenderAnimationChannel[];
  pointerChannels: RenderAnimationPointerChannel[];
};

export type RenderScene = {
  primitives: RenderPrimitive[];
  materials: RenderMaterial[];
  materialBases: RenderMaterial[];
  samplers: RenderSampler[];
  nodes: RenderNode[];
  skins: RenderSkin[];
  animations: RenderAnimation[];
  bounds: RenderBounds | null;
  json: GltfJson;
};

export type RenderSkin = {
  joints: number[];
  inverseBindMatrices: Float32Array<ArrayBufferLike>;
};

export type RenderBounds = {
  min: [number, number, number];
  max: [number, number, number];
  center: [number, number, number];
  radius: number;
};

type GltfSource = ArrayBuffer | string | File;
type GltfOptions = { fileMap?: Map<string, File> };

const GLB_MAGIC = 0x46546c67;
const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;

export async function loadGltf(source: GltfSource, options: GltfOptions = {}): Promise<GltfDocument> {
  if (typeof source === "string") {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch glTF: ${response.status}`);
    }
    if (source.toLowerCase().endsWith(".glb")) {
      const buffer = await response.arrayBuffer();
      return parseGlb(buffer);
    }
    const text = await response.text();
    return { json: parseJson(text) };
  }

  if (source instanceof File) {
    const lower = source.name.toLowerCase();
    const buffer = await source.arrayBuffer();
    if (lower.endsWith(".glb")) {
      return parseGlb(buffer);
    }
    return { json: parseJson(new TextDecoder().decode(buffer)) };
  }

  if (isGlb(source)) {
    return parseGlb(source);
  }

  return { json: parseJson(new TextDecoder().decode(source)) };
}

export async function loadGltfFromFiles(files: FileList | File[]): Promise<GltfDocument> {
  const list = Array.from(files);
  const gltfFile = list.find((file) => file.name.toLowerCase().endsWith(".gltf"));
  const glbFile = list.find((file) => file.name.toLowerCase().endsWith(".glb"));
  if (glbFile) {
    return loadGltf(glbFile);
  }
  if (!gltfFile) {
    throw new Error("No .gltf or .glb file provided.");
  }
  const fileMap = new Map(list.map((file) => [file.name, file]));
  return loadGltf(gltfFile, { fileMap });
}

function parseJson(text: string): GltfJson {
  const json = JSON.parse(text) as GltfJson;
  if (!json.asset?.version) {
    throw new Error("Invalid glTF asset.");
  }
  return json;
}

function isGlb(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 12) {
    return false;
  }
  const header = new DataView(buffer, 0, 12);
  return header.getUint32(0, true) === GLB_MAGIC;
}

function parseGlb(buffer: ArrayBuffer): GltfDocument {
  const view = new DataView(buffer);
  const magic = view.getUint32(0, true);
  if (magic !== GLB_MAGIC) {
    throw new Error("Invalid GLB header.");
  }
  const totalLength = view.getUint32(8, true);
  if (totalLength !== buffer.byteLength) {
    throw new Error("GLB length mismatch.");
  }

  let offset = 12;
  let json: GltfJson | null = null;
  let bin: ArrayBuffer | undefined;

  while (offset < buffer.byteLength) {
    const chunkLength = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;

    if (chunkEnd > buffer.byteLength) {
      throw new Error("GLB chunk out of bounds.");
    }

    const chunk = buffer.slice(chunkStart, chunkEnd);
    if (chunkType === CHUNK_JSON) {
      json = parseJson(new TextDecoder().decode(chunk));
    } else if (chunkType === CHUNK_BIN) {
      bin = chunk;
    }

    offset = chunkEnd;
  }

  if (!json) {
    throw new Error("GLB missing JSON chunk.");
  }

  return { json, binaryChunk: bin };
}

export async function buildRenderScene(doc: GltfDocument, options: GltfOptions = {}): Promise<RenderScene> {
  const json = doc.json;
  if (!json.meshes || !json.accessors || !json.bufferViews || !json.buffers) {
    return {
      primitives: [],
      materials: [],
      materialBases: [],
      samplers: [],
      nodes: [],
      skins: [],
      animations: [],
      bounds: null,
      json
    };
  }

  const buffers = await resolveBuffers(doc, options.fileMap);
  const samplers = buildSamplers(json.samplers ?? []);
  const materials = buildMaterials(
    json.materials ?? [],
    json.textures ?? [],
    json.images ?? [],
    samplers.length
  );
  const meshPrimitives: RenderPrimitive[][] = [];

  for (let meshIndex = 0; meshIndex < json.meshes.length; meshIndex += 1) {
    const mesh = json.meshes[meshIndex];
    const primitives: RenderPrimitive[] = [];
    for (const primitive of mesh.primitives) {
      const positionAccessorIndex = primitive.attributes.POSITION;
      if (positionAccessorIndex === undefined) {
        continue;
      }
      const positions = readAccessorFloat32(
        positionAccessorIndex,
        json.accessors,
        json.bufferViews,
        buffers,
        3
      );

      let indices: Uint16Array | Uint32Array | undefined;
      if (primitive.indices !== undefined) {
        indices = readAccessorIndices(
          primitive.indices,
          json.accessors,
          json.bufferViews,
          buffers
        );
      }

      let normals: Float32Array;
      const normalAccessorIndex = primitive.attributes.NORMAL;
      if (normalAccessorIndex !== undefined) {
        normals = readAccessorFloat32(
          normalAccessorIndex,
          json.accessors,
          json.bufferViews,
          buffers,
          3
        );
        normalizeNormalVectors(normals);
      } else {
        normals = computeNormals(positions, indices);
      }

      const vertexCount = positions.length / 3;
      let uvs: Float32Array<ArrayBufferLike> = new Float32Array(vertexCount * 2);
      let uvs1: Float32Array<ArrayBufferLike> = new Float32Array(vertexCount * 2);
      const uvAccessorIndex = primitive.attributes.TEXCOORD_0;
      if (uvAccessorIndex !== undefined) {
        uvs = readAccessorFloat32(
          uvAccessorIndex,
          json.accessors,
          json.bufferViews,
          buffers,
          2
        );
      }
      const uv1AccessorIndex = primitive.attributes.TEXCOORD_1;
      if (uv1AccessorIndex !== undefined) {
        uvs1 = readAccessorFloat32(
          uv1AccessorIndex,
          json.accessors,
          json.bufferViews,
          buffers,
          2
        );
      }

      let colors: Float32Array<ArrayBufferLike> = new Float32Array(vertexCount * 4);
      colors.fill(1);
      const colorAccessorIndex = primitive.attributes.COLOR_0;
      if (colorAccessorIndex !== undefined) {
        const { data, componentCount } = readAccessorWithType(
          colorAccessorIndex,
          json.accessors,
          json.bufferViews,
          buffers
        );
        if (componentCount === 3) {
          for (let i = 0; i < vertexCount; i += 1) {
            const base = i * 3;
            const out = i * 4;
            colors[out] = data[base];
            colors[out + 1] = data[base + 1];
            colors[out + 2] = data[base + 2];
            colors[out + 3] = 1;
          }
        } else if (componentCount === 4) {
          for (let i = 0; i < vertexCount * 4; i += 1) {
            colors[i] = data[i];
          }
        }
      }

      let tangents: Float32Array<ArrayBufferLike> = new Float32Array(vertexCount * 4);
      const tangentAccessorIndex = primitive.attributes.TANGENT;
      if (tangentAccessorIndex !== undefined) {
        const { data, componentCount } = readAccessorWithType(
          tangentAccessorIndex,
          json.accessors,
          json.bufferViews,
          buffers
        );
        if (componentCount === 4) {
          for (let i = 0; i < vertexCount * 4; i += 1) {
            tangents[i] = data[i];
          }
        }
      }

      const joints = readAccessorUint16(
        primitive.attributes.JOINTS_0,
        json.accessors,
        json.bufferViews,
        buffers,
        4,
        vertexCount
      );
      const weights = readAccessorWeights(
        primitive.attributes.WEIGHTS_0,
        json.accessors,
        json.bufferViews,
        buffers,
        vertexCount
      );

      primitives.push({
        positions,
        normals,
        colors,
        tangents,
        joints,
        weights,
        uvs,
        uvs1,
        indices,
        bounds: computeBoundsFromPositions(positions),
        instances: new Float32Array(),
        materialIndex: primitive.material ?? 0,
        meshIndex,
        nodeIndices: [],
        skinIndex: null,
        jointMatrices: null
      });
    }
    meshPrimitives.push(primitives);
  }

  const nodes = buildNodes(json);
  updateWorldMatrices(nodes, json);
  const skins = buildSkins(json, buffers);
  const primitives = collectInstances(json, meshPrimitives, nodes);
  updateSkinMatrices(primitives, nodes, skins);
  const animations = buildAnimations(json, buffers, nodes);
  const bounds = computeSceneBounds(primitives, nodes);
  const materialBases = materials.map((material) => cloneMaterial(material));
  return { primitives, materials, materialBases, samplers, nodes, skins, animations, bounds, json };
}

export function updateWorldMatrices(nodes: RenderNode[], json: GltfJson) {
  const scenes = json.scenes ?? [];
  const sceneIndex = typeof json.scene === "number" ? json.scene : 0;
  let rootNodes = scenes[sceneIndex]?.nodes ?? [];
  if (rootNodes.length === 0 && nodes.length > 0) {
    rootNodes = nodes.map((_, index) => index);
  }

  const identity = identityMat4();
  for (const nodeIndex of rootNodes) {
    computeWorldMatrices(nodeIndex, identity, nodes);
  }
}

export function applyAnimationFrame(scene: RenderScene, time: number, animationIndex = 0) {
  if (scene.animations.length === 0) {
    return;
  }
  const animation = scene.animations[animationIndex];
  if (!animation) {
    return;
  }
  const t = animation.duration > 0 ? time % animation.duration : 0;

  scene.nodes.forEach((node) => {
    node.translation = [...node.baseTranslation];
    node.rotation = [...node.baseRotation];
    node.scale = [...node.baseScale];
    node.visible = node.baseVisible;
    node.selectable = node.baseSelectable;
    node.hoverable = node.baseHoverable;
    if (node.baseMatrix && node.usesMatrix && !node.animatedTrs) {
      node.matrix = new Float32Array(node.baseMatrix);
    } else {
      node.matrix = undefined;
    }
  });
  if (animation.pointerChannels.length > 0) {
    resetMaterialTransforms(scene);
  }

  for (const channel of animation.channels) {
    const value = sampleAnimation(channel, t);
    const node = scene.nodes[channel.targetNode];
    if (!node) {
      continue;
    }
    if (channel.path === "translation") {
      node.translation = [value[0], value[1], value[2]];
    } else if (channel.path === "scale") {
      node.scale = [value[0], value[1], value[2]];
    } else if (channel.path === "rotation") {
      node.rotation = normalizeQuat([value[0], value[1], value[2], value[3]]);
    }
  }

  for (const channel of animation.pointerChannels) {
    const value = sampleAnimationPointer(channel, t);
    applyPointerValue(scene, channel.pointer, value);
  }

  updateWorldMatrices(scene.nodes, scene.json);
  refreshInstanceMatrices(scene);
  updateSkinMatrices(scene.primitives, scene.nodes, scene.skins);
}

export function refreshInstanceMatrices(scene: RenderScene) {
  for (const primitive of scene.primitives) {
    const instanceMatrices: number[] = [];
    for (const nodeIndex of primitive.nodeIndices) {
      const mat = scene.nodes[nodeIndex].worldMatrix;
      if (!scene.nodes[nodeIndex].visible) {
        continue;
      }
      for (let i = 0; i < 16; i += 1) {
        instanceMatrices.push(mat[i]);
      }
    }
    primitive.instances = ensureInstanceMatrices(instanceMatrices);
  }
}

async function resolveBuffers(doc: GltfDocument, fileMap?: Map<string, File>): Promise<ArrayBuffer[]> {
  const json = doc.json;
  const buffers = json.buffers ?? [];
  const resolved: ArrayBuffer[] = [];

  for (let i = 0; i < buffers.length; i += 1) {
    const bufferDef = buffers[i];
    if (!bufferDef.uri) {
      if (!doc.binaryChunk) {
        throw new Error("GLB binary chunk missing.");
      }
      resolved.push(doc.binaryChunk);
      continue;
    }

    if (bufferDef.uri.startsWith("data:")) {
      resolved.push(decodeDataUri(bufferDef.uri));
      continue;
    }

    const file = lookupExternalFile(fileMap, bufferDef.uri);
    if (file) {
      resolved.push(await file.arrayBuffer());
      continue;
    }

    throw new Error(`External buffer not found: ${bufferDef.uri}`);
  }

  return resolved;
}

// glTF URIs may be percent-encoded or carry a leading "./", while fileMaps
// built from drag-and-drop or directory listings are keyed by plain names.
// Try progressively normalized spellings before giving up.
function lookupExternalFile(fileMap: Map<string, File> | undefined, uri: string): File | undefined {
  if (!fileMap) {
    return undefined;
  }
  const candidates = new Set<string>([uri]);
  try {
    candidates.add(decodeURIComponent(uri));
  } catch {
    // Malformed percent-encoding; fall through with the raw URI.
  }
  for (const candidate of [...candidates]) {
    const stripped = candidate.replace(/^\.\//, "");
    candidates.add(stripped);
    const basename = stripped.split("/").pop();
    if (basename) {
      candidates.add(basename);
    }
  }
  for (const key of candidates) {
    const file = fileMap.get(key);
    if (file) {
      return file;
    }
  }
  return undefined;
}

function decodeDataUri(uri: string): ArrayBuffer {
  const [, encoded] = uri.split(",");
  if (!encoded) {
    throw new Error("Invalid data URI.");
  }
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function readAccessorFloat32(
  accessorIndex: number,
  accessors: GltfAccessor[],
  bufferViews: GltfBufferView[],
  buffers: ArrayBuffer[],
  componentCount: number
): Float32Array<ArrayBufferLike> {
  const accessor = accessors[accessorIndex];
  if (!accessor) {
    throw new Error("Invalid accessor.");
  }
  if (
    accessor.type !== "VEC3" &&
    accessor.type !== "VEC2" &&
    accessor.type !== "VEC4" &&
    accessor.type !== "SCALAR" &&
    accessor.type !== "MAT4"
  ) {
    throw new Error("Unsupported accessor type.");
  }

  const bufferView = getBufferView(accessor, bufferViews);
  const componentSize = componentTypeSize(accessor.componentType);
  const byteStride = bufferView.byteStride ?? componentCount * componentSize;
  const byteOffset = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const view = new DataView(buffers[bufferView.buffer], byteOffset, accessorByteLength(accessor.count, byteStride, componentCount * componentSize));
  const out = new Float32Array(accessor.count * componentCount);

  for (let i = 0; i < accessor.count; i += 1) {
    const elementOffset = i * byteStride;
    for (let j = 0; j < componentCount; j += 1) {
      const offset = elementOffset + j * componentSize;
      const value = readComponent(view, offset, accessor.componentType);
      out[i * componentCount + j] = accessor.normalized ? normalizeComponent(value, accessor.componentType) : value;
    }
  }

  return out;
}

function readAccessorIndices(
  accessorIndex: number,
  accessors: GltfAccessor[],
  bufferViews: GltfBufferView[],
  buffers: ArrayBuffer[]
): Uint16Array | Uint32Array {
  const accessor = accessors[accessorIndex];
  if (!accessor) {
    throw new Error("Invalid index accessor.");
  }
  const bufferView = getBufferView(accessor, bufferViews);
  const byteOffset = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  if (accessor.componentType === 5121) {
    const src = new Uint8Array(buffers[bufferView.buffer], byteOffset, accessor.count);
    const out = new Uint16Array(accessor.count);
    for (let i = 0; i < accessor.count; i += 1) {
      out[i] = src[i];
    }
    return out;
  }
  if (accessor.componentType === 5123) {
    return new Uint16Array(buffers[bufferView.buffer], byteOffset, accessor.count);
  }
  if (accessor.componentType === 5125) {
    return new Uint32Array(buffers[bufferView.buffer], byteOffset, accessor.count);
  }
  throw new Error("Unsupported index component type.");
}

// The last element of a strided accessor only occupies elementSize bytes, so
// the readable range is (count - 1) * stride + elementSize, not count * stride.
function accessorByteLength(count: number, byteStride: number, elementSize: number): number {
  if (count === 0) {
    return 0;
  }
  return (count - 1) * byteStride + elementSize;
}

function getBufferView(accessor: GltfAccessor, bufferViews: GltfBufferView[]): GltfBufferView {
  if (accessor.bufferView === undefined) {
    throw new Error("Accessor missing bufferView.");
  }
  const bufferView = bufferViews[accessor.bufferView];
  if (!bufferView) {
    throw new Error("Invalid bufferView.");
  }
  return bufferView;
}

function computeSceneBounds(primitives: RenderPrimitive[], nodes: RenderNode[]): RenderBounds | null {
  if (primitives.length === 0 || nodes.length === 0) {
    return null;
  }
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (const primitive of primitives) {
    const localBounds = computeBoundsFromPositions(primitive.positions);
    const corners = [
      [localBounds.min[0], localBounds.min[1], localBounds.min[2]],
      [localBounds.min[0], localBounds.min[1], localBounds.max[2]],
      [localBounds.min[0], localBounds.max[1], localBounds.min[2]],
      [localBounds.min[0], localBounds.max[1], localBounds.max[2]],
      [localBounds.max[0], localBounds.min[1], localBounds.min[2]],
      [localBounds.max[0], localBounds.min[1], localBounds.max[2]],
      [localBounds.max[0], localBounds.max[1], localBounds.min[2]],
      [localBounds.max[0], localBounds.max[1], localBounds.max[2]]
    ];
    for (const nodeIndex of primitive.nodeIndices) {
      const node = nodes[nodeIndex];
      if (!node) {
        continue;
      }
      if (!node.visible) {
        continue;
      }
      const mat = node.worldMatrix;
      for (const corner of corners) {
        const world = transformPoint(mat, corner[0], corner[1], corner[2]);
        minX = Math.min(minX, world[0]);
        minY = Math.min(minY, world[1]);
        minZ = Math.min(minZ, world[2]);
        maxX = Math.max(maxX, world[0]);
        maxY = Math.max(maxY, world[1]);
        maxZ = Math.max(maxZ, world[2]);
      }
    }
  }

  if (!Number.isFinite(minX)) {
    return null;
  }

  const center: [number, number, number] = [
    (minX + maxX) * 0.5,
    (minY + maxY) * 0.5,
    (minZ + maxZ) * 0.5
  ];
  const radius = Math.max(
    Math.abs(maxX - center[0]),
    Math.abs(maxY - center[1]),
    Math.abs(maxZ - center[2])
  );

  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    center,
    radius
  };
}

function computeBoundsFromPositions(positions: Float32Array) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }
  return {
    min: [minX, minY, minZ] as [number, number, number],
    max: [maxX, maxY, maxZ] as [number, number, number]
  };
}

function computeNormals(positions: Float32Array, indices?: Uint16Array | Uint32Array): Float32Array {
  const normals = new Float32Array(positions.length);
  const indexCount = indices ? indices.length : positions.length / 3;

  const addNormal = (i0: number, i1: number, i2: number) => {
    const ax = positions[i0 * 3];
    const ay = positions[i0 * 3 + 1];
    const az = positions[i0 * 3 + 2];
    const bx = positions[i1 * 3];
    const by = positions[i1 * 3 + 1];
    const bz = positions[i1 * 3 + 2];
    const cx = positions[i2 * 3];
    const cy = positions[i2 * 3 + 1];
    const cz = positions[i2 * 3 + 2];
    const abx = bx - ax;
    const aby = by - ay;
    const abz = bz - az;
    const acx = cx - ax;
    const acy = cy - ay;
    const acz = cz - az;
    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;

    normals[i0 * 3] += nx;
    normals[i0 * 3 + 1] += ny;
    normals[i0 * 3 + 2] += nz;
    normals[i1 * 3] += nx;
    normals[i1 * 3 + 1] += ny;
    normals[i1 * 3 + 2] += nz;
    normals[i2 * 3] += nx;
    normals[i2 * 3 + 1] += ny;
    normals[i2 * 3 + 2] += nz;
  };

  if (indices) {
    for (let i = 0; i < indexCount; i += 3) {
      addNormal(indices[i], indices[i + 1], indices[i + 2]);
    }
  } else {
    for (let i = 0; i < indexCount; i += 3) {
      addNormal(i, i + 1, i + 2);
    }
  }

  normalizeNormalVectors(normals);
  return normals;
}

function collectInstances(
  json: GltfJson,
  primitivesByMesh: RenderPrimitive[][],
  nodes: RenderNode[]
): RenderPrimitive[] {
  const instancesByPrimitive: RenderPrimitive[] = [];
  for (let meshIndex = 0; meshIndex < primitivesByMesh.length; meshIndex += 1) {
    const primitives = primitivesByMesh[meshIndex];
    for (let primIndex = 0; primIndex < primitives.length; primIndex += 1) {
      const primitive = primitives[primIndex];
      const instanceMatrices: number[] = [];
      primitive.nodeIndices = [];
      nodes.forEach((node, nodeIndex) => {
        if (node.mesh === meshIndex) {
          if (node.skin !== undefined) {
            const skinnedPrimitive = clonePrimitive(primitive);
            skinnedPrimitive.nodeIndices = [nodeIndex];
            skinnedPrimitive.skinIndex = node.skin;
            skinnedPrimitive.instances = new Float32Array(node.worldMatrix);
            instancesByPrimitive.push(skinnedPrimitive);
          } else {
            primitive.nodeIndices.push(nodeIndex);
            const mat = node.worldMatrix;
            for (let i = 0; i < 16; i += 1) {
              instanceMatrices.push(mat[i]);
            }
          }
        }
      });
      if (instanceMatrices.length > 0) {
        primitive.instances = ensureInstanceMatrices(instanceMatrices);
        instancesByPrimitive.push(primitive);
      }
    }
  }

  return instancesByPrimitive;
}

function buildMaterials(
  materials: GltfMaterial[],
  textures: GltfTexture[],
  images: GltfImage[],
  samplerCount: number
): RenderMaterial[] {
  if (materials.length === 0) {
    return [defaultMaterial()];
  }
  return materials.map((material) => {
    const pbr = material.pbrMetallicRoughness ?? {};
    const clearcoat = material.extensions?.KHR_materials_clearcoat;
    const sheen = material.extensions?.KHR_materials_sheen;
    return {
      baseColorFactor: pbr.baseColorFactor ?? [1, 1, 1, 1],
      metallicFactor: pbr.metallicFactor ?? 1,
      roughnessFactor: pbr.roughnessFactor ?? 1,
      emissiveFactor: material.emissiveFactor ?? [0, 0, 0],
      normalScale: material.normalTexture?.scale ?? 1,
      occlusionStrength: material.occlusionTexture?.strength ?? 1,
      alphaMode: alphaModeToId(material.alphaMode),
      alphaCutoff: material.alphaCutoff ?? 0.5,
      doubleSided: material.doubleSided ?? false,
      clearcoatFactor: clearcoat?.clearcoatFactor ?? 0,
      clearcoatRoughnessFactor: clearcoat?.clearcoatRoughnessFactor ?? 0,
      clearcoatNormalScale: clearcoat?.clearcoatNormalTexture?.scale ?? 1,
      sheenColorFactor: sheen?.sheenColorFactor ?? [0, 0, 0],
      sheenRoughnessFactor: sheen?.sheenRoughnessFactor ?? 0,
      baseColorTexture: buildTextureInfo(
        pbr.baseColorTexture,
        textures,
        images.length,
        samplerCount
      ),
      metallicRoughnessTexture: buildTextureInfo(
        pbr.metallicRoughnessTexture,
        textures,
        images.length,
        samplerCount
      ),
      normalTexture: buildTextureInfo(material.normalTexture, textures, images.length, samplerCount),
      occlusionTexture: buildTextureInfo(material.occlusionTexture, textures, images.length, samplerCount),
      emissiveTexture: buildTextureInfo(material.emissiveTexture, textures, images.length, samplerCount),
      clearcoatTexture: buildTextureInfo(clearcoat?.clearcoatTexture, textures, images.length, samplerCount),
      clearcoatRoughnessTexture: buildTextureInfo(
        clearcoat?.clearcoatRoughnessTexture,
        textures,
        images.length,
        samplerCount
      ),
      clearcoatNormalTexture: buildTextureInfo(
        clearcoat?.clearcoatNormalTexture,
        textures,
        images.length,
        samplerCount
      ),
      sheenColorTexture: buildTextureInfo(sheen?.sheenColorTexture, textures, images.length, samplerCount),
      sheenRoughnessTexture: buildTextureInfo(
        sheen?.sheenRoughnessTexture,
        textures,
        images.length,
        samplerCount
      )
    };
  });
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

function buildSamplers(samplers: GltfSampler[]): RenderSampler[] {
  if (samplers.length === 0) {
    return [];
  }
  return samplers.map((sampler) => ({
    magFilter: sampler.magFilter ?? 9729,
    minFilter: sampler.minFilter ?? 9729,
    wrapS: sampler.wrapS ?? 10497,
    wrapT: sampler.wrapT ?? 10497
  }));
}

function buildTextureInfo(
  info: {
    index: number;
    texCoord?: number;
    extensions?: { KHR_texture_transform?: GltfTextureTransform };
  } | undefined,
  textures: GltfTexture[],
  imageCount: number,
  samplerCount: number
): RenderTextureInfo | null {
  if (!info) {
    return null;
  }
  const texture = textures[info.index];
  let imageIndex: number | null = null;
  if (texture && texture.source !== undefined) {
    imageIndex = texture.source;
  } else if (info.index < imageCount) {
    imageIndex = info.index;
  }
  if (imageIndex === null) {
    return null;
  }
  const transform = info.extensions?.KHR_texture_transform;
  const texCoord = transform?.texCoord ?? info.texCoord ?? 0;
  const offset = transform?.offset ?? [0, 0];
  const scale = transform?.scale ?? [1, 1];
  const rotation = transform?.rotation ?? 0;
  const samplerIndex = texture?.sampler ?? -1;

  return {
    imageIndex,
    samplerIndex: samplerIndex >= 0 && samplerIndex < samplerCount ? samplerIndex : -1,
    texCoord,
    scale,
    offset,
    rotation
  };
}

function alphaModeToId(mode?: "OPAQUE" | "MASK" | "BLEND"): number {
  switch (mode) {
    case "MASK":
      return 1;
    case "BLEND":
      return 2;
    default:
      return 0;
  }
}

function buildNodes(json: GltfJson): RenderNode[] {
  const nodes = json.nodes ?? [];
  return nodes.map((node) => {
    const matrix = node.matrix ? new Float32Array(node.matrix) : undefined;
    const hasMatrix = Boolean(matrix);
    const baseTransform = matrix
      ? decomposeMat4(matrix)
      : {
          translation: (node.translation ?? [0, 0, 0]) as [number, number, number],
          rotation: (node.rotation ?? [0, 0, 0, 1]) as [number, number, number, number],
          scale: (node.scale ?? [1, 1, 1]) as [number, number, number]
        };
    const translation = baseTransform.translation;
    const rotation = baseTransform.rotation;
    const scale = baseTransform.scale;
    const visibilityExt = (node.extensions as { KHR_node_visibility?: { visible?: boolean } } | undefined)?.KHR_node_visibility;
    const selectableExt = (node.extensions as { KHR_node_selectability?: { selectable?: boolean } } | undefined)?.KHR_node_selectability;
    const hoverableExt = (node.extensions as { KHR_node_hoverability?: { hoverable?: boolean } } | undefined)?.KHR_node_hoverability;
    return {
      mesh: node.mesh,
      skin: node.skin,
      children: node.children ?? [],
      matrix,
      translation: [...translation],
      rotation: [...rotation],
      scale: [...scale],
      worldMatrix: identityMat4(),
      localMatrix: identityMat4(),
      baseTranslation: [...translation],
      baseRotation: [...rotation],
      baseScale: [...scale],
      baseMatrix: matrix ? new Float32Array(matrix) : undefined,
      usesMatrix: hasMatrix,
      animatedTrs: false,
      visible: visibilityExt?.visible ?? true,
      baseVisible: visibilityExt?.visible ?? true,
      selectable: selectableExt?.selectable ?? true,
      baseSelectable: selectableExt?.selectable ?? true,
      hoverable: hoverableExt?.hoverable ?? true,
      baseHoverable: hoverableExt?.hoverable ?? true
    };
  });
}

function buildAnimations(json: GltfJson, buffers: ArrayBuffer[], nodes: RenderNode[]): RenderAnimation[] {
  const animations = json.animations ?? [];
  const accessors = json.accessors;
  const bufferViews = json.bufferViews;
  if (!accessors || !bufferViews) {
    return [];
  }
  return animations.map((animation) => {
    const channels: RenderAnimationChannel[] = [];
    const pointerChannels: RenderAnimationPointerChannel[] = [];
    let duration = 0;
    for (const channel of (animation as { channels: any[] }).channels ?? []) {
      const samplerIndex = channel.sampler;
      const sampler = (animation as { samplers: any[] }).samplers?.[samplerIndex];
      if (!sampler) {
        continue;
      }
      const inputIndex = sampler.input;
      const outputIndex = sampler.output;
      if (inputIndex === undefined || outputIndex === undefined) {
        continue;
      }
      const input = readAccessorFloat32(
        inputIndex,
        accessors,
        bufferViews,
        buffers,
        1
      );
      const { data: output, componentCount } = readAccessorWithType(
        outputIndex,
        accessors,
        bufferViews,
        buffers
      );
      duration = Math.max(duration, input[input.length - 1] ?? 0);
      const pointer = channel.target?.extensions?.KHR_animation_pointer?.pointer as string | undefined;
      if (pointer) {
        pointerChannels.push({
          pointer,
          input,
          output,
          componentCount,
          interpolation: sampler.interpolation ?? "LINEAR"
        });
      } else {
        const path = channel.target?.path as "translation" | "rotation" | "scale";
        if (!path) {
          continue;
        }
        const targetNode = channel.target?.node ?? 0;
        if (nodes[targetNode]) {
          nodes[targetNode].animatedTrs = true;
        }
        channels.push({
          targetNode,
          path,
          input,
          output,
          componentCount,
          interpolation: sampler.interpolation ?? "LINEAR"
        });
      }
    }
    return { name: (animation as { name?: string }).name, duration, channels, pointerChannels };
  });
}

export async function loadImageBitmaps(
  doc: GltfDocument,
  options: GltfOptions = {}
): Promise<Array<ImageBitmap | null>> {
  const json = doc.json;
  const images = json.images ?? [];
  if (images.length === 0) {
    return [];
  }
  const buffers = await resolveBuffers(doc, options.fileMap);
  const bitmaps: Array<ImageBitmap | null> = [];

  for (const image of images) {
    try {
      const blob = await resolveImageBlob(image, json.bufferViews ?? [], buffers, options.fileMap);
      const bitmap = await createImageBitmap(blob);
      bitmaps.push(bitmap);
    } catch {
      bitmaps.push(null);
    }
  }

  return bitmaps;
}

async function resolveImageBlob(
  image: GltfImage,
  bufferViews: GltfBufferView[],
  buffers: ArrayBuffer[],
  fileMap?: Map<string, File>
): Promise<Blob> {
  if (image.uri) {
    if (image.uri.startsWith("data:")) {
      return decodeDataUriToBlob(image.uri);
    }
    const file = lookupExternalFile(fileMap, image.uri);
    if (!file) {
      throw new Error(`Missing image file: ${image.uri}`);
    }
    return file;
  }

  if (image.bufferView === undefined) {
    throw new Error("Image missing uri or bufferView.");
  }
  const bufferView = bufferViews[image.bufferView];
  const buffer = buffers[bufferView.buffer];
  const start = bufferView.byteOffset ?? 0;
  const end = start + bufferView.byteLength;
  const mimeType = image.mimeType ?? "image/png";
  return new Blob([buffer.slice(start, end)], { type: mimeType });
}

function decodeDataUriToBlob(uri: string): Blob {
  const [header, encoded] = uri.split(",");
  if (!encoded) {
    throw new Error("Invalid data URI.");
  }
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

function sampleAnimation(channel: RenderAnimationChannel, time: number): number[] {
  const input = channel.input;
  const output = channel.output;
  const count = channel.componentCount;
  if (input.length === 0) {
    return new Array(count).fill(0);
  }
  let idx = 0;
  while (idx < input.length - 1 && time >= input[idx + 1]) {
    idx += 1;
  }
  const t0 = input[idx];
  const t1 = input[Math.min(idx + 1, input.length - 1)];
  const start = idx * count;
  const end = Math.min(idx + 1, input.length - 1) * count;
  if (channel.interpolation === "STEP" || t0 === t1) {
    return Array.from(output.slice(start, start + count));
  }
  const alpha = Math.min(1, Math.max(0, (time - t0) / (t1 - t0)));
  const result = [];
  for (let i = 0; i < count; i += 1) {
    const v0 = output[start + i];
    const v1 = output[end + i];
    result.push(v0 + (v1 - v0) * alpha);
  }
  return result;
}

function sampleAnimationPointer(channel: RenderAnimationPointerChannel, time: number): number[] {
  const input = channel.input;
  const output = channel.output;
  const count = channel.componentCount;
  if (input.length === 0) {
    return new Array(count).fill(0);
  }
  let idx = 0;
  while (idx < input.length - 1 && time >= input[idx + 1]) {
    idx += 1;
  }
  const t0 = input[idx];
  const t1 = input[Math.min(idx + 1, input.length - 1)];
  const start = idx * count;
  const end = Math.min(idx + 1, input.length - 1) * count;
  if (channel.interpolation === "STEP" || t0 === t1) {
    return Array.from(output.slice(start, start + count));
  }
  const alpha = Math.min(1, Math.max(0, (time - t0) / (t1 - t0)));
  const result = [];
  for (let i = 0; i < count; i += 1) {
    const v0 = output[start + i];
    const v1 = output[end + i];
    result.push(v0 + (v1 - v0) * alpha);
  }
  return result;
}

function resetMaterialTransforms(scene: RenderScene) {
  for (let i = 0; i < scene.materials.length; i += 1) {
    const base = scene.materialBases[i];
    const material = scene.materials[i];
    if (!base || !material) {
      continue;
    }
    material.baseColorTexture = cloneTextureInfo(base.baseColorTexture);
    material.metallicRoughnessTexture = cloneTextureInfo(base.metallicRoughnessTexture);
    material.normalTexture = cloneTextureInfo(base.normalTexture);
    material.occlusionTexture = cloneTextureInfo(base.occlusionTexture);
    material.emissiveTexture = cloneTextureInfo(base.emissiveTexture);
    material.clearcoatTexture = cloneTextureInfo(base.clearcoatTexture);
    material.clearcoatRoughnessTexture = cloneTextureInfo(base.clearcoatRoughnessTexture);
    material.clearcoatNormalTexture = cloneTextureInfo(base.clearcoatNormalTexture);
    material.sheenColorTexture = cloneTextureInfo(base.sheenColorTexture);
    material.sheenRoughnessTexture = cloneTextureInfo(base.sheenRoughnessTexture);
  }
}

function applyNodePointerValue(node: RenderNode, tokens: string[], value: number[]): boolean {
  if (tokens[2] === "extensions" && tokens[3] === "KHR_node_visibility" && tokens[4] === "visible") {
    node.visible = Boolean(value[0]);
    return true;
  }
  if (tokens[2] === "extensions" && tokens[3] === "KHR_node_selectability" && tokens[4] === "selectable") {
    node.selectable = Boolean(value[0]);
    return true;
  }
  if (tokens[2] === "extensions" && tokens[3] === "KHR_node_hoverability" && tokens[4] === "hoverable") {
    node.hoverable = Boolean(value[0]);
    return true;
  }
  if (tokens[2] === "translation" && value.length >= 3) {
    node.translation = [value[0], value[1], value[2]];
    node.matrix = undefined;
    node.usesMatrix = false;
    return true;
  }
  if (tokens[2] === "rotation" && value.length >= 4) {
    node.rotation = normalizeQuat([value[0], value[1], value[2], value[3]]);
    node.matrix = undefined;
    node.usesMatrix = false;
    return true;
  }
  if (tokens[2] === "scale" && value.length >= 3) {
    node.scale = [value[0], value[1], value[2]];
    node.matrix = undefined;
    node.usesMatrix = false;
    return true;
  }
  if (tokens[2] === "matrix" && value.length >= 16) {
    node.matrix = new Float32Array(value.slice(0, 16));
    node.usesMatrix = true;
    return true;
  }
  return false;
}

export function applyPointerValue(scene: RenderScene, pointer: string, value: number[]): boolean {
  const tokens = pointer.split("/").filter(Boolean);
  if (tokens.length < 3) {
    return false;
  }
  if (tokens[0] === "nodes") {
    const nodeIndex = Number.parseInt(tokens[1], 10);
    if (Number.isNaN(nodeIndex)) {
      return false;
    }
    const node = scene.nodes[nodeIndex];
    if (!node) {
      return false;
    }
    return applyNodePointerValue(node, tokens, value);
  }
  if (tokens[0] !== "materials") {
    return false;
  }
  const materialIndex = Number.parseInt(tokens[1], 10);
  if (Number.isNaN(materialIndex)) {
    return false;
  }
  const material = scene.materials[materialIndex];
  if (!material) {
    return false;
  }
  if (tokens[2] === "pbrMetallicRoughness" && tokens[3] === "baseColorFactor" && value.length >= 4) {
    material.baseColorFactor = [value[0], value[1], value[2], value[3]];
    return true;
  }
  if (tokens[2] === "emissiveFactor" && value.length >= 3) {
    material.emissiveFactor = [value[0], value[1], value[2]];
    return true;
  }
  const target = resolveTextureInfoFromPointer(material, tokens);
  if (!target) {
    return false;
  }
  if (tokens[tokens.length - 1] === "offset" && value.length >= 2) {
    target.offset = [value[0], value[1]];
    return true;
  }
  if (tokens[tokens.length - 1] === "scale" && value.length >= 2) {
    target.scale = [value[0], value[1]];
    return true;
  }
  if (tokens[tokens.length - 1] === "rotation" && value.length >= 1) {
    target.rotation = value[0];
    return true;
  }
  return false;
}

export function applyInteractivityPointer(scene: RenderScene, pointer: string, value: number[]): boolean {
  return applyPointerValue(scene, pointer, value);
}

function resolveTextureInfoFromPointer(material: RenderMaterial, tokens: string[]): RenderTextureInfo | null {
  const prop = tokens[tokens.length - 1];
  if (prop !== "offset" && prop !== "scale" && prop !== "rotation") {
    return null;
  }
  if (tokens[2] === "pbrMetallicRoughness") {
    if (tokens[3] === "baseColorTexture") {
      return material.baseColorTexture;
    }
    if (tokens[3] === "metallicRoughnessTexture") {
      return material.metallicRoughnessTexture;
    }
  }
  if (tokens[2] === "normalTexture") {
    return material.normalTexture;
  }
  if (tokens[2] === "occlusionTexture") {
    return material.occlusionTexture;
  }
  if (tokens[2] === "emissiveTexture") {
    return material.emissiveTexture;
  }
  if (tokens[2] === "extensions" && tokens[3] === "KHR_materials_clearcoat") {
    if (tokens[4] === "clearcoatTexture") {
      return material.clearcoatTexture;
    }
    if (tokens[4] === "clearcoatRoughnessTexture") {
      return material.clearcoatRoughnessTexture;
    }
    if (tokens[4] === "clearcoatNormalTexture") {
      return material.clearcoatNormalTexture;
    }
  }
  if (tokens[2] === "extensions" && tokens[3] === "KHR_materials_sheen") {
    if (tokens[4] === "sheenColorTexture") {
      return material.sheenColorTexture;
    }
    if (tokens[4] === "sheenRoughnessTexture") {
      return material.sheenRoughnessTexture;
    }
  }
  return null;
}

function cloneTextureInfo(info: RenderTextureInfo | null): RenderTextureInfo | null {
  if (!info) {
    return null;
  }
  return {
    imageIndex: info.imageIndex,
    samplerIndex: info.samplerIndex,
    texCoord: info.texCoord,
    scale: [info.scale[0], info.scale[1]],
    offset: [info.offset[0], info.offset[1]],
    rotation: info.rotation
  };
}

function cloneMaterial(material: RenderMaterial): RenderMaterial {
  return {
    baseColorFactor: [...material.baseColorFactor],
    metallicFactor: material.metallicFactor,
    roughnessFactor: material.roughnessFactor,
    emissiveFactor: [...material.emissiveFactor],
    normalScale: material.normalScale,
    occlusionStrength: material.occlusionStrength,
    alphaMode: material.alphaMode,
    alphaCutoff: material.alphaCutoff,
    doubleSided: material.doubleSided,
    clearcoatFactor: material.clearcoatFactor,
    clearcoatRoughnessFactor: material.clearcoatRoughnessFactor,
    clearcoatNormalScale: material.clearcoatNormalScale,
    sheenColorFactor: [...material.sheenColorFactor],
    sheenRoughnessFactor: material.sheenRoughnessFactor,
    baseColorTexture: cloneTextureInfo(material.baseColorTexture),
    metallicRoughnessTexture: cloneTextureInfo(material.metallicRoughnessTexture),
    normalTexture: cloneTextureInfo(material.normalTexture),
    occlusionTexture: cloneTextureInfo(material.occlusionTexture),
    emissiveTexture: cloneTextureInfo(material.emissiveTexture),
    clearcoatTexture: cloneTextureInfo(material.clearcoatTexture),
    clearcoatRoughnessTexture: cloneTextureInfo(material.clearcoatRoughnessTexture),
    clearcoatNormalTexture: cloneTextureInfo(material.clearcoatNormalTexture),
    sheenColorTexture: cloneTextureInfo(material.sheenColorTexture),
    sheenRoughnessTexture: cloneTextureInfo(material.sheenRoughnessTexture)
  };
}

function readAccessorWithType(
  accessorIndex: number,
  accessors: GltfAccessor[],
  bufferViews: GltfBufferView[],
  buffers: ArrayBuffer[]
): { data: Float32Array<ArrayBufferLike>; componentCount: number } {
  const accessor = accessors[accessorIndex];
  const componentCount = accessorTypeToComponents(accessor.type);
  const data = readAccessorFloat32(accessorIndex, accessors, bufferViews, buffers, componentCount);
  return { data, componentCount };
}

function accessorTypeToComponents(type: string): number {
  switch (type) {
    case "SCALAR":
      return 1;
    case "VEC2":
      return 2;
    case "VEC3":
      return 3;
    case "VEC4":
      return 4;
    default:
      throw new Error(`Unsupported accessor type: ${type}`);
  }
}

function componentTypeSize(componentType: number): number {
  switch (componentType) {
    case 5120:
    case 5121:
      return 1;
    case 5122:
    case 5123:
      return 2;
    case 5125:
    case 5126:
      return 4;
    default:
      throw new Error(`Unsupported component type: ${componentType}`);
  }
}

function readComponent(view: DataView, offset: number, componentType: number): number {
  switch (componentType) {
    case 5120:
      return view.getInt8(offset);
    case 5121:
      return view.getUint8(offset);
    case 5122:
      return view.getInt16(offset, true);
    case 5123:
      return view.getUint16(offset, true);
    case 5125:
      return view.getUint32(offset, true);
    case 5126:
      return view.getFloat32(offset, true);
    default:
      throw new Error(`Unsupported component type: ${componentType}`);
  }
}

function normalizeComponent(value: number, componentType: number): number {
  switch (componentType) {
    case 5120:
      return Math.max(value / 127, -1);
    case 5121:
      return value / 255;
    case 5122:
      return Math.max(value / 32767, -1);
    case 5123:
      return value / 65535;
    case 5125:
      return value / 4294967295;
    case 5126:
      return value;
    default:
      return value;
  }
}

function normalizeNormalVectors(normals: Float32Array) {
  for (let i = 0; i < normals.length; i += 3) {
    const nx = normals[i];
    const ny = normals[i + 1];
    const nz = normals[i + 2];
    const len = Math.hypot(nx, ny, nz) || 1;
    normals[i] = nx / len;
    normals[i + 1] = ny / len;
    normals[i + 2] = nz / len;
  }
}

function ensureInstanceMatrices(values: number[]): Float32Array {
  if (values.length === 0) {
    return identityMat4();
  }
  return new Float32Array(values);
}

function clonePrimitive(primitive: RenderPrimitive): RenderPrimitive {
  return {
    positions: primitive.positions,
    normals: primitive.normals,
    colors: primitive.colors,
    tangents: primitive.tangents,
    joints: primitive.joints,
    weights: primitive.weights,
    uvs: primitive.uvs,
    uvs1: primitive.uvs1,
    indices: primitive.indices,
    bounds: primitive.bounds,
    instances: primitive.instances,
    materialIndex: primitive.materialIndex,
    meshIndex: primitive.meshIndex,
    nodeIndices: [...primitive.nodeIndices],
    skinIndex: primitive.skinIndex,
    jointMatrices: primitive.jointMatrices
  };
}

function buildSkins(json: GltfJson, buffers: ArrayBuffer[]): RenderSkin[] {
  const skins = json.skins ?? [];
  const accessors = json.accessors ?? [];
  const bufferViews = json.bufferViews ?? [];
  return skins.map((skin) => {
    let inverseBindMatrices: Float32Array<ArrayBufferLike> = new Float32Array(skin.joints.length * 16);
    if (skin.inverseBindMatrices !== undefined) {
      inverseBindMatrices = readAccessorFloat32(
        skin.inverseBindMatrices,
        accessors,
        bufferViews,
        buffers,
        16
      );
    } else {
      for (let i = 0; i < skin.joints.length; i += 1) {
        const identity = identityMat4();
        inverseBindMatrices.set(identity, i * 16);
      }
    }
    return {
      joints: [...skin.joints],
      inverseBindMatrices
    };
  });
}

export function updateSkinMatrices(primitives: RenderPrimitive[], nodes: RenderNode[], skins: RenderSkin[]) {
  for (const primitive of primitives) {
    if (primitive.skinIndex === null || primitive.skinIndex === undefined) {
      primitive.jointMatrices = null;
      continue;
    }
    const skin = skins[primitive.skinIndex];
    if (!skin) {
      primitive.jointMatrices = null;
      continue;
    }
    const nodeIndex = primitive.nodeIndices[0];
    const meshNode = nodes[nodeIndex];
    if (!meshNode) {
      primitive.jointMatrices = null;
      continue;
    }
    const meshWorldInverse = invertMat4(meshNode.worldMatrix);
    const jointCount = skin.joints.length;
    const matrices = new Float32Array(jointCount * 16);
    for (let i = 0; i < jointCount; i += 1) {
      const jointNode = nodes[skin.joints[i]];
      if (!jointNode) {
        continue;
      }
      const jointWorld = jointNode.worldMatrix;
      const inverseBind = skin.inverseBindMatrices.slice(i * 16, i * 16 + 16);
      const jointMatrix = multiplyMat4(meshWorldInverse, multiplyMat4(jointWorld, inverseBind));
      matrices.set(jointMatrix, i * 16);
    }
    primitive.jointMatrices = matrices;
  }
}

function readAccessorUint16(
  accessorIndex: number | undefined,
  accessors: GltfAccessor[],
  bufferViews: GltfBufferView[],
  buffers: ArrayBuffer[],
  componentCount: number,
  vertexCount: number
): Uint16Array<ArrayBufferLike> {
  if (accessorIndex === undefined) {
    return new Uint16Array(vertexCount * componentCount);
  }
  const accessor = accessors[accessorIndex];
  if (!accessor) {
    return new Uint16Array(vertexCount * componentCount);
  }
  const bufferView = getBufferView(accessor, bufferViews);
  const componentSize = componentTypeSize(accessor.componentType);
  const byteStride = bufferView.byteStride ?? componentCount * componentSize;
  const byteOffset = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const view = new DataView(buffers[bufferView.buffer], byteOffset, accessorByteLength(accessor.count, byteStride, componentCount * componentSize));
  const out = new Uint16Array(accessor.count * componentCount);
  for (let i = 0; i < accessor.count; i += 1) {
    const elementOffset = i * byteStride;
    for (let j = 0; j < componentCount; j += 1) {
      const offset = elementOffset + j * componentSize;
      out[i * componentCount + j] = readComponent(view, offset, accessor.componentType);
    }
  }
  return out;
}

function readAccessorWeights(
  accessorIndex: number | undefined,
  accessors: GltfAccessor[],
  bufferViews: GltfBufferView[],
  buffers: ArrayBuffer[],
  vertexCount: number
): Float32Array<ArrayBufferLike> {
  if (accessorIndex === undefined) {
    const weights = new Float32Array(vertexCount * 4);
    for (let i = 0; i < vertexCount; i += 1) {
      weights[i * 4] = 1;
    }
    return weights;
  }
  return readAccessorFloat32(accessorIndex, accessors, bufferViews, buffers, 4);
}

function identityMat4(): Float32Array {
  const identity = new Float32Array(16);
  identity[0] = 1;
  identity[5] = 1;
  identity[10] = 1;
  identity[15] = 1;
  return identity;
}

function computeWorldMatrices(nodeIndex: number, parentMatrix: Float32Array, nodes: RenderNode[]) {
  const node = nodes[nodeIndex];
  if (!node) {
    return;
  }
  const baseMatrix = node.matrix;
  const useMatrix = baseMatrix && !node.animatedTrs ? baseMatrix : null;
  const localMatrix = useMatrix
    ? new Float32Array(useMatrix)
    : mat4FromTrs(node.translation, node.rotation, node.scale);
  node.localMatrix = localMatrix;
  const world = multiplyMat4(parentMatrix, localMatrix);
  node.worldMatrix = world;
  node.children.forEach((child) => computeWorldMatrices(child, world, nodes));
}

function mat4FromTrs(
  translation: [number, number, number],
  rotation: [number, number, number, number],
  scale: [number, number, number]
): Float32Array {
  const [tx, ty, tz] = translation;
  const [qx, qy, qz, qw] = rotation;
  const [sx, sy, sz] = scale;
  const x2 = qx + qx;
  const y2 = qy + qy;
  const z2 = qz + qz;
  const xx = qx * x2;
  const xy = qx * y2;
  const xz = qx * z2;
  const yy = qy * y2;
  const yz = qy * z2;
  const zz = qz * z2;
  const wx = qw * x2;
  const wy = qw * y2;
  const wz = qw * z2;

  const out = new Float32Array(16);
  out[0] = (1 - (yy + zz)) * sx;
  out[1] = (xy + wz) * sx;
  out[2] = (xz - wy) * sx;
  out[3] = 0;
  out[4] = (xy - wz) * sy;
  out[5] = (1 - (xx + zz)) * sy;
  out[6] = (yz + wx) * sy;
  out[7] = 0;
  out[8] = (xz + wy) * sz;
  out[9] = (yz - wx) * sz;
  out[10] = (1 - (xx + yy)) * sz;
  out[11] = 0;
  out[12] = tx;
  out[13] = ty;
  out[14] = tz;
  out[15] = 1;
  return out;
}

function multiplyMat4(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(16);
  for (let i = 0; i < 4; i += 1) {
    const ai0 = a[i];
    const ai1 = a[i + 4];
    const ai2 = a[i + 8];
    const ai3 = a[i + 12];
    out[i] = ai0 * b[0] + ai1 * b[1] + ai2 * b[2] + ai3 * b[3];
    out[i + 4] = ai0 * b[4] + ai1 * b[5] + ai2 * b[6] + ai3 * b[7];
    out[i + 8] = ai0 * b[8] + ai1 * b[9] + ai2 * b[10] + ai3 * b[11];
    out[i + 12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
  }
  return out;
}

function normalizeQuat(quat: [number, number, number, number]): [number, number, number, number] {
  const [x, y, z, w] = quat;
  const len = Math.hypot(x, y, z, w) || 1;
  return [x / len, y / len, z / len, w / len];
}

function decomposeMat4(mat: Float32Array): {
  translation: [number, number, number];
  rotation: [number, number, number, number];
  scale: [number, number, number];
} {
  const translation: [number, number, number] = [mat[12], mat[13], mat[14]];
  const sx = Math.hypot(mat[0], mat[1], mat[2]) || 1;
  const sy = Math.hypot(mat[4], mat[5], mat[6]) || 1;
  const sz = Math.hypot(mat[8], mat[9], mat[10]) || 1;
  const det =
    mat[0] * (mat[5] * mat[10] - mat[6] * mat[9]) -
    mat[4] * (mat[1] * mat[10] - mat[2] * mat[9]) +
    mat[8] * (mat[1] * mat[6] - mat[2] * mat[5]);
  const scale: [number, number, number] = det < 0 ? [-sx, sy, sz] : [sx, sy, sz];
  const r00 = mat[0] / scale[0];
  const r01 = mat[4] / scale[1];
  const r02 = mat[8] / scale[2];
  const r10 = mat[1] / scale[0];
  const r11 = mat[5] / scale[1];
  const r12 = mat[9] / scale[2];
  const r20 = mat[2] / scale[0];
  const r21 = mat[6] / scale[1];
  const r22 = mat[10] / scale[2];
  const trace = r00 + r11 + r22;
  let rotation: [number, number, number, number];
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    rotation = [(r21 - r12) / s, (r02 - r20) / s, (r10 - r01) / s, 0.25 * s];
  } else if (r00 > r11 && r00 > r22) {
    const s = Math.sqrt(1 + r00 - r11 - r22) * 2;
    rotation = [0.25 * s, (r01 + r10) / s, (r02 + r20) / s, (r21 - r12) / s];
  } else if (r11 > r22) {
    const s = Math.sqrt(1 + r11 - r00 - r22) * 2;
    rotation = [(r01 + r10) / s, 0.25 * s, (r12 + r21) / s, (r02 - r20) / s];
  } else {
    const s = Math.sqrt(1 + r22 - r00 - r11) * 2;
    rotation = [(r02 + r20) / s, (r12 + r21) / s, 0.25 * s, (r10 - r01) / s];
  }
  return { translation, rotation: normalizeQuat(rotation), scale };
}

function invertMat4(m: Float32Array): Float32Array {
  const out = new Float32Array(16);
  const a00 = m[0];
  const a01 = m[1];
  const a02 = m[2];
  const a03 = m[3];
  const a10 = m[4];
  const a11 = m[5];
  const a12 = m[6];
  const a13 = m[7];
  const a20 = m[8];
  const a21 = m[9];
  const a22 = m[10];
  const a23 = m[11];
  const a30 = m[12];
  const a31 = m[13];
  const a32 = m[14];
  const a33 = m[15];

  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;

  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) {
    return identityMat4();
  }
  det = 1.0 / det;

  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

  return out;
}

function transformPoint(mat: Float32Array, x: number, y: number, z: number): [number, number, number] {
  const nx = mat[0] * x + mat[4] * y + mat[8] * z + mat[12];
  const ny = mat[1] * x + mat[5] * y + mat[9] * z + mat[13];
  const nz = mat[2] * x + mat[6] * y + mat[10] * z + mat[14];
  return [nx, ny, nz];
}
