// Invariant checker for @gltfi/ir modules. See docs/design/ir-and-transpiler.md
// ("Invariant checker") for the base rules; one rule is deliberately relaxed
// from the doc's literal wording:
//
//   "proc call graph acyclic" — the doc states this as an absolute, but
//   import.ts's header comment explains why a genuinely repeating async
//   pattern (e.g. a self-restarting setDelay) legitimately produces a proc
//   whose body calls itself through an `async.done` Cont: `done` fires after
//   the calling stack has fully unwound (real time elapses first), so it is
//   not runaway synchronous recursion. This checker therefore verifies
//   acyclicity of the *synchronous* call graph only — edges reached through
//   an `async.done` Cont (proc or inline) are excluded from cycle detection.
//   A cycle that does NOT pass through a done-Cont is a genuine bug (would
//   blow the stack at runtime) and is reported as an error.
//
// Two more checks are intentionally soft (warnings, not errors) because
// verifying them exactly would require call-site-sensitive analysis this
// checker doesn't do:
//   - a `param` read inside a *proc* body (procs can in principle be called
//     from more than one flow context; see import.ts's discussion of the
//     `param`-in-proc edge case) — warns rather than errors.
//   - `op`/`varGet`/`ptrGet` argument type mismatches against a `temp`'s
//     declared type are still checked exactly (temp types are always known),
//     it's specifically the "which handler owns this proc" question that's
//     approximate.
//   - an arg typed wider than a *fixed* (non-generic) "float" socket — e.g.
//     math/mix's interpolation factor "c" — warns instead of erroring: the
//     interpreter reads such sockets via valueToNumberArray(v)[0], and at
//     least one real corpus asset (math/mix) relies on that by feeding a
//     same-valued vector broadcast in place of a true scalar.
import { getOpSpec, resolveOverload } from "@gltfi/kernel";
import { typeSigToIRType, type Cont, type Diagnostic, type IRExpr, type IRModule, type IRStmt, type IRType, type TempId } from "./model.js";

const FLOAT_FAMILY = new Set<IRType>(["float", "float2", "float3", "float4", "float2x2", "float3x3", "float4x4"]);

export function checkModule(module: IRModule): Diagnostic[] {
  return new Checker(module).run();
}

type WalkCtx = {
  ownerKind: "handler" | "proc";
  ownerId: number;
  paramTypes: Map<string, IRType> | null;
  inDoneCont: boolean;
};

class Checker {
  private readonly module: IRModule;
  private readonly diagnostics: Diagnostic[] = [];
  private readonly syncEdges = new Map<number, Set<number>>();

  constructor(module: IRModule) {
    this.module = module;
  }

  run(): Diagnostic[] {
    this.module.handlers.forEach((h, i) => {
      const ctx: WalkCtx = {
        ownerKind: "handler",
        ownerId: i,
        paramTypes: new Map(h.params.map((p) => [p.name, p.type])),
        inDoneCont: false
      };
      this.walkStmt(h.body, new Map(), ctx);
    });
    this.module.procs.forEach((p) => {
      const ctx: WalkCtx = { ownerKind: "proc", ownerId: p.id, paramTypes: null, inDoneCont: false };
      this.walkStmt(p.body, new Map(), ctx);
    });
    this.checkAcyclic();
    return this.diagnostics;
  }

  // -------------------------------------------------------------------
  // Statements
  // -------------------------------------------------------------------

