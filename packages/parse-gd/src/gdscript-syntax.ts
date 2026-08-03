// Hand-rolled, indentation-aware tokenizer + recursive-descent parser for
// the EMITTED GDSCRIPT SUBSET ONLY — see this package's src/index.ts header
// for why: Godot 4.3 exposes no public GDScript AST API (unlike
// runtime-py's/runtime-cs's harness-exposed `ast.parse`/Roslyn tree, which
// @gltfi/parse-py/@gltfi/parse-cs reuse verbatim), so there is no "spawn the
// language's own parser" trick available here the way every sibling parser
// package uses. A brief evaluation of `tree-sitter-gdscript` (an npm
// package, but a NATIVE Node addon requiring `node-gyp-build` — not the
// zero-native-deps `web-tree-sitter` WASM binding — single-maintainer,
// last published independent of this project, general-purpose GDScript
// grammar far broader than the tiny subset this parser actually needs)
// raised enough doubt (native-build risk in a sandboxed CI-like
// environment, a whole new dependency class no other package in this repo
// carries, and grammar coverage aimed at hand-written GDScript rather than
// this emitter's own narrow, fully-controlled output shape) that the task's
// own designed fallback applies: a small, deterministic, zero-dependency
// parser over EXACTLY the constructs `@gltfi/emit-gd`'s `emit.ts` can
// produce.
//
// This is two layers, mirroring every sibling parser's own "generic tree
// then IR-lowering pass" split (parse-py's harness.py AST / parse-lua's
// luaparse AST / parse-cs's Roslyn tree): this file is the GENERIC layer —
// a tokenizer (Python-style INDENT/DEDENT tracking, since GDScript's block
// structure is significant-whitespace just like Python's) and a Pratt-style
// expression parser + statement parser producing a small untyped `GExpr`/
// `GStmt` tree with NO knowledge of KHR_interactivity/IR semantics at all
// (that lowering lives in ./index.ts's `ModuleParser`, exactly mirroring
// parse-py's `ModuleParser` walking Python's `ast` tree). Kept generic
// (rather than fusing tokenizing/parsing/lowering into one pass) so this
// layer stays testable/reasoned-about in isolation, same rationale as
// keeping parse-cs's `ast-helpers.ts` a separate file from its own
// `ModuleParser`.
//
// Deliberately NOT a general GDScript grammar: every emitted statement is
// always exactly ONE physical line (`Emitter.push` never wraps), so this
// tokenizer needs no logical-line-continuation/backslash handling the way a
// real GDScript tokenizer would (bracket-depth newline-suppression is still
// implemented below, cheaply, as defense-in-depth — see `Lexer.tokenize`).
// Indentation is always a fixed 4 spaces per level (`Emitter.push`'s own
// `"    ".repeat(this.indent)`), never tabs — enforced, not merely assumed,
// by `Lexer`'s own indent-width bookkeeping (any other width still parses,
// same as Python's own tokenizer, since a comparison against the indent
// stack's own accumulated string is what actually gates INDENT/DEDENT, not
// a hardcoded "4").

export type GExpr =
  | { t: "num"; raw: string; isFloat: boolean; value: number }
  | { t: "str"; value: string }
  | { t: "bool"; value: boolean }
  | { t: "ident"; name: string }
  | { t: "attr"; base: GExpr; name: string }
  | { t: "index"; base: GExpr; index: GExpr }
  | { t: "call"; callee: GExpr; args: GExpr[] }
  | { t: "array"; items: GExpr[] }
  | { t: "dict"; entries: Array<{ key: string; value: GExpr }> }
  | { t: "unary"; op: "-" | "not"; operand: GExpr }
  | { t: "binary"; op: string; left: GExpr; right: GExpr }
  | { t: "ternary"; cond: GExpr; then: GExpr; else: GExpr };

