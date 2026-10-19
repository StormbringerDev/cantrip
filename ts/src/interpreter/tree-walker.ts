import { DiagnosticCollector } from "../diagnostic/collector.js";
import { error } from "../diagnostic/create.js";
import type { Binary, Expr, Grouping, Literal, Unary } from "../parser/expr.js";
import { TokenType, type Token } from "../parser/token.js";

type CantripValue = number | string | boolean | null;

export class RuntimeError extends Error {
  readonly token: Token;

  constructor(token: Token, message: string) {
    super(message);
    this.name = "RuntimeError";
    this.token = token;
  }
}

export function interpret(
  expression: Expr,
  diagnostics: DiagnosticCollector,
): void {
  try {
    const value = evaluate(expression);
    console.log(stringify(value));
  } catch (caught) {
    if (!(caught instanceof RuntimeError)) throw caught;
    diagnostics.emit(error(caught.message, caught.token));
  }
}

function evaluate(expr: Expr): CantripValue {
  switch (expr.type) {
    case "Binary":
      return evaluateBinary(expr);
    case "Grouping":
      return evaluateGrouping(expr);
    case "Literal":
      return evaluateLiteral(expr);
    case "Unary":
      return evaluateUnary(expr);
    default:
      expr satisfies never;
  }

  // Unreachable.
  return null;
}

function evaluateBinary(expr: Binary): CantripValue {
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
  return null;
}

function evaluateGrouping(expr: Grouping): CantripValue {
  return evaluate(expr.expression);
}

function evaluateLiteral(expr: Literal): CantripValue {
  return expr.value;
}

function evaluateUnary(expr: Unary): CantripValue {
  const right = evaluate(expr.right);

  switch (expr.operator.type) {
    case TokenType.Minus:
      checkNumberOperand(expr.operator, right);
      return -(right as number);
    case TokenType.Bang:
      return !isTruthy(right);
    default:
      return null; // Unreachable
  }
}

function isTruthy(value: CantripValue): boolean {
  if (value == null) return false;
  if (typeof value === "boolean") return value;
  return true;
}

function stringify(value: CantripValue): string {
  if (value === null) return "nil";

  return value.toString();
}

function checkNumberOperand(operator: Token, operand: CantripValue) {
  if (typeof operand === "number") return;
  throw new RuntimeError(operator, "operand must be a number");
}

function checkNumberOperands(
  operator: Token,
  left: CantripValue,
  right: CantripValue,
) {
  if (typeof left === "number" && typeof right === "number") return;
  throw new RuntimeError(operator, "operands must be numbers");
}
