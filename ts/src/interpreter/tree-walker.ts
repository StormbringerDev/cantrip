import { DiagnosticCollector } from "../diagnostic/collector.js";
import { error } from "../diagnostic/create.js";
import type {
  Assign,
  Binary,
  BlockExpr,
  Call,
  Expr,
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
  Stmt,
  While,
} from "../parser/stmt.js";
import { TokenType, type Token } from "../parser/token.js";
import { Environment } from "./environment.js";
import {
  BreakException,
  ContinueException,
  RuntimeError,
} from "./exceptions.js";
import { stringify, UNIT, type Value } from "./runtime-types.js";
import * as stdlib from "./stdlib.js";

export function interpret(
  statements: Stmt[],
  diagnostics: DiagnosticCollector,
): void {
  try {
    for (const statement of statements) {
      execute(statement);
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

function execute(stmt: Stmt): void {
  switch (stmt.type) {
    case "BlockStmt":
      executeBlockStmt(stmt);
      break;
    case "Break":
      executeBreak(stmt);
      break;
    case "Const":
      executeConst(stmt);
      break;
    case "Continue":
      executeContinue(stmt);
      break;
    case "Expression":
      executeExpression(stmt);
      break;
    case "Let":
      executeLet(stmt);
      break;
    case "While":
      executeWhile(stmt);
      break;
    default:
      stmt satisfies never;
  }
}

function evaluate(expr: Expr): Value {
  switch (expr.type) {
    case "Assign":
      return evaluateAssign(expr);
    case "Binary":
      return evaluateBinary(expr);
    case "BlockExpr":
      return evaluateBlockExpr(expr);
    case "Call":
      return evaluateCall(expr);
    case "If":
      return evaluateIf(expr);
    case "Grouping":
      return evaluateGrouping(expr);
    case "Literal":
      return evaluateLiteral(expr);
    case "Unary":
      return evaluateUnary(expr);
    case "Variable":
      return evaluateVariable(expr);
    default:
      expr satisfies never;
  }

  // Unreachable.
  return UNIT;
}

function executeBlockStmt(stmt: BlockStmt): void {
  const previous = environment;
  try {
    environment = new Environment(previous);

    for (const statement of stmt.statements.filter((s) => s !== null))
      execute(statement);
  } finally {
    environment = previous;
  }
}

function executeBreak(_stmt: Break): void {
  throw new BreakException();
}

function executeConst(stmt: Const): void {
  environment.define(stmt.name.lexeme, evaluate(stmt.initializer));
}

function executeContinue(_stmt: Continue): void {
  throw new ContinueException();
}

function executeExpression(stmt: Expression): void {
  evaluate(stmt.expression);
}

function executeLet(stmt: Let): void {
  let value: Value = UNIT;
  if (stmt.initializer != null) {
    value = evaluate(stmt.initializer);
  }

  environment.define(stmt.name.lexeme, value);
}

function executeWhile(stmt: While): void {
  while (isTruthy(evaluate(stmt.condition))) {
    try {
      execute(stmt.body);
    } catch (err) {
      if (err instanceof BreakException) break;
      else if (err instanceof ContinueException) continue;
      else throw err;
    }
  }
}

function evaluateAssign(expr: Assign): Value {
  const value = evaluate(expr.value);
  environment.assign(expr.name, value);
  return value;
}

function evaluateBinary(expr: Binary): Value {
  const left = evaluate(expr.left);

  if (expr.operator.type === TokenType.Or) {
    return isTruthy(left) ? left : evaluate(expr.right);
  } else if (expr.operator.type === TokenType.And) {
    return !isTruthy(left) ? left : evaluate(expr.right);
  }

  const right = evaluate(expr.right);

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

function evaluateBlockExpr(expr: BlockExpr): Value {
  const previous = environment;
  let value: Value = UNIT;
  try {
    environment = new Environment(previous);

    for (const statement of expr.statements.filter((s) => s !== null)) {
      execute(statement);
    }
  } finally {
    if (expr.value !== null) value = evaluate(expr.value);
    environment = previous;
  }
  return value;
}

function evaluateCall(expr: Call): Value {
  const callee = evaluate(expr.callee);

  const args: Value[] = [];
  for (const argument of expr.args) {
    args.push(evaluate(argument));
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

function evaluateIf(expr: If): Value {
  if (isTruthy(evaluate(expr.condition))) {
    return evaluate(expr.thenBranch);
  } else if (expr.elseBranch !== null) {
    return evaluate(expr.elseBranch);
  }
  return UNIT;
}

function evaluateGrouping(expr: Grouping): Value {
  return evaluate(expr.expression);
}

function evaluateLiteral(expr: Literal): Value {
  return expr.value;
}

function evaluateUnary(expr: Unary): Value {
  const right = evaluate(expr.right);

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

function evaluateVariable(expr: Variable): Value {
  return environment.get(expr.name);
}

function isTruthy(value: Value): boolean {
  if (value === null || value === UNIT) return false;
  if (typeof value === "boolean") return value;
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
