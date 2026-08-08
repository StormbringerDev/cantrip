import { describe, expect, it } from "vitest";
import { Interpreter } from "../src/interpreter.js";
import { Expr, LiteralExpr, Token, TokenType, UnaryExpr } from "@cantrip/ast";
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
  });
});