// `line` (the 1-based source line the statement starts on) rides along on
// every variant purely for diagnostic messages — GG1xx codes in ./index.ts
// report it the same way parse-py's `fail()` reports a Python `lineno`.
export type GStmt = (
  | { t: "pass" }
  | { t: "exprStmt"; expr: GExpr }
  | { t: "varLocal"; name: string; init: GExpr }
  | { t: "classVar"; name: string }
  | { t: "extends"; name: string }
  | { t: "assign"; target: GExpr; value: GExpr }
  | { t: "if"; cond: GExpr; then: GStmt[]; elifs: Array<{ cond: GExpr; body: GStmt[] }>; else?: GStmt[] }
  | { t: "while"; cond: GExpr; body: GStmt[] }
  | { t: "funcDef"; name: string; params: Array<{ name: string; type: string }>; body: GStmt[] }
) & { line: number };

export class GdSyntaxError extends Error {
  readonly line: number;
  constructor(message: string, line: number) {
    super(`${message} at line ${line}`);
    this.line = line;
  }
}

// ---------------------------------------------------------------------------
// Lexer
// ---------------------------------------------------------------------------

type TokKind =
  | "ident"
  | "num"
  | "str"
  | "newline"
  | "indent"
  | "dedent"
  | "eof"
  | "punct";

type Token = { kind: TokKind; text: string; line: number };

const PUNCT2 = ["->", "==", "!=", "<=", ">="];
const PUNCT1 = [":", ",", ".", "(", ")", "[", "]", "{", "}", "=", "+", "-", "*", "/", "<", ">"];

class Lexer {
  private readonly src: string;
  private pos = 0;
  private line = 1;
  private readonly indentStack: number[] = [0];
  private atLineStart = true;
  private bracketDepth = 0;
  readonly tokens: Token[] = [];

  constructor(src: string) {
    this.src = src;
  }

  private peekCh(offset = 0): string {
    return this.src[this.pos + offset] ?? "";
  }

  private push(kind: TokKind, text: string) {
    this.tokens.push({ kind, text, line: this.line });
  }

  tokenize(): Token[] {
    while (this.pos < this.src.length) {
      if (this.atLineStart && this.bracketDepth === 0) {
        this.handleLineStart();
        if (this.pos >= this.src.length) {
          break;
        }
      }
      const ch = this.peekCh();
      if (ch === "\n") {
        this.pos += 1;
        this.line += 1;
        if (this.bracketDepth === 0) {
          // Suppress a NEWLINE token for a line that produced no other
          // tokens yet (a blank/comment-only physical line — see this
          // file's header on why multi-line logical statements never
          // occur in emitted code, so bracketDepth>0 across a physical
          // newline is only defensive, never actually exercised).
          const last = this.tokens[this.tokens.length - 1];
          if (last && last.kind !== "newline" && last.kind !== "indent" && last.kind !== "dedent") {
            this.push("newline", "\n");
          }
          this.atLineStart = true;
        }
        continue;
      }
      if (ch === " " || ch === "\t" || ch === "\r") {
        this.pos += 1;
        continue;
      }
      if (ch === "#") {
        while (this.pos < this.src.length && this.peekCh() !== "\n") {
          this.pos += 1;
        }
        continue;
      }
      if (ch === '"') {
        this.readString();
        continue;
      }
      if (/[0-9]/.test(ch)) {
        this.readNumber();
        continue;
      }
      if (/[A-Za-z_]/.test(ch)) {
        this.readIdent();
        continue;
      }
      this.readPunct();
    }
    // EOF: close out any open logical line, then unwind remaining indent.
    const last = this.tokens[this.tokens.length - 1];
    if (last && last.kind !== "newline" && last.kind !== "indent" && last.kind !== "dedent") {
      this.push("newline", "\n");
    }
    while (this.indentStack.length > 1) {
      this.indentStack.pop();
      this.push("dedent", "");
    }
    this.push("eof", "");
    return this.tokens;
  }

