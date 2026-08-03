// Query helpers over OP_REGISTRY: overload resolution (unifying generic F/V/M/T
// families to a single concrete type per node) and simple lookups. No data
// lives here — see registry.ts.

import { F_FAMILY, M_FAMILY, OP_REGISTRY, V_FAMILY, type Generic, type OpCategory, type OpSpec, type TypeSig } from "./registry.js";

export type ResolvedOverload = {
  op: string;
  overloadIndex: number;
  inputs: Record<string, TypeSig>;
  outputs: Record<string, TypeSig>;
};

export function getOpSpec(op: string): OpSpec | undefined {
  return OP_REGISTRY.get(op);
}

export function opsByCategory(category: OpCategory): OpSpec[] {
  const out: OpSpec[] = [];
  for (const spec of OP_REGISTRY.values()) {
    if (spec.category === category) {
      out.push(spec);
    }
  }
  return out;
}

function isGeneric(type: TypeSig | Generic): type is Generic {
  return type === "F" || type === "V" || type === "M" || type === "T";
}

// Returns the family of concrete types a generic placeholder may resolve to,
// or null for "T" (any value type, incl. ref/custom).
function familyOf(generic: Generic): readonly TypeSig[] | null {
  switch (generic) {
    case "F":
      return F_FAMILY;
    case "V":
      return V_FAMILY;
    case "M":
      return M_FAMILY;
    case "T":
      return null;
  }
}

// Resolves an op's overload against a set of concrete socket types. All
// generic (F/V/M/T) sockets sharing the same letter within one overload row
// must unify to the SAME concrete type. Sockets present in `inputTypes` but
// not on a given overload row (or vice versa: declared sockets missing from
// `inputTypes`) don't by themselves disqualify a row — callers may probe with
// a partial socket set — but any socket that IS present must be consistent
// with the row's declared type, and every generic used anywhere in the row
// (inputs or outputs) must end up resolved for the row to be selectable.
export function resolveOverload(op: string, inputTypes: Record<string, TypeSig>): ResolvedOverload | undefined {
  const spec = OP_REGISTRY.get(op);
  if (!spec) {
    return undefined;
  }

  rows: for (let overloadIndex = 0; overloadIndex < spec.overloads.length; overloadIndex += 1) {
    const row = spec.overloads[overloadIndex];
    const assignment = new Map<Generic, TypeSig>();

    for (const input of row.inputs) {
      const provided = inputTypes[input.name];
      if (provided === undefined) {
        continue;
      }
      if (isGeneric(input.type)) {
        const family = familyOf(input.type);
        if (family && !family.includes(provided)) {
          continue rows;
        }
        const existing = assignment.get(input.type);
        if (existing !== undefined && existing !== provided) {
          continue rows;
        }
        assignment.set(input.type, provided);
      } else if (input.type !== provided) {
        continue rows;
      }
    }

    const resolvedInputs: Record<string, TypeSig> = {};
    for (const input of row.inputs) {
      if (isGeneric(input.type)) {
        const resolved = assignment.get(input.type);
        if (!resolved) {
          continue rows; // generic socket never pinned down by a provided input
        }
        resolvedInputs[input.name] = resolved;
      } else {
        resolvedInputs[input.name] = input.type;
      }
    }

    const resolvedOutputs: Record<string, TypeSig> = {};
    for (const output of row.outputs) {
      if (isGeneric(output.type)) {
        const resolved = assignment.get(output.type);
        if (!resolved) {
          continue rows; // e.g. select's T never pinned down because caller passed no a/b types
        }
        resolvedOutputs[output.name] = resolved;
      } else {
        resolvedOutputs[output.name] = output.type;
      }
    }

    return { op, overloadIndex, inputs: resolvedInputs, outputs: resolvedOutputs };
  }

  return undefined;
}
