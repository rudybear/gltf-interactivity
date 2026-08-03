// Small duck-typed helpers over the JSON AST shape Harness.cs's `AstNodeToJson`
// produces (see that file's header/`CmdAst` doc comments and
// packages/parse-cs/src/session.ts) — mirrors packages/parse-py/src/
// ast-helpers.ts's identically-purposed helper section almost field-for-
// field, just against Roslyn's `{_type, ...fields}` dict (built by GENERIC
// reflection over each concrete SyntaxNode subtype, `_type` = `Kind().
// ToString()`) instead of CPython's own `ast` module's `{_type, ...fields}`
// dict. As with parse-py's ast-helpers.ts, there is deliberately no
// exhaustive TS union of every Roslyn node shape — the harness's own
// reflection-based dump already guarantees every node/token Roslyn itself
// parsed is present under its OWN declared property names, so this file
// only declares the handful of fields each helper actually reads.
//
// One genuinely C#-specific addition with no Python/Lua counterpart:
// `unwrap`/`unwrapCast`. Unlike Python (whose `ast.parse` silently drops
// redundant grouping parens) or Lua (whose grammar has no unary "unchecked"
// concept at all), Roslyn preserves EVERY `(...)`, `unchecked(...)`, and
// `(SomeType)expr` cast exactly as written — and @gltfi/emit-cs's own
// `emitNativeOp`/`csCastForType`/`csDirectCastForType` (see that file's
// header) wrap expressions in exactly these three forms purely for C#
// static-typing/overflow-checking correctness, never to change runtime
// value semantics. `unwrap` peels all three generically before any
// shape-dispatch match is attempted (mirrors parse-ts's/parse-lua's own
// "look through emitter-inserted syntactic noise" helpers, just with a
// C#-specific wrapper set); `unwrapCast` is the one place a cast's target
// type is actually CONSULTED rather than discarded — see index.ts's
// `lowerExpr` header note on the one construct (a cross-handler
// `rt.EventOutRead(...)` read) where that type is genuine information with
// no other place to recover it from.
import type { IRType } from "@gltfi/ir";

export type CsNode = { _type: string; lineno?: number; col_offset?: number; [field: string]: unknown };

export function isType(node: CsNode | undefined, type: string): boolean {
  return node !== undefined && node._type === type;
}

export function nodeList(node: unknown): CsNode[] {
  return Array.isArray(node) ? (node as CsNode[]) : [];
}

const WRAPPER_KINDS = new Set(["ParenthesizedExpression", "UncheckedExpression", "CheckedExpression", "CastExpression"]);

// Peels `(...)`, `unchecked(...)`/`checked(...)`, and `(Type)...` wrappers
// repeatedly — see this file's header note. Safe everywhere EXCEPT the one
// site (index.ts's cross-handler-read recognition) that consults a cast's
// OWN target type via `unwrapCast` before calling this.
export function unwrap(node: CsNode): CsNode {
  let n = node;
  while (WRAPPER_KINDS.has(n._type)) {
    n = n.Expression as CsNode;
  }
  return n;
}

const CS_CAST_TYPE_MAP: Record<string, IRType> = { int: "int", bool: "bool", string: "ref", double: "float" };

// Single-outer-cast peek: `(SomeType)expr` -> `{ inner: <expr fully
// unwrapped>, irType: <SomeType, if it maps to an unambiguous IRType> }`.
// `irType` is `undefined` for "double[]" (ambiguous — could be any of
// float2/float3/float4/float2x2/float3x3/float4x4; no cast alone
// disambiguates a CLR `double[]`'s intended vector/matrix arity) or a
// non-`CastExpression` node ( -> `undefined` return entirely, not a
// zero-field object, so callers can `if (peek) ...` directly).
export function unwrapCast(node: CsNode): { inner: CsNode; irType?: IRType } | undefined {
  if (!isType(node, "CastExpression")) {
    return undefined;
  }
  const typeNode = node.Type as CsNode;
  const keyword = isType(typeNode, "PredefinedType") ? (typeNode.Keyword as string) : undefined;
  const irType = keyword ? CS_CAST_TYPE_MAP[keyword] : undefined;
  return { inner: unwrap(node.Expression as CsNode), irType };
}

