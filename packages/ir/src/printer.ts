// Compact, deterministic pseudo-code dump of an IRModule. Not a real target
// language — used only for tests/goldens/debugging (see docs/design/
// ir-and-transpiler.md's model section; printer.ts is not part of the doc's
// pipeline itself).
import { formatPointerTemplate } from "./pointer.js";
import type { Cont, IRExpr, IRHandler, IRModule, IRProc, IRStmt, PtrTemplate } from "./model.js";

export function printModule(module: IRModule): string {
  return new Printer(module).run();
}

class Printer {
  private readonly module: IRModule;
  private readonly lines: string[] = [];
  private indent = 0;

  constructor(module: IRModule) {
    this.module = module;
  }

  run(): string {
    this.printVariables();
    this.printEvents();
    this.printStateSlots();
    this.printHandlers();
    this.printProcs();
    return `${this.lines.join("\n")}\n`;
  }

  private push(text: string) {
    this.lines.push(`${"  ".repeat(this.indent)}${text}`);
  }

  private printVariables() {
    this.push(`variables (${this.module.variables.length}):`);
    this.indent += 1;
    for (const v of this.module.variables) {
      this.push(`${v.name}: ${v.type} = ${this.printConstData(v.initial.data)}`);
    }
    this.indent -= 1;
  }

  private printEvents() {
    this.push(`events (${this.module.events.length}):`);
    this.indent += 1;
    for (const e of this.module.events) {
      const idSuffix = e.id ? ` [id=${e.id}]` : "";
      this.push(`${e.name}${idSuffix}:`);
      this.indent += 1;
      for (const v of e.values) {
        this.push(`${v.name}: ${v.type} = ${this.printConstData(v.default.data)}`);
      }
      this.indent -= 1;
    }
    this.indent -= 1;
  }

  private printStateSlots() {
    this.push(`stateSlots (${this.module.stateSlots.length}):`);
    this.indent += 1;
    for (const s of this.module.stateSlots) {
      this.push(`${s.name}: ${s.kind} ${JSON.stringify(s.config)}`);
    }
    this.indent -= 1;
  }

  private printHandlers() {
    this.push(`handlers (${this.module.handlers.length}):`);
    this.indent += 1;
    this.module.handlers.forEach((h, i) => this.printHandler(h, i));
    this.indent -= 1;
  }

  private printHandler(h: IRHandler, index: number) {
    const configSuffix = h.config ? ` ${JSON.stringify(h.config)}` : "";
    const eventSuffix = h.eventRef !== undefined ? ` event=${this.module.events[h.eventRef]?.name ?? h.eventRef}` : "";
    const params = h.params.map((p) => `${p.name}:${p.type}`).join(", ");
    this.push(`[${index}] ${h.kind}(${params})${eventSuffix}${configSuffix} {`);
    this.indent += 1;
    this.printStmt(h.body);
    this.indent -= 1;
    this.push("}");
  }

  private printProcs() {
    this.push(`procs (${this.module.procs.length}):`);
    this.indent += 1;
    this.module.procs.forEach((p) => this.printProc(p));
    this.indent -= 1;
  }

  private printProc(p: IRProc) {
    this.push(`proc ${p.name} [${p.id}] {`);
    this.indent += 1;
    this.printStmt(p.body);
    this.indent -= 1;
    this.push("}");
  }

