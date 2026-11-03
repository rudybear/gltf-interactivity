// Generic node-configuration validation (the ONE place that implements the
// spec's "invalid configuration => default configuration" rule).
//
// Spec, "Configuration" section: "The default configuration MUST be used when
// the behavior graph does not provide any configuration or when the provided
// configuration is invalid ... For a configuration to be valid, all
// configuration properties defined by the operation specification MUST be
// provided in the behavior graph with valid types and values. If any of the
// configuration properties ... is omitted or has invalid type or invalid
// value, the whole configuration is invalid and the operation behavior MUST
// fall back to the default configuration if the latter is supported.
// Configuration properties present in the behavior graph but not defined by
// the operation specification MUST be ignored."
//
// The per-op property lists, types, defaults and extra constraints (min/max/
// oneOf) live in OP_REGISTRY (`OpSpec.config`); this module is the only code
// that interprets them. Consumers (the interpreter's graph normalization, the
// IR importer) call `normalizeConfiguration` once per node up front, so every
// downstream reader just sees a valid configuration and needs no per-op
// "is this value sane" checks.
//
// Ops with a REQUIRED config field (variable/*, pointer/*, event/send, ...)
// have no default configuration; their invalid configs reject the whole graph
// and are not handled here (normalizeConfiguration returns them untouched).
// Environment-neutral (no node/DOM imports).

import { OP_REGISTRY, type OpConfigField, type OpSpec } from "./registry.js";

export type RawConfigEntry = { value?: Array<number | boolean | string> };
export type RawConfiguration = Record<string, RawConfigEntry | undefined>;

function isInt32(x: unknown): x is number {
  // Spec tip: `s === (s | 0)` -- also rejects NaN, +-Infinity, fractions and
  // anything outside [-2^31, 2^31-1].
  return typeof x === "number" && x === (x | 0);
}

// Returns true when `raw` (the config entry's `value` array) is a valid
// literal for `field`. A scalar field takes exactly one element; "int[]"
// takes any number of valid int32 elements.
export function isValidConfigValue(field: OpConfigField, raw: unknown): boolean {
  if (!Array.isArray(raw)) {
    return false;
  }
  if (field.type === "int[]") {
    return raw.every(isInt32);
  }
  if (raw.length !== 1) {
    return false;
  }
  const v = raw[0];
  switch (field.type) {
    case "int":
      return isInt32(v) && (field.min === undefined || v >= field.min) && (field.max === undefined || v <= field.max);
    case "bool":
      return typeof v === "boolean";
    case "string":
      return typeof v === "string" && (field.oneOf === undefined || field.oneOf.includes(v));
  }
}

// True for ops that support a default configuration (they declare config
// fields and none is required).
export function hasDefaultConfiguration(spec: OpSpec | undefined): spec is OpSpec & { config: OpConfigField[] } {
  return !!spec?.config && spec.config.length > 0 && spec.config.every((f) => !f.required);
}

// True when `configuration` is a valid configuration for `op` (vacuously true
// for ops without a default configuration; those are validated elsewhere).
export function isValidConfiguration(op: string, configuration: RawConfiguration | undefined): boolean {
  const spec = OP_REGISTRY.get(op);
  if (!hasDefaultConfiguration(spec)) {
    return true;
  }
  return spec.config.every((field) => isValidConfigValue(field, configuration?.[field.name]?.value));
}

function defaultEntry(field: OpConfigField): RawConfigEntry {
  const d = field.default;
  return { value: Array.isArray(d) ? [...d] : [d as number | boolean | string] };
}

// Returns a configuration that is guaranteed valid for `op`: the input itself
// (same reference) when it already is, otherwise a copy where every property
// the op defines is replaced by its default (the whole configuration falls
// back, not just the offending property). Unknown properties are preserved
// as-is -- they are ignored by every reader. Ops without a default
// configuration are returned untouched.
export function normalizeConfiguration(op: string, configuration: RawConfiguration | undefined): RawConfiguration | undefined {
  const spec = OP_REGISTRY.get(op);
  if (!hasDefaultConfiguration(spec)) {
    return configuration;
  }
  if (isValidConfiguration(op, configuration)) {
    return configuration;
  }
  const out: RawConfiguration = { ...(configuration ?? {}) };
  for (const field of spec.config) {
    out[field.name] = defaultEntry(field);
  }
  return out;
}