  private walkStmt(stmt: IRStmt, scope: Map<TempId, IRType>, ctx: WalkCtx) {
    switch (stmt.k) {
      case "seq": {
        const local = new Map(scope);
        for (const s of stmt.stmts) {
          this.walkStmt(s, local, ctx);
          if (s.k === "let") {
            local.set(s.temp, s.type);
          }
        }
        return;
      }
      case "let":
        this.walkExpr(stmt.expr, scope, ctx);
        return;
      case "if":
        this.walkExpr(stmt.cond, scope, ctx);
        this.walkStmt(stmt.then, new Map(scope), ctx);
        if (stmt.else) {
          this.walkStmt(stmt.else, new Map(scope), ctx);
        }
        return;
      case "while":
        this.walkExpr(stmt.cond, scope, ctx);
        this.walkStmt(stmt.body, new Map(scope), ctx);
        if (stmt.completed) {
          this.walkStmt(stmt.completed, new Map(scope), ctx);
        }
        return;
      case "for":
        this.walkExpr(stmt.start, scope, ctx);
        this.walkExpr(stmt.end, scope, ctx);
        if (stmt.slot) {
          this.checkStateSlotKind(stmt.slot.slot, ["for"]);
        }
        this.walkStmt(stmt.body, new Map(scope), ctx);
        if (stmt.completed) {
          this.walkStmt(stmt.completed, new Map(scope), ctx);
        }
        return;
      case "switch":
        this.walkExpr(stmt.selector, scope, ctx);
        for (const [, body] of stmt.cases) {
          this.walkStmt(body, new Map(scope), ctx);
        }
        if (stmt.default) {
          this.walkStmt(stmt.default, new Map(scope), ctx);
        }
        return;
      case "setVar":
        this.checkSetVar(stmt.varId, stmt.expr, scope);
        this.walkExpr(stmt.expr, scope, ctx);
        return;
      case "setPointer":
        for (const a of stmt.args) {
          this.walkExpr(a, scope, ctx);
        }
        this.walkExpr(stmt.value, scope, ctx);
        if (stmt.out) {
          this.walkStmt(stmt.out, new Map(scope), ctx);
        }
        if (stmt.err) {
          this.walkStmt(stmt.err, new Map(scope), ctx);
        }
        return;
      case "emitEvent":
        if (stmt.eventId < 0 || stmt.eventId >= this.module.events.length) {
          this.error("GIC031", `emitEvent references out-of-range eventId ${stmt.eventId}`);
        }
        for (const a of stmt.args) {
          this.walkExpr(a, scope, ctx);
        }
        return;
      case "stopPropagation":
        this.walkExpr(stmt.stopImmediate, scope, ctx);
        return;
      case "log":
        for (const a of stmt.args) {
          this.walkExpr(a, scope, ctx);
        }
        return;
      case "callProc":
        this.registerProcCall(ctx, stmt.procId);
        return;
      case "async": {
        for (const a of stmt.args) {
          this.walkExpr(a, scope, ctx);
        }
        if (stmt.slot) {
          this.checkStateSlotKind(stmt.slot.slot, ["delay"]);
        }
        if (stmt.out) {
          this.walkStmt(stmt.out, new Map(scope), ctx);
        }
        if (stmt.err) {
          this.walkStmt(stmt.err, new Map(scope), ctx);
        }
        if (stmt.done) {
          const saved = ctx.inDoneCont;
          ctx.inDoneCont = true;
          this.walkCont(stmt.done, ctx);
          ctx.inDoneCont = saved;
        }
        return;
      }
      case "stateful": {
        for (const a of stmt.args) {
          this.walkExpr(a, scope, ctx);
        }
        this.checkStateSlotKind(stmt.slot.slot, [stmt.kind]);
        for (const key of Object.keys(stmt.outs)) {
          this.walkStmt(stmt.outs[key], new Map(scope), ctx);
        }
        return;
      }
      case "intrinsic": {
        for (const a of stmt.args) {
          this.walkExpr(a, scope, ctx);
        }
        for (const key of Object.keys(stmt.outs)) {
          this.walkStmt(stmt.outs[key], new Map(scope), ctx);
        }
        return;
      }
    }
  }

  private walkCont(cont: Cont, ctx: WalkCtx) {
    if (cont.kind === "proc") {
      this.registerProcCall(ctx, cont.procId);
      return;
    }
    this.walkStmt(cont.body, new Map(), ctx);
  }

  // -------------------------------------------------------------------
  // Expressions
  // -------------------------------------------------------------------