  private printStmt(stmt: IRStmt) {
    switch (stmt.k) {
      case "seq":
        for (const s of stmt.stmts) {
          this.printStmt(s);
        }
        return;
      case "let":
        this.push(`let ${stmt.temp}: ${stmt.type} = ${this.printExpr(stmt.expr)}`);
        return;
      case "if":
        this.push(`if (${this.printExpr(stmt.cond)}) {`);
        this.indent += 1;
        this.printStmt(stmt.then);
        this.indent -= 1;
        if (stmt.else) {
          this.push("} else {");
          this.indent += 1;
          this.printStmt(stmt.else);
          this.indent -= 1;
        }
        this.push("}");
        return;
      case "while":
        this.push(`while (${this.printExpr(stmt.cond)}) {`);
        this.indent += 1;
        this.printStmt(stmt.body);
        this.indent -= 1;
        this.push("}");
        if (stmt.completed) {
          this.push("completed {");
          this.indent += 1;
          this.printStmt(stmt.completed);
          this.indent -= 1;
          this.push("}");
        }
        return;
      case "for":
        this.push(
          `for(${stmt.slot ? this.module.stateSlots[stmt.slot.slot]?.name ?? stmt.slot.slot : "?"}: ${this.printExpr(stmt.start)} .. ${this.printExpr(stmt.end)}) {`
        );
        this.indent += 1;
        this.printStmt(stmt.body);
        this.indent -= 1;
        this.push("}");
        if (stmt.completed) {
          this.push("completed {");
          this.indent += 1;
          this.printStmt(stmt.completed);
          this.indent -= 1;
          this.push("}");
        }
        return;
      case "switch":
        this.push(`switch (${this.printExpr(stmt.selector)}) {`);
        this.indent += 1;
        for (const [c, body] of stmt.cases) {
          this.push(`case ${c}:`);
          this.indent += 1;
          this.printStmt(body);
          this.indent -= 1;
        }
        if (stmt.default) {
          this.push("default:");
          this.indent += 1;
          this.printStmt(stmt.default);
          this.indent -= 1;
        }
        this.indent -= 1;
        this.push("}");
        return;
      case "setVar":
        this.push(`setVar ${this.module.variables[stmt.varId]?.name ?? stmt.varId} = ${this.printExpr(stmt.expr)}`);
        return;
      case "setPointer":
        this.push(`setPointer ${this.printTemplateCall(stmt.template, stmt.args)} = ${this.printExpr(stmt.value)} {`);
        this.indent += 1;
        if (stmt.out) {
          this.push("out {");
          this.indent += 1;
          this.printStmt(stmt.out);
          this.indent -= 1;
          this.push("}");
        }
        if (stmt.err) {
          this.push("err {");
          this.indent += 1;
          this.printStmt(stmt.err);
          this.indent -= 1;
          this.push("}");
        }
        this.indent -= 1;
        this.push("}");
        return;
      case "emitEvent":
        this.push(`emitEvent ${this.module.events[stmt.eventId]?.name ?? stmt.eventId}(${stmt.args.map((a) => this.printExpr(a)).join(", ")})`);
        return;
      case "stopPropagation":
        this.push(`stopPropagation(${this.printExpr(stmt.stopImmediate)})`);
        return;
      case "log":
        this.push(`log(${JSON.stringify(stmt.template)}, [${stmt.args.map((a) => this.printExpr(a)).join(", ")}])`);
        return;
      case "callProc":
        this.push(`callProc ${this.module.procs[stmt.procId]?.name ?? stmt.procId}`);
        return;
      case "async":
        this.push(`async ${stmt.kind}${stmt.slot ? `[${this.module.stateSlots[stmt.slot.slot]?.name ?? stmt.slot.slot}]` : ""}(${stmt.args.map((a) => this.printExpr(a)).join(", ")}) {`);
        this.indent += 1;
        if (stmt.out) {
          this.push("out {");
          this.indent += 1;
          this.printStmt(stmt.out);
          this.indent -= 1;
          this.push("}");
        }
        if (stmt.err) {
          this.push("err {");
          this.indent += 1;
          this.printStmt(stmt.err);
          this.indent -= 1;
          this.push("}");
        }
        if (stmt.done) {
          this.push(`done: ${this.printCont(stmt.done)}`);
        }
        this.indent -= 1;
        this.push("}");
        return;
      case "stateful":
        this.push(
          `stateful ${stmt.kind}[${this.module.stateSlots[stmt.slot.slot]?.name ?? stmt.slot.slot}]#${stmt.port}(${stmt.args.map((a) => this.printExpr(a)).join(", ")}) {`
        );
        this.indent += 1;
        for (const key of Object.keys(stmt.outs).sort()) {
          this.push(`${key} {`);
          this.indent += 1;
          this.printStmt(stmt.outs[key]);
          this.indent -= 1;
          this.push("}");
        }
        this.indent -= 1;
        this.push("}");
        return;
      case "intrinsic":
        this.push(`intrinsic ${stmt.op}(${stmt.args.map((a) => this.printExpr(a)).join(", ")}) {`);
        this.indent += 1;
        for (const key of Object.keys(stmt.outs).sort()) {
          this.push(`${key} {`);
          this.indent += 1;
          this.printStmt(stmt.outs[key]);
          this.indent -= 1;
          this.push("}");
        }
        this.indent -= 1;
        this.push("}");
        return;
    }
  }

  private printCont(cont: Cont): string {
    if (cont.kind === "proc") {
      return `callProc ${this.module.procs[cont.procId]?.name ?? cont.procId}`;
    }
    // Inline continuations are usually a single statement; print compactly
    // on one line when possible, else fall back to a nested block via a
    // temporary indent snapshot.
    const before = this.lines.length;
    this.indent += 1;
    this.printStmt(cont.body);
    this.indent -= 1;
    const printed = this.lines.splice(before);
    if (printed.length === 0) {
      return "{}";
    }
    return `{\n${printed.join("\n")}\n${"  ".repeat(this.indent)}}`;
  }

  private printTemplateCall(template: PtrTemplate, args: IRExpr[]): string {
    return `${JSON.stringify(formatPointerTemplate(template))}(${args.map((a) => this.printExpr(a)).join(", ")})`;
  }

  private printExpr(expr: IRExpr): string {
    switch (expr.k) {
      case "const":
        return `${expr.type} ${this.printConstData(expr.data)}`;
      case "varGet":
        return `varGet(${this.module.variables[expr.varId]?.name ?? expr.varId})`;
      case "ptrGet":
        return `ptrGet${expr.wantIsValid ? ".isValid" : ""} ${this.printTemplateCall(expr.template, expr.args)}`;
      case "param":
        return `param(${expr.name})`;
      case "op":
        return `${expr.op}${expr.socket ? `.${expr.socket}` : ""}(${expr.args.map((a) => this.printExpr(a)).join(", ")})`;
      case "temp":
        return expr.id;
      case "stateRead":
        return `state(${this.module.stateSlots[expr.slot.slot]?.name ?? expr.slot.slot}).${expr.field}`;
      case "intrinsic":
        return `intrinsic:${expr.op}(${expr.args.map((a) => this.printExpr(a)).join(", ")})`;
    }
  }

  private printConstData(data: Array<number | boolean | string>): string {
    return JSON.stringify(data);
  }
}
