// Conversions between the compiled engine's raw-JS value representation
// (float=number, int=number, bool=boolean, vector/matrix=number[], ref=
// string) and @gltfi/kernel's tagged `Value` shape ({type, data}), which the
// conformance judge protocol (packages/conformance/src/protocol.ts) expects
// from `EngineLike.getVariableByIndex` — the interpreter engine returns
// kernel Values natively, so the compiled engine must translate at that one
// boundary to satisfy a shared `EngineLike` contract.
import type { Value, ValueType } from "@gltfi/kernel";

export type RawValue = number | boolean | string | number[];

export function rawToKernelValue(type: ValueType, raw: RawValue): Value {
  if (type === "bool") {
    return { type, data: [Boolean(raw)] };
  }
  if (type === "ref") {
    return { type, data: [String(raw)] };
  }
  if (type === "int" || type === "float") {
    return { type, data: [Number(raw)] };
  }
  return { type, data: Array.isArray(raw) ? [...raw] : [Number(raw)] };
}

export function kernelValueToRaw(type: ValueType, value: Value): RawValue {
  if (type === "bool") {
    return Boolean((value.data as unknown[])[0]);
  }
  if (type === "ref") {
    return String((value.data as unknown[])[0] ?? "");
  }
  if (type === "int" || type === "float") {
    return Number((value.data as unknown[])[0]);
  }
  return (value.data as number[]).slice();
}