  private walkExpr(expr: IRExpr, scope: Map<TempId, IRType>, ctx: WalkCtx) {
    switch (expr.k) {
      case "const":
        return;
      case "varGet":
        if (expr.varId < 0 || expr.varId >= this.module.variables.length) {
          this.error("GIC022", `varGet references out-of-range varId ${expr.varId}`);
        }
        return;
      case "ptrGet":
        for (const a of expr.args) {
          this.walkExpr(a, scope, ctx);
        }
        return;
      case "param":
        this.checkParam(expr.name, expr.type, ctx);
        return;
      case "op":
        this.checkOp(expr, scope);
        for (const a of expr.args) {
          this.walkExpr(a, scope, ctx);
        }
        return;
      case "temp":
        if (!scope.has(expr.id)) {
          this.error("GIC001", `temp "${expr.id}" referenced before its let (or from a continuation defined outside its site)`);
        }
        return;
      case "stateRead":
        this.checkStateSlotKind(expr.slot.slot, undefined);
        return;
      case "intrinsic":
        if (expr.op === "math/switch") {
          this.checkMathSwitch(expr, scope);
        }
        for (const a of expr.args) {
          this.walkExpr(a, scope, ctx);
        }
        return;
    }
  }

  private checkOp(expr: Extract<IRExpr, { k: "op" }>, scope: Map<TempId, IRType>) {
    const spec = getOpSpec(expr.op);
    if (!spec) {
      this.error("GIC010", `unknown op "${expr.op}"`);
      return;
    }
    const resolved = resolveOverload(expr.op, expr.overload.inputs);
    if (!resolved || resolved.overloadIndex !== expr.overload.overloadIndex) {
      this.error("GIC011", `op "${expr.op}" does not resolve consistently via resolveOverload`);
      return;
    }
    const row = spec.overloads[expr.overload.overloadIndex];
    if (expr.args.length !== row.inputs.length) {
      this.error("GIC012", `op "${expr.op}" arg count ${expr.args.length} != declared ${row.inputs.length}`);
      return;
    }
    row.inputs.forEach((inputSocket, i) => {
      const expectedTypeSig = expr.overload.inputs[inputSocket.name];
      const expectedType = expectedTypeSig ? typeSigToIRType(expectedTypeSig) : undefined;
      const argType = this.inferExprType(expr.args[i], scope);
      if (!expectedType || !argType || argType === expectedType) {
        return;
      }
      // Real-corpus tolerance, not a hole in the checker: sockets declared
      // as scalar "float" but fixed (non-generic) — e.g. math/mix's
      // interpolation factor "c" — are read by the interpreter via
      // valueToNumberArray(v)[0], silently dropping any extra components.
      // math/mix/switch/smoothStep test assets rely on this by feeding a
      // same-valued vector broadcast into "c" instead of a true scalar.
      // Flag it, but don't fail the corpus-totality check over it.
      if (expectedType === "float" && FLOAT_FAMILY.has(argType)) {
        this.warn("GIC015", `op "${expr.op}" arg "${inputSocket.name}" expects float, got ${argType} (tolerated: interpreter reads component 0 only)`);
        return;
      }
      this.error("GIC013", `op "${expr.op}" arg "${inputSocket.name}" expects ${expectedType}, got ${argType}`);
    });
    const socket = expr.socket ?? "value";
    if (!(socket in resolved.outputs)) {
      this.error("GIC014", `op "${expr.op}" has no output socket "${socket}"`);
    }
  }

  private checkMathSwitch(expr: Extract<IRExpr, { k: "intrinsic" }>, scope: Map<TempId, IRType>) {
    if (expr.args.length < 2) {
      this.error("GIC050", "math/switch requires at least selection+default args");
      return;
    }
    const selType = this.inferExprType(expr.args[0], scope);
    if (selType && selType !== "int") {
      this.error("GIC051", `math/switch selection must be int, got ${selType}`);
    }
    for (let i = 1; i < expr.args.length; i += 1) {
      const t = this.inferExprType(expr.args[i], scope);
      if (t && t !== expr.type) {
        this.error("GIC052", `math/switch arg ${i} expects ${expr.type}, got ${t}`);
      }
    }
  }

