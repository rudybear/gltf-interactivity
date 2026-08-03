export type WebGpuContext = {
  adapter: GPUAdapter;
  device: GPUDevice;
  format: GPUTextureFormat;
  context: GPUCanvasContext;
};

export async function initWebGpu(canvas: HTMLCanvasElement): Promise<WebGpuContext> {
  if (!("gpu" in navigator)) {
    throw new Error("WebGPU not supported. Use Chrome 113+ with WebGPU enabled.");
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("No GPU adapter found.");
  }

  const device = await adapter.requestDevice();
  const context = canvas.getContext("webgpu");
  if (!context) {
    throw new Error("Failed to get WebGPU context.");
  }

  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: "opaque" });

  return { adapter, device, format, context };
}
