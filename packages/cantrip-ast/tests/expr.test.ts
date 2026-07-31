import { describe, expect, it, vi } from "vitest";
import {
  AssignExpr,
  BinaryExpr,
  type Expr,
  type ExprVisitor,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  VarExpr,
} from "../src/expr.js";
import type { Span } from "@cantrip/types";
import { Token, TokenType } from "../src/token.js";

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
  value: number,
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

describe("expression classes", () => {
  it("instantiates a LiteralExpr", () => {
    const expr = new LiteralExpr(42, makeSpan(0, 2));
    expect(expr).toBeInstanceOf(LiteralExpr);
    expect(expr.value).toBe(42);
    const expectedSpan = makeSpan(0, 2);
    expect(expr.span).toStrictEqual(expectedSpan);
  });

  it("instantiates a BinaryExpr", () => {
    const left = new LiteralExpr(5, makeSpan(0, 1));
    const operator = tok(TokenType.Plus, "+", null, 1);
    const right = new LiteralExpr(5, makeSpan(2, 3));
    const expr = new BinaryExpr(left, operator, right, makeSpan(0, 3));
    expect(expr).toBeInstanceOf(BinaryExpr);
    expect(expr.left).toBeInstanceOf(LiteralExpr);
    expect(expr.operator.type).toBe(TokenType.Plus);
    expect(expr.right).toBeInstanceOf(LiteralExpr);
    const expectedSpan = makeSpan(0, 3);
    expect(expr.span).toStrictEqual(expectedSpan);
  });

  it("instantiates a UnaryExpr", () => {
    const operator = tok(TokenType.Minus, "-");
    const right = new LiteralExpr(5, makeSpan(1, 2));
    const expr = new UnaryExpr(operator, right, makeSpan(0, 2));
    expect(expr).toBeInstanceOf(UnaryExpr);
    expect(expr.operator.type).toBe(TokenType.Minus);
    expect(expr.right).toBeInstanceOf(LiteralExpr);
    const expectedSpan = makeSpan(0, 2);
    expect(expr.span).toStrictEqual(expectedSpan);
  });

  it("instantiates a GroupingExpr", () => {
    const inner = new LiteralExpr(420, makeSpan(1, 4));
    const expr = new GroupingExpr(inner, makeSpan(0, 5));
    expect(expr).toBeInstanceOf(GroupingExpr);
    expect(expr.expression).toBeInstanceOf(LiteralExpr);
    const expectedSpan = makeSpan(0, 5);
    expect(expr.span).toStrictEqual(expectedSpan);
  });

  it("instantiates a VarExpr", () => {
    const token = tok(TokenType.Identifier, "num");
    const expr = new VarExpr(token, token.span);
    expect(expr).toBeInstanceOf(VarExpr);
    expect(expr.name.lexeme).toBe("num");
    expect(expr.span).toEqual(token.span);
  });

  it("instantiates an AssignExpr", () => {
    const name = tok(TokenType.Identifier, "answer");
    const operator = tok(TokenType.Eq, "=", null, 6);
    const expr = new AssignExpr(name, operator, litExpr(42, 7), makeSpan(0, 9));
    expect(expr).toBeInstanceOf(AssignExpr);
    expect(expr.name.lexeme).toBe("answer");
    expect(expr.operator.type).toBe(TokenType.Eq);
    expect(expr.value.value).toBe(42);
  });

  describe("visitor", () => {
    class TestVisitor implements ExprVisitor<void> {
      visitAssignExpr(expr: AssignExpr): void {
        return;
      }

      visitBinaryExpr(expr: BinaryExpr): void {
        return;
      }

      visitGroupingExpr(expr: GroupingExpr): void {
        return;
      }

      visitLiteralExpr(expr: LiteralExpr): void {
        return;
      }

      visitUnaryExpr(expr: UnaryExpr): void {
        return;
      }

      visitVarExpr(expr: VarExpr): void {
        return;
      }
    }

    const testVisitor = new TestVisitor();
    const binaryExpr = binExpr(5, tok(TokenType.Minus, "-", null, 1), 5);

    it("calls visitAssignExpr", () => {
      const expr = new AssignExpr(
        tok(TokenType.Identifier, "answer"),
        tok(TokenType.Eq, "=", null, 6),
        litExpr(42, 7),
        makeSpan(0, 9),
      );
      const spy = vi.spyOn(TestVisitor.prototype, "visitAssignExpr");
      expr.accept(testVisitor);
      expect(spy).toHaveBeenCalled();
    });

    it("calls visitBinaryExpr", () => {
      const spy = vi.spyOn(TestVisitor.prototype, "visitBinaryExpr");
      binaryExpr.accept(testVisitor);
      expect(spy).toHaveBeenCalled();
    });

    it("calls visitGroupingExpr", () => {
      const groupingExpr = groupExpr(binaryExpr);
      const spy = vi.spyOn(TestVisitor.prototype, "visitGroupingExpr");
      groupingExpr.accept(testVisitor);
      expect(spy).toHaveBeenCalled();
    });

    it("calls visitLiteralExpr", () => {
      const literalExpr = litExpr(5);
      const spy = vi.spyOn(TestVisitor.prototype, "visitLiteralExpr");
      literalExpr.accept(testVisitor);
      expect(spy).toHaveBeenCalled();
    });

    it("calls visitUnaryExpr", () => {
      const unaryExpr = uniExpr(5);
      const spy = vi.spyOn(TestVisitor.prototype, "visitUnaryExpr");
      unaryExpr.accept(testVisitor);
      expect(spy).toHaveBeenCalled();
    });

    it("calls visitVarExpr", () => {
      const token = tok(TokenType.Identifier, "num");
      const varExpr = new VarExpr(token, token.span);
      const spy = vi.spyOn(TestVisitor.prototype, "visitVarExpr");
      varExpr.accept(testVisitor);
      expect(spy).toHaveBeenCalled();
    });
  });
});
