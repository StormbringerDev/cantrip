import { describe, expect, it, vi } from "vitest";
import {
  AssignExpr,
  BinaryExpr,
  BlockExpr,
  CallExpr,
  type Expr,
  type ExprVisitor,
  GetExpr,
  GroupingExpr,
  IfExpr,
  IndexExpr,
  IndexSetExpr,
  LiteralExpr,
  LoopExpr,
  MatchExpr,
  SetExpr,
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
    const value = new LiteralExpr(42, makeSpan(7, 9));
    const expr = new AssignExpr(name, value, makeSpan(0, 9));
    expect(expr).toBeInstanceOf(AssignExpr);
    expect(expr.name.lexeme).toBe("answer");
    expect((expr.value as AssignExpr).value).toBe(42);
  });

  describe("visitor", () => {
    class TestVisitor implements ExprVisitor<void> {
      visitAssignExpr(_expr: AssignExpr): void {}
      visitBinaryExpr(_expr: BinaryExpr): void {}
      visitBlockExpr(_expr: BlockExpr): void {}
      visitCallExpr(_expr: CallExpr): void {}
      visitGetExpr(_expr: GetExpr): void {}
      visitGroupingExpr(_expr: GroupingExpr): void {}
      visitIfExpr(_expr: IfExpr): void {}
      visitIndexExpr(_expr: IndexExpr): void {}
      visitIndexSetExpr(_expr: IndexSetExpr): void {}
      visitLiteralExpr(_expr: LiteralExpr): void {}
      visitLoopExpr(_expr: LoopExpr): void {}
      visitMatchExpr(_expr: MatchExpr): void {}
      visitSetExpr(_expr: SetExpr): void {}
      visitUnaryExpr(_expr: UnaryExpr): void {}
      visitVarExpr(_expr: VarExpr): void {}
    }

    const testVisitor = new TestVisitor();

    it("calls visitAssignExpr", () => {
      const visitorSpy = vi.spyOn(testVisitor, "visitAssignExpr");
      const expr = new AssignExpr(
        tok(TokenType.Identifier, "x"),
        new LiteralExpr(42, makeSpan(5, 7)),
        makeSpan(0, 7),
      );
      expr.accept(testVisitor);
      expect(visitorSpy).toHaveBeenCalled();
    });

    it("calls visitBinaryExpr", () => {
      const visitorSpy = vi.spyOn(testVisitor, "visitBinaryExpr");
      const expr = new BinaryExpr(
        new LiteralExpr(1, makeSpan(0, 1)),
        tok(TokenType.Plus, "+", null, 2),
        new LiteralExpr(2, makeSpan(4, 5)),
        makeSpan(0, 5),
      );
      expr.accept(testVisitor);
      expect(visitorSpy).toHaveBeenCalled();
    });

    it("calls visitBlockExpr", () => {
      const visitorSpy = vi.spyOn(testVisitor, "visitBlockExpr");
      const expr = new BlockExpr([], new LiteralExpr(42, makeSpan(2, 4)), makeSpan(0, 6));
      expr.accept(testVisitor);
      expect(visitorSpy).toHaveBeenCalled();
    });

    it("calls visitCallExpr", () => {
      const visitorSpy = vi.spyOn(testVisitor, "visitCallExpr");
      const expr = new CallExpr(
        new VarExpr(tok(TokenType.Identifier, "time"), makeSpan(0, 4)),
        tok(TokenType.RightParen, ")", null, 5),
        [],
        makeSpan(0, 6),
      );
      expr.accept(testVisitor);
      expect(visitorSpy).toHaveBeenCalled();
    });

    it("calls visitGetExpr", () => {
      const visitorSpy = vi.spyOn(testVisitor, "visitGetExpr");
      const expr = new GetExpr(
        new VarExpr(tok(TokenType.Identifier, "obj"), makeSpan(0, 3)),
        tok(TokenType.Identifier, "field", null, 4),
        makeSpan(0, 9),
      );
      expr.accept(testVisitor);
      expect(visitorSpy).toHaveBeenCalled();
    });

    it("calls visitGroupingExpr", () => {
      const visitorSpy = vi.spyOn(testVisitor, "visitGroupingExpr");
      const expr = new GroupingExpr(new LiteralExpr(42, makeSpan(1, 3)), makeSpan(0, 4));
      expr.accept(testVisitor);
      expect(visitorSpy).toHaveBeenCalled();
    });

    it("calls visitIfExpr", () => {
      const visitorSpy = vi.spyOn(testVisitor, "visitIfExpr");
      const expr = new IfExpr(
        new LiteralExpr(true, makeSpan(3, 7)),
        new BlockExpr([], new LiteralExpr(5, makeSpan(10, 11)), makeSpan(8, 13)),
        null,
        makeSpan(0, 13),
      );
      expr.accept(testVisitor);
      expect(visitorSpy).toHaveBeenCalled();
    });

    it("calls visitIndexExpr", () => {
      const visitorSpy = vi.spyOn(testVisitor, "visitIndexExpr");
      const expr = new IndexExpr(
        new VarExpr(tok(TokenType.Identifier, "arr"), makeSpan(0, 4)),
        tok(TokenType.LeftBracket, "[", 4),
        new LiteralExpr(1, makeSpan(5, 6)),
        makeSpan(0, 7),
      );
      expr.accept(testVisitor);
      expect(visitorSpy).toHaveBeenCalled();
    });

    it("calls visitIndexSetExpr", () => {
      const visitorSpy = vi.spyOn(testVisitor, "visitIndexSetExpr");
      const expr = new IndexSetExpr(
        new VarExpr(tok(TokenType.Identifier, "arr"), makeSpan(0, 4)),
        tok(TokenType.LeftBracket, "[", 4),
        new LiteralExpr(1, makeSpan(5, 6)),
        new LiteralExpr("Shade", makeSpan(10, 17)),
        makeSpan(0, 17),
      );
      expr.accept(testVisitor);
      expect(visitorSpy).toHaveBeenCalled();
    });

    it("calls visitLiteralExpr", () => {
      const visitorSpy = vi.spyOn(testVisitor, "visitLiteralExpr");
      const expr = new LiteralExpr(42, makeSpan(0, 2));
      expr.accept(testVisitor);
      expect(visitorSpy).toHaveBeenCalled();
    });

    it("calls visitLoopExpr", () => {
      const visitorSpy = vi.spyOn(testVisitor, "visitLoopExpr");
      const expr = new LoopExpr(new BlockExpr([], null, makeSpan(5, 7)), makeSpan(0, 7));
      expr.accept(testVisitor);
      expect(visitorSpy).toHaveBeenCalled();
    });

    it("calls visitMatchExpr", () => {
      const visitorSpy = vi.spyOn(testVisitor, "visitMatchExpr");
      const expr = new MatchExpr(
        new VarExpr(tok(TokenType.Identifier, "x", null, 6), makeSpan(6, 7)),
        new Map<Expr, Expr>(),
        makeSpan(0, 10),
      );
      expr.accept(testVisitor);
      expect(visitorSpy).toHaveBeenCalled();
    });

    it("calls visitSetExpr", () => {
      const visitorSpy = vi.spyOn(testVisitor, "visitSetExpr");
      const expr = new SetExpr(
        new VarExpr(tok(TokenType.Identifier, "obj"), makeSpan(0, 4)),
        tok(TokenType.Identifier, "field", null, 5),
        new LiteralExpr(4, makeSpan(12, 13)),
        makeSpan(0, 13),
      );
      expr.accept(testVisitor);
      expect(visitorSpy).toHaveBeenCalled();
    });

    it("calls visitUnaryExpr", () => {
      const visitorSpy = vi.spyOn(testVisitor, "visitUnaryExpr");
      const expr = new UnaryExpr(
        tok(TokenType.Minus, "-"),
        new LiteralExpr(5, makeSpan(1, 2)),
        makeSpan(0, 2),
      );
      expr.accept(testVisitor);
      expect(visitorSpy).toHaveBeenCalled();
    });

    it("calls visitVarExpr", () => {
      const visitorSpy = vi.spyOn(testVisitor, "visitVarExpr");
      const expr = new VarExpr(tok(TokenType.Identifier, "x"), makeSpan(0, 1));
      expr.accept(testVisitor);
      expect(visitorSpy).toHaveBeenCalled();
    });
  });
});
