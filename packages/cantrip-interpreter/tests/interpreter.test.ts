import { describe, expect, it } from "vitest";
import { Interpreter } from "../src/interpreter.js";
import {
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  Token,
  TokenType,
  UnaryExpr,
} from "@cantrip/ast";
import type { Span } from "@cantrip/types";

/** Primative and structured literals passed around at runtime. */
type RuntimeValue = number | string | boolean | null | RuntimeArray | RuntimeObject;

/** Runtime representation of a Cantrip array. */
type RuntimeArray = RuntimeValue[];

/** Runtime representation of a Cantrip object. */
type RuntimeObject = Map<string, RuntimeValue>;

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

const interpreter = new Interpreter();

describe("interpreter", () => {
  describe("expressions", () => {
    describe("literal expressions", () => {
      it("evaluates a number literal", () => {
        const expr = new LiteralExpr(42, makeSpan(0, 2));
        const result = interpreter.visitLiteralExpr(expr);
        expect(result).toBe(42);
      });

      it("evaluates a string literal", () => {
        const expr = new LiteralExpr("Hello", makeSpan(0, 7));
        const result = interpreter.visitLiteralExpr(expr);
        expect(result).toBe("Hello");
      });

      it("evaluates 'true'", () => {
        const expr = new LiteralExpr(true, makeSpan(0, 4));
        const result = interpreter.visitLiteralExpr(expr);
        expect(result).toBe(true);
      });

      it("evaluates 'false'", () => {
        const expr = new LiteralExpr(false, makeSpan(0, 5));
        const result = interpreter.visitLiteralExpr(expr);
        expect(result).toBe(false);
      });

      it("evaluates 'nil' as 'null'", () => {
        const expr = new LiteralExpr(null, makeSpan(0, 3));
        const result = interpreter.visitLiteralExpr(expr);
        expect(result).toBe(null);
      });

      it("evaluates an array literal", () => {
        const expr = new LiteralExpr(
          [
            new LiteralExpr(1, makeSpan(1, 2)),
            new LiteralExpr(2, makeSpan(4, 5)),
            new LiteralExpr(3, makeSpan(7, 8)),
          ],
          makeSpan(0, 9),
        );
        const result = interpreter.visitLiteralExpr(expr);
        const expected = [1, 2, 3];
        expect(result).toEqual(expected);
      });

      it("evaluates an object literal", () => {
        const expr = new LiteralExpr(
          new Map<string, Expr>([
            ["name", new LiteralExpr("Reyek", makeSpan(8, 15))],
            ["level", new LiteralExpr(3, makeSpan(24, 25))],
          ]),
          makeSpan(0, 27),
        );
        const result = interpreter.visitLiteralExpr(expr);
        const expected = new Map<string, RuntimeValue>([
          ["name", "Reyek"],
          ["level", 3],
        ]);
        expect(result).toEqual(expected);
      });
    });

    describe("unary expressions", () => {
      it("evaluates a negation expression", () => {
        const expr = new UnaryExpr(
          tok(TokenType.Minus, "-"),
          new LiteralExpr(5, makeSpan(1, 2)),
          makeSpan(0, 2),
        );
        const result = interpreter.visitUnaryExpr(expr);
        expect(result).toBe(-5);
      });

      it("evaluates a logical not expression", () => {
        const expr = new UnaryExpr(
          tok(TokenType.Bang, "!"),
          new LiteralExpr(true, makeSpan(1, 5)),
          makeSpan(0, 5),
        );
        const result = interpreter.visitUnaryExpr(expr);
        expect(result).toBe(false);
      });
    });

    describe("binary expressions", () => {
      it("evaluates an addition expression", () => {
        const expr = new BinaryExpr(
          new LiteralExpr(5, makeSpan(0, 1)),
          tok(TokenType.Plus, "+", null, 2),
          new LiteralExpr(5, makeSpan(4, 6)),
          makeSpan(0, 6),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(10);
      });

      it("evaluates a concatenation expression", () => {
        const expr = new BinaryExpr(
          new LiteralExpr("Hello, ", makeSpan(0, 9)),
          tok(TokenType.Plus, "+", null, 10),
          new LiteralExpr("world!", makeSpan(12, 19)),
          makeSpan(0, 19),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe("Hello, world!");
      });

      it("evaluates a subtraction expression", () => {
        const expr = new BinaryExpr(
          new LiteralExpr(5, makeSpan(0, 1)),
          tok(TokenType.Minus, "-", null, 3),
          new LiteralExpr(2, makeSpan(5, 6)),
          makeSpan(0, 6),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(3);
      });

      it("evaluates a multiplication expression", () => {
        const expr = new BinaryExpr(
          new LiteralExpr(5, makeSpan(0, 1)),
          tok(TokenType.Star, "*", null, 3),
          new LiteralExpr(5, makeSpan(5, 6)),
          makeSpan(0, 6),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(25);
      });

      it("evaluates a division expression", () => {
        const expr = new BinaryExpr(
          new LiteralExpr(10, makeSpan(0, 2)),
          tok(TokenType.Slash, "/", null, 4),
          new LiteralExpr(2, makeSpan(6, 7)),
          makeSpan(0, 7),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(5);
      });

      it("evaluates a modulo expression", () => {
        const expr = new BinaryExpr(
          new LiteralExpr(9, makeSpan(0, 1)),
          tok(TokenType.Percent, "%", null, 3),
          new LiteralExpr(2, makeSpan(5, 6)),
          makeSpan(0, 6),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(1);
      });

      it("evaluates an equality expression", () => {
        const expr = new BinaryExpr(
          new LiteralExpr(7, makeSpan(0, 1)),
          tok(TokenType.EqEq, "==", null, 3),
          new LiteralExpr(3, makeSpan(6, 7)),
          makeSpan(0, 7),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(false);
      });

      it("evaluates an inequality expression", () => {
        const expr = new BinaryExpr(
          new LiteralExpr(7, makeSpan(0, 1)),
          tok(TokenType.BangEq, "!=", null, 3),
          new LiteralExpr(3, makeSpan(6, 7)),
          makeSpan(0, 7),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(true);
      });

      it("evaluates a greater than expression", () => {
        const expr = new BinaryExpr(
          new LiteralExpr(5, makeSpan(0, 1)),
          tok(TokenType.Greater, ">", null, 3),
          new LiteralExpr(3, makeSpan(5, 6)),
          makeSpan(0, 6),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(true);
      });

      it("evaluates a greater or equal expression", () => {
        const expr = new BinaryExpr(
          new LiteralExpr(5, makeSpan(0, 1)),
          tok(TokenType.GreaterEq, ">=", null, 3),
          new LiteralExpr(3, makeSpan(6, 7)),
          makeSpan(0, 7),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(true);
      });

      it("evaluates a less than expression", () => {
        const expr = new BinaryExpr(
          new LiteralExpr(5, makeSpan(0, 1)),
          tok(TokenType.Less, "<", null, 3),
          new LiteralExpr(3, makeSpan(5, 6)),
          makeSpan(0, 6),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(false);
      });

      it("evaluates a less or equal expression", () => {
        const expr = new BinaryExpr(
          new LiteralExpr(5, makeSpan(0, 1)),
          tok(TokenType.LessEq, "<=", null, 3),
          new LiteralExpr(3, makeSpan(6, 7)),
          makeSpan(0, 7),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(false);
      });

      it("evaluates a logical or expression", () => {
        const expr = new BinaryExpr(
          new LiteralExpr(true, makeSpan(0, 5)),
          tok(TokenType.Or, "or", null, 6),
          new LiteralExpr(false, makeSpan(9, 14)),
          makeSpan(0, 14),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(true);
      });

      it("evaluates a logical and expression", () => {
        const expr = new BinaryExpr(
          new LiteralExpr(true, makeSpan(0, 5)),
          tok(TokenType.And, "and", null, 6),
          new LiteralExpr(false, makeSpan(10, 15)),
          makeSpan(0, 15),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(false);
      });
    });

    describe("grouping expressions", () => {
      it("evaluates a grouping expression", () => {
        const expr = new GroupingExpr(
          new BinaryExpr(
            new LiteralExpr(5, makeSpan(1, 2)),
            tok(TokenType.Plus, "+", null, 3),
            new LiteralExpr(5, makeSpan(5, 6)),
            makeSpan(1, 6),
          ),
          makeSpan(0, 7),
        );
        const result = interpreter.visitGroupingExpr(expr);
        expect(result).toBe(10);
      });
    });
  });
});