  // Measures leading whitespace of the upcoming physical line and emits
  // INDENT/DEDENT tokens against the indent stack (mirrors Python's own
  // tokenizer algorithm exactly). Blank lines and comment-only lines are
  // skipped entirely (no INDENT/DEDENT/NEWLINE at all) — the same
  // convention Python's tokenizer uses, needed here since emit.ts inserts
  // a genuinely empty line between every top-level func.
  private handleLineStart() {
    for (;;) {
      let width = 0;
      while (this.peekCh() === " ") {
        width += 1;
        this.pos += 1;
      }
      const ch = this.peekCh();
      if (ch === "\n") {
        this.pos += 1;
        this.line += 1;
        continue; // blank line — re-measure the next one
      }
      if (ch === "#") {
        while (this.pos < this.src.length && this.peekCh() !== "\n") {
          this.pos += 1;
        }
        continue; // comment-only line
      }
      if (ch === "") {
        return; // EOF right after trailing whitespace/blank lines
      }
      const top = this.indentStack[this.indentStack.length - 1];
      if (width > top) {
        this.indentStack.push(width);
        this.push("indent", "");
      } else if (width < top) {
        while (this.indentStack.length > 1 && this.indentStack[this.indentStack.length - 1] > width) {
          this.indentStack.pop();
          this.push("dedent", "");
        }
        if (this.indentStack[this.indentStack.length - 1] !== width) {
          throw new GdSyntaxError(`inconsistent indentation (got ${width} spaces, no matching level)`, this.line);
        }
      }
      this.atLineStart = false;
      return;
    }
  }

  private readString() {
    const startLine = this.line;
    this.pos += 1; // opening quote
    let out = "";
    for (;;) {
      const ch = this.peekCh();
      if (ch === "") {
        throw new GdSyntaxError("unterminated string literal", startLine);
      }
      if (ch === '"') {
        this.pos += 1;
        break;
      }
      if (ch === "\\") {
        const esc = this.peekCh(1);
        if (esc === "n") {
          out += "\n";
          this.pos += 2;
        } else if (esc === "r") {
          out += "\r";
          this.pos += 2;
        } else if (esc === "t") {
          out += "\t";
          this.pos += 2;
        } else if (esc === '"') {
          out += '"';
          this.pos += 2;
        } else if (esc === "\\") {
          out += "\\";
          this.pos += 2;
        } else if (esc === "u") {
          const hex = this.src.slice(this.pos + 2, this.pos + 6);
          out += String.fromCodePoint(parseInt(hex, 16));
          this.pos += 6;
        } else {
          // Unknown escape — pass the escaped char through literally
          // rather than failing; `gdStringLiteral` never emits any other
          // escape form, so this branch is purely defensive.
          out += esc;
          this.pos += 2;
        }
        continue;
      }
      if (ch === "\n") {
        this.line += 1;
      }
      out += ch;
      this.pos += 1;
    }
    this.tokens.push({ kind: "str", text: out, line: startLine });
  }

  private readNumber() {
    const start = this.pos;
    while (/[0-9]/.test(this.peekCh())) this.pos += 1;
    if (this.peekCh() === "." && /[0-9]/.test(this.peekCh(1))) {
      this.pos += 1;
      while (/[0-9]/.test(this.peekCh())) this.pos += 1;
    }
    if (this.peekCh() === "e" || this.peekCh() === "E") {
      const save = this.pos;
      this.pos += 1;
      if (this.peekCh() === "+" || this.peekCh() === "-") this.pos += 1;
      if (/[0-9]/.test(this.peekCh())) {
        while (/[0-9]/.test(this.peekCh())) this.pos += 1;
      } else {
        this.pos = save; // not actually an exponent — back off
      }
    }
    this.push("num", this.src.slice(start, this.pos));
  }

  private readIdent() {
    const start = this.pos;
    while (/[A-Za-z0-9_]/.test(this.peekCh())) this.pos += 1;
    this.push("ident", this.src.slice(start, this.pos));
  }

