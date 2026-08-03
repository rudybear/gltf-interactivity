// Small duck-typed helpers over the JSON AST shape harness.py's `ast_to_dict`
// produces (see that file's doc comment and packages/parse-py/src/session.ts)
// — mirrors parse-lua/src/index.ts's own free-function helper section, just
// against a plain `{_type, ...fields}` dict instead of luaparse's typed node
// classes. There is deliberately no exhaustive TS union of every ast.AST node
// shape (unlike luaparse's/@gltfi/parse-ts's typed ASTs) — CPython's own
// grammar already guarantees well-formedness, so this file only declares the
// handful of fields each helper actually reads, exactly like the untyped
// object literals in the same spirit as `getTableKeyString` etc.
export type PyNode = { _type: string; lineno?: number; col_offset?: number; [field: string]: unknown };

export function isType(node: PyNode | undefined, type: string): boolean {
  return node !== undefined && node._type === type;
}

export function nodeList(node: unknown): PyNode[] {
  return Array.isArray(node) ? (node as PyNode[]) : [];
}

// `rt.foo(...)` / `m.foo(...)` / `S.foo(...)` — an Attribute-callee Call,
// the ONLY callee shape this emitter ever produces (no bare-name calls
// except `SimpleNamespace()`/`float(...)`/a proc's own `proc0()`, handled
// separately by their own call sites).
export function attrCallOf(node: PyNode | undefined): { base: string; attr: string; call: PyNode } | undefined {
  if (!isType(node, "Call")) {
    return undefined;
  }
  const call = node as PyNode;
  const func = call.func as PyNode | undefined;
  if (!isType(func, "Attribute")) {
    return undefined;
  }
  const value = (func as PyNode).value as PyNode | undefined;
  if (!isType(value, "Name")) {
    return undefined;
  }
  return { base: value!.id as string, attr: (func as PyNode).attr as string, call };
}

export function asAttrCall(node: PyNode | undefined, base: string, attr: string): PyNode | undefined {
  const c = attrCallOf(node);
  return c && c.base === base && c.attr === attr ? c.call : undefined;
}

export function callArgs(call: PyNode): PyNode[] {
  return nodeList(call.args);
}

// A bare `name(...)` call (Name callee, no Attribute) — used for `proc0()`
// call-statements and `SimpleNamespace()`/`float(...)` construction.
export function bareCallOf(node: PyNode | undefined): { name: string; call: PyNode } | undefined {
  if (!isType(node, "Call")) {
    return undefined;
  }
  const call = node as PyNode;
  const func = call.func as PyNode | undefined;
  if (!isType(func, "Name")) {
    return undefined;
  }
  return { name: func!.id as string, call };
}

export function constPType(node: PyNode | undefined): string | undefined {
  return isType(node, "Constant") ? (node!._ptype as string) : undefined;
}

export function stringLiteralValue(node: PyNode | undefined): string | undefined {
  return constPType(node) === "str" ? (node!.value as string) : undefined;
}

export function readBoolLiteral(node: PyNode | undefined): boolean | undefined {
  return constPType(node) === "bool" ? (node!.value as boolean) : undefined;
}

// Inverse of emit-py's `pyFloatLiteral`/`pyIntLiteral`: a bare int/float
// Constant, a unary-minus-negated one (`-5.0`, `-1` — Python's own grammar
// never folds a leading `-` into the literal itself, see this file's own
// header note verified against `ast.parse`), or the exact `float("nan")` /
// `float("inf")` / `float("-inf")` Call shape (the only three-argument forms
// `pyFloatLiteral` ever emits for a non-finite value).
export function readNumberLiteral(node: PyNode | undefined): number | undefined {
  if (!node) {
    return undefined;
  }
  const pt = constPType(node);
  if (pt === "int" || pt === "float") {
    return node.value as number;
  }
  if (isType(node, "UnaryOp") && isType(node.op as PyNode, "USub")) {
    const v = readNumberLiteral(node.operand as PyNode);
    return v === undefined ? undefined : -v;
  }
  const bare = bareCallOf(node);
  if (bare && bare.name === "float" && callArgs(bare.call).length === 1) {
    const s = stringLiteralValue(callArgs(bare.call)[0]);
    if (s === "nan") return NaN;
    if (s === "inf") return Infinity;
    if (s === "-inf") return -Infinity;
  }
  return undefined;
}

export function isLiteralish(node: PyNode): boolean {
  return readNumberLiteral(node) !== undefined || node._type === "List" || node._type === "Dict" || node._type === "Constant";
}

// Plain-array `[a, b, c]` literal (vector/matrix consts, `rt.send`'s payload,
// `m.switchCase`'s cases/values, event-payload... ) — every emitted array
// literal is a bare `List`, never a tuple/generator/comprehension.
export function listElements(node: PyNode | undefined): PyNode[] | undefined {
  return isType(node, "List") ? nodeList(node!.elts) : undefined;
}

// Bare string-keyed dict field lookup (`{"type": ..., "initial": ...}`,
// pointer-arg dicts `{"nodeIndex": ...}`) — the only dict-literal shape this
// emitter ever produces (every key is a `Constant` string, never computed).
export function dictField(node: PyNode, name: string): PyNode | undefined {
  if (!isType(node, "Dict")) {
    return undefined;
  }
  const keys = nodeList(node.keys);
  const values = nodeList(node.values);
  const idx = keys.findIndex((k) => stringLiteralValue(k) === name);
  return idx === -1 ? undefined : values[idx];
}

export function dictKeys(node: PyNode): Set<string> {
  if (!isType(node, "Dict")) {
    return new Set();
  }
  return new Set(nodeList(node.keys).map((k) => stringLiteralValue(k) ?? ""));
}

// `S.<name>` — a state-slot's dict/scalar object itself (Attribute on the
// bare `S` namespace, never nested further).
export function sAttrOf(node: PyNode | undefined): string | undefined {
  if (!isType(node, "Attribute")) {
    return undefined;
  }
  const value = node!.value as PyNode | undefined;
  return isType(value, "Name") && value!.id === "S" ? (node!.attr as string) : undefined;
}

// `S.<name>[<key>]` — a dict-shaped state slot's field (Subscript over an
// `S.<name>` Attribute base), key either a string or int Constant.
export function sSubscriptOf(node: PyNode | undefined): { slotName: string; key: PyNode } | undefined {
  if (!isType(node, "Subscript")) {
    return undefined;
  }
  const base = sAttrOf(node!.value as PyNode | undefined);
  return base === undefined ? undefined : { slotName: base, key: node!.slice as PyNode };
}
