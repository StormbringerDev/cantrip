import { DiagnosticCollector } from "../diagnostic/collector.js";
import { error } from "../diagnostic/create.js";
import type {
  Assign,
  Binary,
  BlockExpr,
  Call,
  Expr,
  Fn,
  Grouping,
  If,
  Literal,
  Unary,
  Variable,
} from "../parser/expr.js";
import type {
  BlockStmt,
  Break,
  Const,
  Continue,
  Expression,
  Let,
  Return,
  Stmt,
  While,
} from "../parser/stmt.js";
import { Token } from "../parser/token.js";

const scopes: Map<string, [defined: boolean, mutable: boolean]>[] = [];
const locals = new Map<Expr, number>();
const globals = new Map<string, boolean>();
let currentLoop: LoopType = "None";
let currentFunction: FunctionType = "None";

type LoopType = "None" | "While";
type FunctionType = "None" | "Function";

export function resolve(
  statements: Stmt[],
  diagnostics: DiagnosticCollector,
): Map<Expr, number> {
  resolveStatements(statements, diagnostics);
  globals.clear();
  const resolved = new Map(locals);
  locals.clear();
  return resolved;
}

function resolveStatements(
  statements: Stmt[],
  diagnostics: DiagnosticCollector,
): void {
  for (const statement of statements) {
    resolveStmt(statement, diagnostics);
  }
}

function resolveStmt(stmt: Stmt, diagnostics: DiagnosticCollector) {
  switch (stmt.type) {
    case "BlockStmt":
      resolveBlockStmt(stmt, diagnostics);
      break;
    case "Break":
      resolveBreak(stmt, diagnostics);
      break;
    case "Const":
      resolveConst(stmt, diagnostics);
      break;
    case "Continue":
      resolveContinue(stmt, diagnostics);
      break;
    case "Expression":
      resolveExpression(stmt, diagnostics);
      break;
    case "Let":
      resolveLet(stmt, diagnostics);
      break;
    case "Return":
      resolveReturn(stmt, diagnostics);
      break;
    case "While":
      resolveWhile(stmt, diagnostics);
      break;
    default:
      stmt satisfies never;
  }
}

function resolveExpr(expr: Expr, diagnostics: DiagnosticCollector) {
  switch (expr.type) {
    case "Assign":
      resolveAssign(expr, diagnostics);
      break;
    case "Binary":
      resolveBinary(expr, diagnostics);
      break;
    case "BlockExpr":
      resolveBlockExpr(expr, diagnostics);
      break;
    case "Call":
      resolveCall(expr, diagnostics);
      break;
    case "Fn":
      resolveFn(expr, diagnostics);
      break;
    case "If":
      resolveIf(expr, diagnostics);
      break;
    case "Grouping":
      resolveGrouping(expr, diagnostics);
      break;
    case "Literal":
      resolveLiteral(expr, diagnostics);
      break;
    case "Unary":
      resolveUnary(expr, diagnostics);
      break;
    case "Variable":
      resolveVariable(expr, diagnostics);
      break;
    default:
      expr satisfies never;
  }
}

function resolveBlockStmt(
  stmt: BlockStmt,
  diagnostics: DiagnosticCollector,
): void {
  beginScope();
  resolveStatements(
    stmt.statements.filter((s) => s !== null),
    diagnostics,
  );
  endScope();
}

function resolveBreak(stmt: Break, diagnostics: DiagnosticCollector): void {
  if (currentLoop === "None") {
    diagnostics.emit(
      error("can't execute 'break' outside of a loop", stmt.keyword),
    );
  }
}

function resolveConst(stmt: Const, diagnostics: DiagnosticCollector): void {
  declareVar(stmt.name, false, diagnostics);
  resolveExpr(stmt.initializer, diagnostics);
  defineVar(stmt.name);
}

function resolveContinue(
  stmt: Continue,
  diagnostics: DiagnosticCollector,
): void {
  if (currentLoop === "None") {
    diagnostics.emit(
      error("can't execute 'continue' outside of a loop", stmt.keyword),
    );
  }
}

function resolveExpression(
  stmt: Expression,
  diagnostics: DiagnosticCollector,
): void {
  resolveExpr(stmt.expression, diagnostics);
}

function resolveLet(stmt: Let, diagnostics: DiagnosticCollector): void {
  declareVar(stmt.name, true, diagnostics);
  if (stmt.initializer !== null) {
    resolveExpr(stmt.initializer, diagnostics);
  }
  defineVar(stmt.name);
}

function resolveReturn(stmt: Return, diagnostics: DiagnosticCollector): void {
  if (currentFunction === "None") {
    diagnostics.emit(error("can't return from top-level code", stmt.keyword));
  }

  if (stmt.value !== null) {
    resolveExpr(stmt.value, diagnostics);
  }
}

