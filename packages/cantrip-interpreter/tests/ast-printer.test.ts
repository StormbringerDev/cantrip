import { describe, expect, it } from "vitest";
import {
  BinaryExpr,
  type Expr,
  GroupingExpr,
  LiteralExpr,
  Token,
  TokenType,
  UnaryExpr,
} from "@cantrip/ast";
import type { Span } from "@cantrip/types";
import { AstPrinter } from "../src/ast-printer.js";

/** Create single-line Span from start/end offsets (column == offset) */
function makeSpan(start: number, end: number): Span {
  return {
    start: { line: 0, column: start, offset: start },
    end: { line: 0, column: end, offset: end },
  };
}

/** Convenience token factory */
function tok(
  type: TokenType,
  lexeme: string,
  literal: string | number | null = null,
  start = 0,
  end = start + lexeme.length,
): Token {
  return new Token(type, lexeme, literal, makeSpan(start, end));
}

function binExpr(
  left: number,
  operator: Token,
  right: number,
  start = 0,
  end = start + left.toString().length + operator.lexeme.length + right.toString().length,
): BinaryExpr {
  return new BinaryExpr(
    litExpr(left),
    operator,
    litExpr(right, end - right.toString().length),
    makeSpan(start, end),
  );
}

function groupExpr(expr: Expr, start = 0, end = start + expr.span.end.offset + 1) {
  return new GroupingExpr(expr, makeSpan(start, end));
}

function litExpr(
  value: number | string,
  start = 0,
  end = start + value.toString().length,
): LiteralExpr {
  return new LiteralExpr(value, makeSpan(start, end));
}

function uniExpr(value: number, start = 0, end = start + value.toString().length) {
  return new UnaryExpr(
    tok(TokenType.Minus, "-"),
    litExpr(value, 1),
    makeSpan(start, end),
  );
}

function nullExpr(start = 0, end = start + 3) {
  return new LiteralExpr(null, makeSpan(start, end));
}

describe("AstPrinter", () => {
  const printer = new AstPrinter();

  it("prints a literal value", () => {
    const num = litExpr(42);
    const output = printer.print(num);
    expect(output).toBe("42");
  });

  it("prints a raw string", () => {
    const str = litExpr("Hello\nWorld!");
    const output = printer.print(str);
    expect(output).toBe(`Hello\\nWorld!`);
  });

  it("prints 'nil'", () => {
    const nil = nullExpr();
    const output = printer.print(nil);
    expect(output).toBe("nil");
  });

  it("prints a binary expression", () => {
    const expr = binExpr(5, tok(TokenType.Plus, "+", null, 1), 5);
    const output = printer.print(expr);
    expect(output).toBe("(+ 5 5)");
  });

  it("prints a unary expression", () => {
    const expr = uniExpr(5);
    const output = printer.print(expr);
    expect(output).toBe("(- 5)");
  });

  it("prints a grouping expression", () => {
    const expr = groupExpr(binExpr(5, tok(TokenType.Minus, "-", null, 1), 2));
    const output = printer.print(expr);
    expect(output).toBe("(group (- 5 2))");
  });
});