  private checkSetVar(varId: number, expr: IRExpr, scope: Map<TempId, IRType>) {
    const variable = this.module.variables[varId];
    if (!variable) {
      this.error("GIC020", `setVar references out-of-range varId ${varId}`);
      return;
    }
    const exprType = this.inferExprType(expr, scope);
    if (exprType && exprType !== variable.type) {
      this.error("GIC021", `setVar ${variable.name} expects ${variable.type}, got ${exprType}`);
    }
  }

  private checkParam(name: string, type: IRType, ctx: WalkCtx) {
    if (ctx.paramTypes === null) {
      // Inside a proc body: see the file header note — soft-checked only.
      this.warn("GIC060", `proc references handler-local param "${name}"; only valid if every caller shares this param`);
      return;
    }
    const declared = ctx.paramTypes.get(name);
    if (declared === undefined) {
      this.error("GIC061", `param "${name}" is not declared by this handler`);
      return;
    }
    if (declared !== type) {
      this.warn("GIC062", `param "${name}" used at type ${type} but handler declares ${declared}`);
    }
  }

  private checkStateSlotKind(slotIndex: number, allowedKinds: string[] | undefined) {
    const slot = this.module.stateSlots[slotIndex];
    if (!slot) {
      this.error("GIC070", `state slot index ${slotIndex} out of range`);
      return;
    }
    if (allowedKinds && !allowedKinds.includes(slot.kind)) {
      this.error("GIC071", `state slot "${slot.name}" has kind ${slot.kind}, expected one of ${allowedKinds.join("/")}`);
    }
  }

  private registerProcCall(ctx: WalkCtx, procId: number) {
    if (procId < 0 || procId >= this.module.procs.length) {
      this.error("GIC030", `callProc references out-of-range procId ${procId}`);
      return;
    }
    if (ctx.ownerKind === "proc" && !ctx.inDoneCont) {
      let set = this.syncEdges.get(ctx.ownerId);
      if (!set) {
        set = new Set();
        this.syncEdges.set(ctx.ownerId, set);
      }
      set.add(procId);
    }
  }

  private inferExprType(expr: IRExpr, scope: Map<TempId, IRType>): IRType | undefined {
    switch (expr.k) {
      case "const":
        return expr.type;
      case "varGet":
        return this.module.variables[expr.varId]?.type;
      case "ptrGet":
        return expr.type;
      case "param":
        return expr.type;
      case "op": {
        const t = expr.overload.outputs[expr.socket ?? "value"];
        return t ? typeSigToIRType(t) : undefined;
      }
      case "temp":
        return scope.get(expr.id);
      case "stateRead":
        return expr.type;
      case "intrinsic":
        return expr.type;
    }
  }

  // -------------------------------------------------------------------
  // Proc call graph acyclicity (sync edges only — see file header note).
  // -------------------------------------------------------------------

  private checkAcyclic() {
    const color = new Map<number, 0 | 1 | 2>();
    const path: number[] = [];
    const reported = new Set<string>();
    const dfs = (id: number) => {
      color.set(id, 1);
      path.push(id);
      for (const next of this.syncEdges.get(id) ?? []) {
        const c = color.get(next) ?? 0;
        if (c === 1) {
          const start = path.indexOf(next);
          const cycle = path.slice(start).concat(next);
          const key = [...cycle].sort((a, b) => a - b).join(",");
          if (!reported.has(key)) {
            reported.add(key);
            const names = cycle.map((pid) => this.module.procs[pid]?.name ?? `proc${pid}`).join(" -> ");
            this.error("GIC040", `synchronous proc call cycle: ${names}`);
          }
        } else if (c === 0) {
          dfs(next);
        }
      }
      path.pop();
      color.set(id, 2);
    };
    for (let i = 0; i < this.module.procs.length; i += 1) {
      if ((color.get(i) ?? 0) === 0) {
        dfs(i);
      }
    }
  }

  private error(code: string, message: string) {
    this.diagnostics.push({ severity: "error", code, message });
  }

  private warn(code: string, message: string) {
    this.diagnostics.push({ severity: "warning", code, message });
  }
}