function resolveWhile(stmt: While, diagnostics: DiagnosticCollector): void {
  const enclosingLoop = currentLoop;
  currentLoop = "While";

  resolveExpr(stmt.condition, diagnostics);
  resolveStmt(stmt.body, diagnostics);
  currentLoop = enclosingLoop;
}

function resolveAssign(expr: Assign, diagnostics: DiagnosticCollector): void {
  resolveMutable(expr.name, diagnostics);
  resolveExpr(expr.value, diagnostics);
  resolveLocal(expr, expr.name);
}

function resolveBinary(expr: Binary, diagnostics: DiagnosticCollector): void {
  resolveExpr(expr.left, diagnostics);
  resolveExpr(expr.right, diagnostics);
}

function resolveBlockExpr(
  expr: BlockExpr,
  diagnostics: DiagnosticCollector,
): void {
  beginScope();
  resolveStatements(
    expr.statements.filter((s) => s !== null),
    diagnostics,
  );
  if (expr.value !== null) {
    resolveExpr(expr.value, diagnostics);
  }
  endScope();
}

function resolveCall(expr: Call, diagnostics: DiagnosticCollector): void {
  resolveExpr(expr.callee, diagnostics);

  for (const arg of expr.args) {
    resolveExpr(arg, diagnostics);
  }
}

function resolveFn(expr: Fn, diagnostics: DiagnosticCollector): void {
  const enclosingFunction = currentFunction;
  currentFunction = "Function";
  const enclosingLoop = currentLoop;
  currentLoop = "None";

  beginScope();
  for (const param of expr.params) {
    declareVar(param, true, diagnostics);
    defineVar(param);
  }
  resolveExpr(expr.body, diagnostics);
  endScope();
  currentFunction = enclosingFunction;
  currentLoop = enclosingLoop;
}

function resolveGrouping(
  expr: Grouping,
  diagnostics: DiagnosticCollector,
): void {
  resolveExpr(expr.expression, diagnostics);
}

function resolveIf(expr: If, diagnostics: DiagnosticCollector): void {
  resolveExpr(expr.condition, diagnostics);
  resolveExpr(expr.thenBranch, diagnostics);
  if (expr.elseBranch !== null) resolveExpr(expr.elseBranch, diagnostics);
}

function resolveLiteral(
  _expr: Literal,
  _diagnostics: DiagnosticCollector,
): void {
  return;
}

function resolveUnary(expr: Unary, diagnostics: DiagnosticCollector): void {
  resolveExpr(expr.right, diagnostics);
}

function resolveVariable(
  expr: Variable,
  diagnostics: DiagnosticCollector,
): void {
  if (
    scopes.length !== 0 &&
    scopes.at(-1)?.get(expr.name.lexeme)?.[0] === false
  ) {
    diagnostics.emit(
      error("can't read local variable in its own initializer", expr.name),
    );
  }

  resolveLocal(expr, expr.name);
}

function beginScope(): void {
  scopes.push(new Map());
}

function endScope(): void {
  scopes.pop();
}

function declareVar(
  name: Token,
  mutable: boolean,
  diagnostics: DiagnosticCollector,
): void {
  if (scopes.length === 0) {
    globals.set(name.lexeme, mutable);
    return;
  }

  const scope = scopes.at(-1)!;
  if (scope.has(name.lexeme)) {
    diagnostics.emit(
      error("already a variable with this name in this scope", name),
    );
  }

  scope.set(name.lexeme, [false, mutable]);
}

function defineVar(name: Token): void {
  if (scopes.length === 0) return;

  const scope = scopes.at(-1)!;
  const mutable = scope.get(name.lexeme)?.[1] ?? true;
  scope.set(name.lexeme, [true, mutable]);
}

function resolveLocal(expr: Expr, name: Token): void {
  for (let i = scopes.length - 1; i >= 0; i--) {
    if (scopes[i].has(name.lexeme)) {
      locals.set(expr, scopes.length - 1 - i);
      return;
    }
  }
}

function resolveMutable(name: Token, diagnostics: DiagnosticCollector): void {
  for (let i = scopes.length - 1; i >= 0; i--) {
    if (scopes[i].has(name.lexeme) && !scopes[i].get(name.lexeme)?.[1]) {
      diagnostics.emit(
        error("can't assign to variables declared with 'const'", name),
      );
      return;
    }
  }

  if (globals.has(name.lexeme)) {
    if (!globals.get(name.lexeme)) {
      diagnostics.emit(
        error("can't assign to variables declared with 'const'", name),
      );
    }
    return;
  }
}