  private readPunct() {
    const two = this.src.slice(this.pos, this.pos + 2);
    if (PUNCT2.includes(two)) {
      this.push("punct", two);
      this.pos += 2;
      return;
    }
    const one = this.peekCh();
    if (PUNCT1.includes(one)) {
      if (one === "(" || one === "[" || one === "{") this.bracketDepth += 1;
      if (one === ")" || one === "]" || one === "}") this.bracketDepth = Math.max(0, this.bracketDepth - 1);
      this.push("punct", one);
      this.pos += 1;
      return;
    }
    throw new GdSyntaxError(`unexpected character ${JSON.stringify(one)}`, this.line);
  }
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

class Parser {
  private readonly toks: Token[];
  private i = 0;

  constructor(toks: Token[]) {
    this.toks = toks;
  }

  private peek(offset = 0): Token {
    return this.toks[Math.min(this.i + offset, this.toks.length - 1)];
  }

  private at(kind: TokKind, text?: string): boolean {
    const t = this.peek();
    return t.kind === kind && (text === undefined || t.text === text);
  }

  private atIdent(name: string): boolean {
    return this.at("ident", name);
  }

  private advance(): Token {
    const t = this.toks[this.i];
    if (this.i < this.toks.length - 1) this.i += 1;
    return t;
  }

  private expect(kind: TokKind, text?: string): Token {
    if (!this.at(kind, text)) {
      const t = this.peek();
      throw new GdSyntaxError(`expected ${kind}${text ? ` "${text}"` : ""} but got ${t.kind} "${t.text}"`, t.line);
    }
    return this.advance();
  }

  parseProgram(): GStmt[] {
    const out: GStmt[] = [];
    while (!this.at("eof")) {
      out.push(this.parseStatement());
    }
    return out;
  }

  private parseBlock(): GStmt[] {
    this.expect("indent");
    const out: GStmt[] = [];
    while (!this.at("dedent") && !this.at("eof")) {
      out.push(this.parseStatement());
    }
    this.expect("dedent");
    return out;
  }

  private parseStatement(): GStmt {
    const line = this.peek().line;
    if (this.atIdent("extends")) {
      this.advance();
      const name = this.expect("ident").text;
      this.expect("newline");
      return { t: "extends", name, line };
    }
    if (this.atIdent("pass")) {
      this.advance();
      this.expect("newline");
      return { t: "pass", line };
    }
    if (this.atIdent("var")) {
      this.advance();
      const name = this.expect("ident").text;
      if (this.at("punct", "=")) {
        this.advance();
        const init = this.parseExpr();
        this.expect("newline");
        return { t: "varLocal", name, init, line };
      }
      this.expect("newline");
      return { t: "classVar", name, line };
    }
    if (this.atIdent("if")) {
      return this.parseIf(line);
    }
    if (this.atIdent("while")) {
      this.advance();
      const cond = this.parseExpr();
      this.expect("punct", ":");
      this.expect("newline");
      const body = this.parseBlock();
      return { t: "while", cond, body, line };
    }
    if (this.atIdent("func")) {
      return this.parseFuncDef(line);
    }
    // Expression statement or assignment: parse a full expression first,
    // then check for a trailing `= <expr>`.
    const expr = this.parseExpr();
    if (this.at("punct", "=")) {
      this.advance();
      const value = this.parseExpr();
      this.expect("newline");
      return { t: "assign", target: expr, value, line };
    }
    this.expect("newline");
    return { t: "exprStmt", expr, line };
  }

  private parseIf(line: number): GStmt {
    this.advance(); // "if"
    const cond = this.parseExpr();
    this.expect("punct", ":");
    this.expect("newline");
    const then = this.parseBlock();
    const elifs: Array<{ cond: GExpr; body: GStmt[] }> = [];
    while (this.atIdent("elif")) {
      this.advance();
      const econd = this.parseExpr();
      this.expect("punct", ":");
      this.expect("newline");
      const ebody = this.parseBlock();
      elifs.push({ cond: econd, body: ebody });
    }
    let elseBody: GStmt[] | undefined;
    if (this.atIdent("else")) {
      this.advance();
      this.expect("punct", ":");
      this.expect("newline");
      elseBody = this.parseBlock();
    }
    return { t: "if", cond, then, elifs, else: elseBody, line };
  }