// `a.b` (SimpleMemberAccessExpression) — `base` is populated only when the
// LEFT side is a plain `IdentifierName` (the shape this emitter's own
// `V.<name>`/`Events.<name>`/`M.<fn>`/`rt.<fn>`/`payload.<Field>`/
// `<slot>.<Field>` conventions ever produce) OR a `PredefinedType` keyword
// (`int`/`double`/... — Roslyn's OWN representation of a built-in type name
// used as a static-member qualifier, the shape `int.MinValue`/`double.NaN`/
// `double.PositiveInfinity`/`double.NegativeInfinity` parse as — see
// `readNumberLiteral`'s own doc comment for why @gltfi/emit-cs's
// `csIntLiteral`/`csFloatLiteral` fall back to these for the handful of
// int32/double values with no ordinary literal-token spelling); a chained
// access (e.g. a hypothetical `a.b.c`) leaves `base` undefined, which every
// caller here treats as "not a match" (this emitter never nests member
// access two levels deep).
export function memberAccessOf(node: CsNode | undefined): { base?: string; name: string; node: CsNode } | undefined {
  if (!isType(node, "SimpleMemberAccessExpression")) {
    return undefined;
  }
  const n = node as CsNode;
  const left = n.Expression as CsNode | undefined;
  const nameNode = n.Name as CsNode | undefined;
  if (!isType(nameNode, "IdentifierName")) {
    return undefined;
  }
  const base = isType(left, "IdentifierName") ? (left!.Identifier as string) : isType(left, "PredefinedType") ? (left!.Keyword as string) : undefined;
  return { base, name: nameNode!.Identifier as string, node: n };
}

export function identifierNameOf(node: CsNode | undefined): string | undefined {
  return isType(node, "IdentifierName") ? (node!.Identifier as string) : undefined;
}

// `<base>.<attr>(...)` — the dominant callee shape this emitter produces
// (`rt.Foo(...)`, `M.Foo(...)`, `slotName.Foo(...)`, ...). Mirrors parse-py's
// identically-named helper.
export function attrCallOf(node: CsNode | undefined): { base: string; attr: string; call: CsNode } | undefined {
  if (!isType(node, "InvocationExpression")) {
    return undefined;
  }
  const call = node as CsNode;
  const access = memberAccessOf(call.Expression as CsNode | undefined);
  if (!access || access.base === undefined) {
    return undefined;
  }
  return { base: access.base, attr: access.name, call };
}

export function asAttrCall(node: CsNode | undefined, base: string, attr: string): CsNode | undefined {
  const c = attrCallOf(node);
  return c && c.base === base && c.attr === attr ? c.call : undefined;
}

// A bare `name(...)` call (Identifier callee, no member access) — used for
// proc-call statements (`ProcName();`) and continuation references passed
// as bare method-group values (`rt.OnStart(OnStart0);`, an async `done`
// argument).
export function bareCallOf(node: CsNode | undefined): { name: string; call: CsNode } | undefined {
  if (!isType(node, "InvocationExpression")) {
    return undefined;
  }
  const call = node as CsNode;
  const name = identifierNameOf(call.Expression as CsNode | undefined);
  return name === undefined ? undefined : { name, call };
}

// `ArgumentList.Arguments[].Expression` — unwraps the `ArgumentSyntax`
// layer Roslyn always interposes between a call and its actual value
// expressions (no counterpart needed in parse-py: Python's own `ast.Call.
// args` is already a flat list of expressions).
export function callArgs(call: CsNode): CsNode[] {
  const argList = call.ArgumentList as CsNode | undefined;
  return nodeList(argList?.Arguments).map((a) => a.Expression as CsNode);
}

export function literalPType(node: CsNode | undefined): string | undefined {
  return isType(node, "Literal") ? (node!._ptype as string) : undefined;
}

export function stringLiteralValue(node: CsNode | undefined): string | undefined {
  return literalPType(node) === "str" ? (node!.value as string) : undefined;
}

export function readBoolLiteral(node: CsNode | undefined): boolean | undefined {
  return literalPType(node) === "bool" ? (node!.value as boolean) : undefined;
}

// Harness.cs's `EncodeNum` mirrors harness.py's/Harness.cs's own compiled-
// backend `EncodeNum`/`DecodeNum` wire convention (plain JSON has no NaN/
// Infinity of its own) — see Harness.cs's header. Never actually reachable
// via a genuine `NumericLiteralExpression` (see this file's header note:
// @gltfi/emit-cs's `csFloatLiteral` spells NaN/Infinity as `double.NaN`/
// `double.Positive|NegativeInfinity` member-access expressions, never a
// literal token), but decoded defensively regardless.
function decodeNum(x: unknown): number {
  if (x === "NaN") return NaN;
  if (x === "Infinity") return Infinity;
  if (x === "-Infinity") return -Infinity;
  return Number(x);
}

const DOUBLE_SPECIALS: Record<string, number> = { NaN: NaN, PositiveInfinity: Infinity, NegativeInfinity: -Infinity };

