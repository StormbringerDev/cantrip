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
import { TokenType, type Token } from "../parser/token.js";
import { Environment } from "./environment.js";
import {
  BreakException,
  ContinueException,
  ReturnException,
  RuntimeError,
} from "./exceptions.js";
import {
  CantripFunction,
  stringify,
  UNIT,
  type Value,
} from "./runtime-types.js";
import * as stdlib from "./stdlib.js";

export function interpret(
  statements: Stmt[],
  locals: Map<Expr, number>,
  diagnostics: DiagnosticCollector,
): void {
  try {
    for (const statement of statements) {
      execute(statement, locals);
    }
  } catch (caught) {
    if (!(caught instanceof RuntimeError)) throw caught;
    diagnostics.emit(error(caught.message, caught.token));
  }
}

const globals = new Environment();
let environment = globals;

globals.define("print", stdlib.printNative);
globals.define("time", stdlib.timeNative);

function execute(stmt: Stmt, locals: Map<Expr, number>): void {
  switch (stmt.type) {
    case "BlockStmt":
      executeBlockStmt(stmt, locals);
      break;
    case "Break":
      executeBreak(stmt, locals);
      break;
    case "Const":
      executeConst(stmt, locals);
      break;
    case "Continue":
      executeContinue(stmt, locals);
      break;
    case "Expression":
      executeExpression(stmt, locals);
      break;
    case "Let":
      executeLet(stmt, locals);
      break;
    case "Return":
      executeReturn(stmt, locals);
      break;
    case "While":
      executeWhile(stmt, locals);
      break;
    default:
      stmt satisfies never;
  }
}

function evaluate(expr: Expr, locals: Map<Expr, number>): Value {
  switch (expr.type) {
    case "Assign":
      return evaluateAssign(expr, locals);
    case "Binary":
      return evaluateBinary(expr, locals);
    case "BlockExpr":
      return evaluateBlockExpr(expr, locals);
    case "Call":
      return evaluateCall(expr, locals);
    case "Fn":
      return evaluateFn(expr, locals);
    case "If":
      return evaluateIf(expr, locals);
    case "Grouping":
      return evaluateGrouping(expr, locals);
    case "Literal":
      return evaluateLiteral(expr, locals);
    case "Unary":
      return evaluateUnary(expr, locals);
    case "Variable":
      return evaluateVariable(expr, locals);
    default:
      expr satisfies never;
  }

  // Unreachable.
  return UNIT;
}

function executeBlockStmt(stmt: BlockStmt, locals: Map<Expr, number>): void {
  const previous = environment;
  try {
    environment = new Environment(previous);

    for (const statement of stmt.statements.filter((s) => s !== null))
      execute(statement, locals);
  } finally {
    environment = previous;
  }
}

function executeBreak(_stmt: Break, _locals: Map<Expr, number>): void {
  throw new BreakException();
}

function executeConst(stmt: Const, locals: Map<Expr, number>): void {
  environment.define(stmt.name.lexeme, evaluate(stmt.initializer, locals));
}

function executeContinue(_stmt: Continue, _locals: Map<Expr, number>): void {
  throw new ContinueException();
}

function executeExpression(stmt: Expression, locals: Map<Expr, number>): void {
  evaluate(stmt.expression, locals);
}

function executeLet(stmt: Let, locals: Map<Expr, number>): void {
  let value: Value = UNIT;
  if (stmt.initializer != null) {
    value = evaluate(stmt.initializer, locals);
  }

  environment.define(stmt.name.lexeme, value);
}

function executeReturn(stmt: Return, locals: Map<Expr, number>): void {
  let value: Value = UNIT;
  if (stmt.value != null) value = evaluate(stmt.value, locals);

  throw new ReturnException(value);
}

function executeWhile(stmt: While, locals: Map<Expr, number>): void {
  while (isTruthy(evaluate(stmt.condition, locals))) {
    try {
      execute(stmt.body, locals);
    } catch (err) {
      if (err instanceof BreakException) break;
      else if (err instanceof ContinueException) continue;
      else throw err;
    }
  }
}

function evaluateAssign(expr: Assign, locals: Map<Expr, number>): Value {
  const value = evaluate(expr.value, locals);

  const distance = locals.get(expr);
  if (distance !== undefined) {
    environment.assignAt(distance, expr.name, value);
  } else {
    globals.assign(expr.name, value);
  }

  return value;
}

