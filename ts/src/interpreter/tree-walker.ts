import { DiagnosticCollector } from "../diagnostic/collector.js";
import { error } from "../diagnostic/create.js";
import type * as astExpr from "../parser/expr.js";
import type { Expr } from "../parser/expr.js";
import type * as astStmt from "../parser/stmt.js";
import type { Stmt } from "../parser/stmt.js";
import { TokenType, type Token } from "../parser/token.js";
import { Environment } from "./environment.js";
import { RuntimeError } from "./exceptions.js";
import { UNIT, type Value } from "./types.js";

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

let environment = new Environment();

function execute(stmt: Stmt): void {
  switch (stmt.type) {
    case "Block":
      executeBlock(stmt);
      break;
    case "Expression":
      executeExpression(stmt);
      break;
    case "Let":
      executeLet(stmt);
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
    case "Block":
      return evaluateBlock(expr);
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

function executeBlock(stmt: astStmt.Block): void {
  const previous = environment;
  try {
    environment = new Environment(previous);

    for (const statement of stmt.statements.filter((s) => s !== null))
      execute(statement);
  } finally {
    environment = previous;
  }
}

function executeExpression(stmt: astStmt.Expression): void {
  evaluate(stmt.expression);
}

function executeLet(stmt: astStmt.Let): void {
  let value = null;
  if (stmt.initializer != null) {
    value = evaluate(stmt.initializer);
  }

  environment.define(stmt.name.lexeme, value);
}

function evaluateAssign(expr: astExpr.Assign): Value {
  const value = evaluate(expr.value);
  environment.assign(expr.name, value);
  return value;
}

function evaluateBinary(expr: astExpr.Binary): Value {
  const left = evaluate(expr.left);
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

function evaluateBlock(expr: astExpr.Block): Value {
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

function evaluateIf(expr: astExpr.If): Value {
  if (isTruthy(evaluate(expr.condition))) {
    return evaluate(expr.thenBranch);
  } else if (expr.elseBranch !== null) {
    return evaluate(expr.elseBranch);
  }
  return UNIT;
}

function evaluateGrouping(expr: astExpr.Grouping): Value {
  return evaluate(expr.expression);
}

function evaluateLiteral(expr: astExpr.Literal): Value {
  return expr.value;
}

function evaluateUnary(expr: astExpr.Unary): Value {
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

function evaluateVariable(expr: astExpr.Variable): Value {
  return environment.get(expr.name);
}

function isTruthy(value: Value): boolean {
  if (value == null) return false;
  if (typeof value === "boolean") return value;
  return true;
}

function stringify(value: Value): string {
  if (value === null) return "nil";
  if (value === UNIT) return "()";

  return value.toString();
}

function checkNumberOperand(operator: Token, operand: Value) {
  if (typeof operand === "number") return;
  throw new RuntimeError(operator, "operand must be a number");
}

function checkNumberOperands(operator: Token, left: Value, right: Value) {
  if (typeof left === "number" && typeof right === "number") return;
  throw new RuntimeError(operator, "operands must be numbers");
}