  private parseFuncDef(line: number): GStmt {
    this.advance(); // "func"
    const name = this.expect("ident").text;
    this.expect("punct", "(");
    // A parameter's `: type` annotation is OPTIONAL — every handler-body
    // param (`time_since_start: float`, `payload: Array`) has one, but
    // `build`'s own sole parameter (`_rt`) is untyped (`type` is `""` for
    // it — see this file's own header note on why every emitted statement
    // is one physical line: `build(_rt)`, no annotation, matches
    // `emit.ts`'s literal `"func build(_rt) -> void:"` push).
    const params: Array<{ name: string; type: string }> = [];
    while (!this.at("punct", ")")) {
      const pname = this.expect("ident").text;
      let ptype = "";
      if (this.at("punct", ":")) {
        this.advance();
        ptype = this.expect("ident").text;
      }
      params.push({ name: pname, type: ptype });
      if (this.at("punct", ",")) {
        this.advance();
      }
    }
    this.expect("punct", ")");
    this.expect("punct", "->");
    // Always "void" in emitted code — accepted as a bare identifier rather
    // than a dedicated keyword check so a hypothetical future non-void
    // return type still parses (and is simply ignored) rather than hard
    // erroring on this exact spelling.
    this.expect("ident");
    this.expect("punct", ":");
    this.expect("newline");
    const body = this.parseBlock();
    return { t: "funcDef", name, params, body, line };
  }

  // -----------------------------------------------------------------------
  // Expressions — precedence (low to high): ternary < or < and < not <
  // comparison < additive < multiplicative < unary-minus < postfix < atom.
  // Mirrors GDScript's own precedence table for exactly the operator subset
  // emit-gd ever emits (see emit.ts's own PREC_* constants).
  // -----------------------------------------------------------------------

  parseExpr(): GExpr {
    return this.parseTernary();
  }

  private parseTernary(): GExpr {
    const left = this.parseOr();
    if (this.atIdent("if")) {
      this.advance();
      const cond = this.parseOr();
      if (!this.atIdent("else")) {
        throw new GdSyntaxError(`expected "else" in conditional expression`, this.peek().line);
      }
      this.advance();
      const elseExpr = this.parseTernary();
      return { t: "ternary", cond, then: left, else: elseExpr };
    }
    return left;
  }

  private parseOr(): GExpr {
    let left = this.parseAnd();
    while (this.atIdent("or")) {
      this.advance();
      const right = this.parseAnd();
      left = { t: "binary", op: "or", left, right };
    }
    return left;
  }

  private parseAnd(): GExpr {
    let left = this.parseNot();
    while (this.atIdent("and")) {
      this.advance();
      const right = this.parseNot();
      left = { t: "binary", op: "and", left, right };
    }
    return left;
  }

  private parseNot(): GExpr {
    if (this.atIdent("not")) {
      this.advance();
      const operand = this.parseNot();
      return { t: "unary", op: "not", operand };
    }
    return this.parseComparison();
  }

  private parseComparison(): GExpr {
    const left = this.parseAdditive();
    const t = this.peek();
    const cmpOps = ["==", "!=", "<", "<=", ">", ">="];
    if (t.kind === "punct" && cmpOps.includes(t.text)) {
      this.advance();
      const right = this.parseAdditive();
      return { t: "binary", op: t.text, left, right };
    }
    return left;
  }

  private parseAdditive(): GExpr {
    let left = this.parseMultiplicative();
    for (;;) {
      const t = this.peek();
      if (t.kind === "punct" && (t.text === "+" || t.text === "-")) {
        this.advance();
        const right = this.parseMultiplicative();
        left = { t: "binary", op: t.text, left, right };
      } else {
        break;
      }
    }
    return left;
  }

  private parseMultiplicative(): GExpr {
    let left = this.parseUnary();
    for (;;) {
      const t = this.peek();
      if (t.kind === "punct" && (t.text === "*" || t.text === "/")) {
        this.advance();
        const right = this.parseUnary();
        left = { t: "binary", op: t.text, left, right };
      } else {
        break;
      }
    }
    return left;
  }