function evaluateBinary(expr: Binary, locals: Map<Expr, number>): Value {
  const left = evaluate(expr.left, locals);

  if (expr.operator.type === TokenType.Or) {
    return isTruthy(left) ? left : evaluate(expr.right, locals);
  } else if (expr.operator.type === TokenType.And) {
    return !isTruthy(left) ? left : evaluate(expr.right, locals);
  }

  const right = evaluate(expr.right, locals);

  switch (expr.operator.type) {
    case TokenType.BangEq:
      return left !== right;
    case TokenType.EqEq:
      return left === right;
    case TokenType.Greater:
      checkNumberOperands(expr.operator, left, right);
      return (left as number) > (right as number);
    case TokenType.GreaterEq:
      checkNumberOperands(expr.operator, left, right);
      return (left as number) >= (right as number);
    case TokenType.Less:
      checkNumberOperands(expr.operator, left, right);
      return (left as number) < (right as number);
    case TokenType.LessEq:
      checkNumberOperands(expr.operator, left, right);
      return (left as number) <= (right as number);
    case TokenType.Plus:
      if (typeof left === "string" || typeof right === "string") {
        return stringify(left) + stringify(right);
      }

      if (typeof left === "number" && typeof right === "number") {
        return left + right;
      }

      throw new RuntimeError(
        expr.operator,
        "operands must be two numbers or at least one string",
      );
    case TokenType.Minus:
      checkNumberOperands(expr.operator, left, right);
      return (left as number) - (right as number);
    case TokenType.Star:
      checkNumberOperands(expr.operator, left, right);
      return (left as number) * (right as number);
    case TokenType.Slash:
      checkNumberOperands(expr.operator, left, right);
      return (left as number) / (right as number);
    case TokenType.Percent:
      checkNumberOperands(expr.operator, left, right);
      return (left as number) % (right as number);
  }

  // Unreachable
  return UNIT;
}

function evaluateBlockExpr(expr: BlockExpr, locals: Map<Expr, number>): Value {
  const previous = environment;
  let value: Value = UNIT;
  try {
    environment = new Environment(previous);

    for (const statement of expr.statements.filter((s) => s !== null)) {
      execute(statement, locals);
    }
  } finally {
    if (expr.value !== null) value = evaluate(expr.value, locals);
    environment = previous;
  }
  return value;
}

function evaluateCall(expr: Call, locals: Map<Expr, number>): Value {
  const callee = evaluate(expr.callee, locals);

  const args: Value[] = [];
  for (const argument of expr.args) {
    args.push(evaluate(argument, locals));
  }

  if (
    callee === null ||
    callee === UNIT ||
    typeof callee === "number" ||
    typeof callee === "string" ||
    typeof callee === "boolean"
  ) {
    throw new RuntimeError(expr.paren, "can only call functions");
  }

  const func = callee;
  if (args.length != func.arity) {
    throw new RuntimeError(
      expr.paren,
      `expected ${func.arity} arguments, got ${args.length}`,
    );
  }

  return func.call(args);
}

function evaluateFn(expr: Fn, locals: Map<Expr, number>): Value {
  const func: CantripFunction = {
    arity: expr.params.length,
    call: (args) => {
      const env = new Environment(environment);
      for (let i = 0; i < expr.params.length; i++) {
        env.define(expr.params[i].lexeme, args[i]);
      }

      try {
        return evaluate(expr.body, locals);
      } catch (err) {
        if (err instanceof ReturnException) return err.value;
        throw err;
      }
    },
    toString: () => "<fn>",
  };
  return func;
}

function evaluateIf(expr: If, locals: Map<Expr, number>): Value {
  if (isTruthy(evaluate(expr.condition, locals))) {
    return evaluate(expr.thenBranch, locals);
  } else if (expr.elseBranch !== null) {
    return evaluate(expr.elseBranch, locals);
  }
  return UNIT;
}

function evaluateGrouping(expr: Grouping, locals: Map<Expr, number>): Value {
  return evaluate(expr.expression, locals);
}

function evaluateLiteral(expr: Literal, _locals: Map<Expr, number>): Value {
  return expr.value;
}

function evaluateUnary(expr: Unary, locals: Map<Expr, number>): Value {
  const right = evaluate(expr.right, locals);

  switch (expr.operator.type) {
    case TokenType.Minus:
      checkNumberOperand(expr.operator, right);
      return -(right as number);
    case TokenType.Bang:
      return !isTruthy(right);
    default:
      return UNIT; // Unreachable
  }
}

function evaluateVariable(expr: Variable, locals: Map<Expr, number>): Value {
  return lookUpVariable(expr.name, expr, locals);
}

function lookUpVariable(
  name: Token,
  expr: Expr,
  locals: Map<Expr, number>,
): Value {
  const distance = locals.get(expr);
  if (distance !== undefined) {
    return environment.getAt(distance, name.lexeme);
  } else {
    return globals.get(name);
  }
}

function isTruthy(value: Value): boolean {
  if (value === null || value === UNIT) return false;
  if (typeof value === "boolean") return value;
  if (value === 0 || value === "") return false;
  return true;
}

function checkNumberOperand(operator: Token, operand: Value) {
  if (typeof operand === "number") return;
  throw new RuntimeError(operator, "operand must be a number");
}

function checkNumberOperands(operator: Token, left: Value, right: Value) {
  if (typeof left === "number" && typeof right === "number") return;
  throw new RuntimeError(operator, "operands must be numbers");
}