// Inverse of @gltfi/emit-cs's `csFloatLiteral`/`csIntLiteral`: a bare int/
// float `Literal` (this emitter's own `_type`, set by Harness.cs's
// `EncodeLiteral` — see that method's doc comment for exactly which Roslyn
// `LiteralExpressionSyntax` kinds it covers), a `UnaryMinusExpression`-
// negated one (`-5`, `-5.0` — like Python's grammar, C#'s never folds a
// leading `-` into the literal token itself), `int.MinValue` (the one int32
// value `csIntLiteral` can't spell as a plain negated literal — see that
// function's own doc comment on the CS0220 compile-error it sidesteps), or
// `double.NaN`/`double.PositiveInfinity`/`double.NegativeInfinity` (the
// three non-finite values `csFloatLiteral` can't spell as a literal token
// at all).
export function readNumberLiteral(node: CsNode | undefined): number | undefined {
  if (!node) {
    return undefined;
  }
  const pt = literalPType(node);
  if (pt === "int" || pt === "float") {
    return decodeNum(node.value);
  }
  if (isType(node, "UnaryMinusExpression")) {
    const v = readNumberLiteral(unwrap(node.Operand as CsNode));
    return v === undefined ? undefined : -v;
  }
  const access = memberAccessOf(node);
  if (access && access.base === "int" && access.name === "MinValue") {
    return -2147483648;
  }
  if (access && access.base === "double" && access.name in DOUBLE_SPECIALS) {
    return DOUBLE_SPECIALS[access.name];
  }
  return undefined;
}

export function isLiteralish(node: CsNode): boolean {
  const n = unwrap(node);
  return readNumberLiteral(n) !== undefined || n._type === "ArrayCreationExpression" || n._type === "ImplicitArrayCreationExpression" || n._type === "Literal";
}

// `new double[] { ... }` / `new int[] { ... }` / `new object[] { ... }`
// (`ArrayCreationExpression`) or `new[] { ... }` (`ImplicitArrayCreation
// Expression`, used by `M.SwitchCase`'s inferred-element-type `values`
// array — see @gltfi/emit-cs's `emitIntrinsicExpr`'s math/switch case) —
// the only two array-literal shapes this emitter ever produces.
export function listElements(node: CsNode | undefined): CsNode[] | undefined {
  const n = node ? unwrap(node) : undefined;
  if (!n || (n._type !== "ArrayCreationExpression" && n._type !== "ImplicitArrayCreationExpression")) {
    return undefined;
  }
  const init = n.Initializer as CsNode | undefined;
  return nodeList(init?.Expressions);
}

// `new Dictionary<string, object> { [name] = value, ... }` — the C# 6
// "index initializer" shape @gltfi/emit-cs's `pointerCall` uses for a
// pointer op's dynamic-param dictionary (see that method's own doc
// comment). Each entry parses as a `SimpleAssignmentExpression` whose
// `Left` is an `ImplicitElementAccess` (`[name]`) and whose `Right` is the
// value — Roslyn's syntax for this indexer-initializer form (distinct from
// the older `{key, value}` two-element-per-entry shape, which this emitter
// never produces).
export function dictionaryEntries(node: CsNode | undefined): Map<string, CsNode> | undefined {
  const n = node ? unwrap(node) : undefined;
  if (!n || n._type !== "ObjectCreationExpression") {
    return undefined;
  }
  const typeNode = n.Type as CsNode | undefined;
  if (!typeNode || typeNode._type !== "GenericName" || typeNode.Identifier !== "Dictionary") {
    return undefined;
  }
  const init = n.Initializer as CsNode | undefined;
  const map = new Map<string, CsNode>();
  for (const entry of nodeList(init?.Expressions)) {
    if (!isType(entry, "SimpleAssignmentExpression")) {
      continue;
    }
    const left = entry.Left as CsNode;
    if (!isType(left, "ImplicitElementAccess")) {
      continue;
    }
    const idxArgs = nodeList((left.ArgumentList as CsNode | undefined)?.Arguments).map((a) => a.Expression as CsNode);
    const key = stringLiteralValue(idxArgs[0]);
    if (key !== undefined) {
      map.set(key, entry.Right as CsNode);
    }
  }
  return map;
}

// `new <Identifier>(...)` / `new <Identifier>()` — plain (non-generic)
// object creation, e.g. `new Vars(rt)`, `new DoNState()`, `new
// EventPayload(a, b, c, d)`.
export function objectCreationOf(node: CsNode | undefined): { typeName: string; args: CsNode[] } | undefined {
  const n = node ? unwrap(node) : undefined;
  if (!n || n._type !== "ObjectCreationExpression") {
    return undefined;
  }
  const typeNode = n.Type as CsNode | undefined;
  const typeName = identifierNameOf(typeNode);
  if (typeName === undefined) {
    return undefined;
  }
  return { typeName, args: callArgs(n) };
}