  // Folds a leading `-` directly into an immediately-following numeric atom
  // (`-5`, `-5.0`, `-INF`) into a single signed literal rather than an
  // `unary` node — matches how `constLiteral`/`gdFloatLiteral`/
  // `gdIntLiteral` always bake a literal's sign into its own printed text
  // (never via a wrapping `math/neg` op node — see emit.ts's own
  // `emitNativeOp`, which only ever wraps a DYNAMIC operand). A `-` whose
  // operand ISN'T itself literal-shaped (e.g. `-t1`, or the `- -x` double-
  // negation emit.ts prints for a negative-valued dynamic operand — see
  // that function's own token-merge-avoidance note) still produces a
  // genuine `unary` node, recursively, exactly the source's own nesting.
  private parseUnary(): GExpr {
    if (this.at("punct", "-")) {
      this.advance();
      const operand = this.parseUnary();
      if (operand.t === "num") {
        return { t: "num", raw: `-${operand.raw}`, isFloat: operand.isFloat, value: -operand.value };
      }
      return { t: "unary", op: "-", operand };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): GExpr {
    let base = this.parseAtom();
    for (;;) {
      if (this.at("punct", ".")) {
        this.advance();
        const name = this.expect("ident").text;
        base = { t: "attr", base, name };
      } else if (this.at("punct", "[")) {
        this.advance();
        const index = this.parseExpr();
        this.expect("punct", "]");
        base = { t: "index", base, index };
      } else if (this.at("punct", "(")) {
        this.advance();
        const args: GExpr[] = [];
        while (!this.at("punct", ")")) {
          args.push(this.parseExpr());
          if (this.at("punct", ",")) {
            this.advance();
          }
        }
        this.expect("punct", ")");
        base = { t: "call", callee: base, args };
      } else {
        break;
      }
    }
    return base;
  }

  private parseAtom(): GExpr {
    const t = this.peek();
    if (t.kind === "num") {
      this.advance();
      const isFloat = /[.eE]/.test(t.text);
      return { t: "num", raw: t.text, isFloat, value: Number(t.text) };
    }
    if (t.kind === "str") {
      this.advance();
      return { t: "str", value: t.text };
    }
    if (t.kind === "ident") {
      if (t.text === "true" || t.text === "false") {
        this.advance();
        return { t: "bool", value: t.text === "true" };
      }
      if (t.text === "NAN") {
        this.advance();
        return { t: "num", raw: "NAN", isFloat: true, value: NaN };
      }
      if (t.text === "INF") {
        this.advance();
        return { t: "num", raw: "INF", isFloat: true, value: Infinity };
      }
      this.advance();
      return { t: "ident", name: t.text };
    }
    if (t.kind === "punct" && t.text === "(") {
      this.advance();
      const inner = this.parseExpr();
      this.expect("punct", ")");
      return inner;
    }
    if (t.kind === "punct" && t.text === "[") {
      this.advance();
      const items: GExpr[] = [];
      while (!this.at("punct", "]")) {
        items.push(this.parseExpr());
        if (this.at("punct", ",")) {
          this.advance();
        }
      }
      this.expect("punct", "]");
      return { t: "array", items };
    }
    if (t.kind === "punct" && t.text === "{") {
      this.advance();
      const entries: Array<{ key: string; value: GExpr }> = [];
      while (!this.at("punct", "}")) {
        const keyTok = this.expect("str");
        this.expect("punct", ":");
        const value = this.parseExpr();
        entries.push({ key: keyTok.text, value });
        if (this.at("punct", ",")) {
          this.advance();
        }
      }
      this.expect("punct", "}");
      return { t: "dict", entries };
    }
    throw new GdSyntaxError(`unexpected token ${t.kind} "${t.text}" in expression`, t.line);
  }
}

export function parseGdScript(source: string): GStmt[] {
  const toks = new Lexer(source).tokenize();
  return new Parser(toks).parseProgram();
}
