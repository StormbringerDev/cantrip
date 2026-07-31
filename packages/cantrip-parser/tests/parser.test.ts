import { describe, expect, it } from "vitest";
import { Parser } from "../src/parser.js";
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
import { VarExpr } from "../../cantrip-ast/src/expr.js";

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

describe("Parser", () => {
  describe("literals", () => {
    it("parses a number literal", () => {
      const tokens = [tok(TokenType.Number, "42", 42), tok(TokenType.Eof, "", null, 2)];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(LiteralExpr);
      expect(ast.value).toBe(42);
    });

    it("parses a string literal", () => {
      // Lexeme includes quotes; literal value doesn't
      const tokens = [
        tok(TokenType.String, '"Hello!"', "Hello!"),
        tok(TokenType.Eof, "", null, 8),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(LiteralExpr);
      expect(ast.value).toBe("Hello!");
    });

    it("parses true", () => {
      const tokens = [tok(TokenType.True, "true"), tok(TokenType.Eof, "", null, 4)];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(LiteralExpr);
      expect(ast.value).toBe(true);
    });

    it("parses false", () => {
      const tokens = [tok(TokenType.False, "false"), tok(TokenType.Eof, "", null, 5)];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(LiteralExpr);
      expect(ast.value).toBe(false);
    });

    it("parses nil", () => {
      const tokens = [tok(TokenType.Nil, "nil"), tok(TokenType.Eof, "", null, 3)];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(LiteralExpr);
      expect(ast.value).toBe(null);
    });

    it("parses an empty array literal", () => {
      const tokens = [
        tok(TokenType.LeftBracket, "["),
        tok(TokenType.RightBracket, "]", null, 1),
        tok(TokenType.Eof, "", null, 2),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(LiteralExpr);
      expect(ast.value).toEqual([]);
    });

    it("parses an array literal", () => {
      const tokens = [
        tok(TokenType.LeftBracket, "["),
        tok(TokenType.Number, "1", 1, 1),
        tok(TokenType.Comma, ",", null, 2),
        tok(TokenType.Number, "2", 2, 3),
        tok(TokenType.Comma, ",", null, 4),
        tok(TokenType.Number, "3", 3, 5),
        tok(TokenType.RightBracket, "]", null, 6),
        tok(TokenType.Eof, "", null, 7),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(LiteralExpr);
      const expected = [1, 2, 3];
      expect(ast.value.map((e) => e.value)).toEqual(expected);
    });

    it("parses an array literal with a trailing comma", () => {
      const tokens = [
        tok(TokenType.LeftBracket, "["),
        tok(TokenType.Number, "1", 1, 1),
        tok(TokenType.Comma, ",", null, 2),
        tok(TokenType.Number, "2", 2, 3),
        tok(TokenType.Comma, ",", null, 4),
        tok(TokenType.Number, "3", 3, 5),
        tok(TokenType.Comma, ",", null, 6),
        tok(TokenType.RightBracket, "]", null, 7),
        tok(TokenType.Eof, "", null, 8),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(LiteralExpr);
      const expected = [1, 2, 3];
      expect(ast.value.map((e) => e.value)).toEqual(expected);
    });

    it("parses nested array literals", () => {
      const tokens = [
        tok(TokenType.LeftBracket, "["),
        tok(TokenType.Number, "1", 1, 1),
        tok(TokenType.Comma, ",", null, 2),
        tok(TokenType.LeftBracket, "[", null, 3),
        tok(TokenType.Number, "2", 2, 4),
        tok(TokenType.Comma, ",", null, 5),
        tok(TokenType.Number, "3", 3, 6),
        tok(TokenType.RightBracket, "]", null, 7),
        tok(TokenType.RightBracket, "]", null, 8),
        tok(TokenType.Eof, "", null, 9),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(LiteralExpr);
      const expected = [
        new LiteralExpr(1, makeSpan(1, 2)),
        new LiteralExpr(
          [new LiteralExpr(2, makeSpan(4, 5)), new LiteralExpr(3, makeSpan(6, 7))],
          makeSpan(3, 8),
        ),
      ];
      expect(ast.value).toEqual(expected);
    });

    it("parses an empty object literal", () => {
      const tokens = [
        tok(TokenType.LeftBrace, "{"),
        tok(TokenType.RightBrace, "}", null, 1),
        tok(TokenType.Eof, "", null, 2),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(LiteralExpr);
      const expected = new Map<string, Expr>();
      expect(ast.value).toEqual(expected);
    });

    it("parses an object literal", () => {
      const tokens = [
        tok(TokenType.LeftBrace, "{"),
        tok(TokenType.Identifier, "name", null, 1),
        tok(TokenType.Colon, ":", null, 5),
        tok(TokenType.String, '"Reyek"', "Reyek", 6),
        tok(TokenType.Comma, ",", null, 13),
        tok(TokenType.Identifier, "level", null, 14),
        tok(TokenType.Colon, ":", null, 19),
        tok(TokenType.Number, "5", 5, 20),
        tok(TokenType.RightBrace, "}", null, 21),
        tok(TokenType.Eof, "", null, 22),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(LiteralExpr);
      const expected = new Map<string, Expr>([
        ["name", new LiteralExpr("Reyek", makeSpan(6, 13))],
        ["level", new LiteralExpr(5, makeSpan(20, 21))],
      ]);
      expect(ast.value).toEqual(expected);
    });

    it("parses an object literal with a trailing comma", () => {
      const tokens = [
        tok(TokenType.LeftBrace, "{"),
        tok(TokenType.Identifier, "name", null, 1),
        tok(TokenType.Colon, ":", null, 5),
        tok(TokenType.String, '"Reyek"', "Reyek", 6),
        tok(TokenType.Comma, ",", null, 13),
        tok(TokenType.Identifier, "level", null, 14),
        tok(TokenType.Colon, ":", null, 19),
        tok(TokenType.Number, "5", 5, 20),
        tok(TokenType.Comma, ",", null, 21),
        tok(TokenType.RightBrace, "}", null, 22),
        tok(TokenType.Eof, "", null, 23),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(LiteralExpr);
      const expected = new Map<string, Expr>([
        ["name", new LiteralExpr("Reyek", makeSpan(6, 13))],
        ["level", new LiteralExpr(5, makeSpan(20, 21))],
      ]);
      expect(ast.value).toEqual(expected);
    });

    it("parses nested object literals", () => {
      const tokens = [
        tok(TokenType.LeftBrace, "{"),
        tok(TokenType.Identifier, "name", null, 1),
        tok(TokenType.Colon, ":", null, 5),
        tok(TokenType.String, '"Reyek"', "Reyek", 6),
        tok(TokenType.Comma, ",", null, 13),
        tok(TokenType.Identifier, "savingThrows", null, 14),
        tok(TokenType.Colon, ":", null, 26),
        tok(TokenType.LeftBrace, "{", null, 27),
        tok(TokenType.Identifier, "int", null, 28),
        tok(TokenType.Colon, ":", null, 31),
        tok(TokenType.True, "true", null, 32),
        tok(TokenType.Comma, ",", null, 36),
        tok(TokenType.Identifier, "wis", null, 37),
        tok(TokenType.Colon, ":", null, 40),
        tok(TokenType.True, "true", null, 44),
        tok(TokenType.RightBrace, "}", null, 48),
        tok(TokenType.RightBrace, "}", null, 49),
        tok(TokenType.Eof, "", null, 50),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(LiteralExpr);
      const expected = new Map<string, Expr>([
        ["name", new LiteralExpr("Reyek", makeSpan(6, 13))],
        [
          "savingThrows",
          new LiteralExpr(
            new Map<string, Expr>([
              ["int", new LiteralExpr(true, makeSpan(32, 36))],
              ["wis", new LiteralExpr(true, makeSpan(44, 48))],
            ]),
            makeSpan(27, 49),
          ),
        ],
      ]);
      expect(ast.value).toEqual(expected);
    });

    it("parses an object literal with a string key", () => {
      const tokens = [
        tok(TokenType.LeftBrace, "{"),
        tok(TokenType.String, '"test-field"', "test-field", 1),
        tok(TokenType.Colon, ":", 13),
        tok(TokenType.Number, "42", 42, 14),
        tok(TokenType.RightBrace, "}", null, 16),
        tok(TokenType.Eof, "", null, 17),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(LiteralExpr);
      const expected = new Map<string, Expr>([
        ["test-field", new LiteralExpr(42, makeSpan(14, 16))],
      ]);
      expect(ast.value).toEqual(expected);
    });
  });

  describe("grouping expressions", () => {
    it("parses a grouping expression", () => {
      const tokens = [
        tok(TokenType.LeftParen, "("),
        tok(TokenType.Number, "3.14", 3.14, 1),
        tok(TokenType.RightParen, ")", null, 5),
        tok(TokenType.Eof, "", null, 6),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(GroupingExpr);
      expect(ast.expression).toBeInstanceOf(LiteralExpr);
    });
  });

  describe("unary expressions", () => {
    it("parses a negation expression", () => {
      const tokens = [
        tok(TokenType.Minus, "-"),
        tok(TokenType.Number, "5", 5, 1),
        tok(TokenType.Eof, "", null, 2),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(UnaryExpr);
      expect(ast.operator.type).toBe(TokenType.Minus);
      expect(ast.right).toBeInstanceOf(LiteralExpr);
    });

    it("parses a logical not expression", () => {
      const tokens = [
        tok(TokenType.Bang, "!"),
        tok(TokenType.True, "true", null, 1),
        tok(TokenType.Eof, "", null, 2),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(UnaryExpr);
      expect(ast.operator.type).toBe(TokenType.Bang);
      expect(ast.right).toBeInstanceOf(LiteralExpr);
    });
  });

  describe("binary expressions", () => {
    // Term expressions
    it("parses an addition expression", () => {
      const tokens = [
        tok(TokenType.Number, "5", 5),
        tok(TokenType.Plus, "+", null, 1),
        tok(TokenType.Number, "5", 5, 2),
        tok(TokenType.Eof, "", null, 3),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(BinaryExpr);
      expect(ast.left).toBeInstanceOf(LiteralExpr);
      expect(ast.operator.type).toBe(TokenType.Plus);
      expect(ast.right).toBeInstanceOf(LiteralExpr);
    });

    it("parses a subtraction expression", () => {
      const tokens = [
        tok(TokenType.Number, "10", 10),
        tok(TokenType.Minus, "-", null, 2),
        tok(TokenType.Number, "5", 5, 3),
        tok(TokenType.Eof, "", null, 4),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(BinaryExpr);
      expect(ast.left).toBeInstanceOf(LiteralExpr);
      expect(ast.operator.type).toBe(TokenType.Minus);
      expect(ast.right).toBeInstanceOf(LiteralExpr);
    });

    // Factor expressions
    it("parses a multiplication expression", () => {
      const tokens = [
        tok(TokenType.Number, "5", 5),
        tok(TokenType.Star, "*", null, 1),
        tok(TokenType.Number, "5", 5, 2),
        tok(TokenType.Eof, "", null, 3),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(BinaryExpr);
      expect(ast.left).toBeInstanceOf(LiteralExpr);
      expect(ast.operator.type).toBe(TokenType.Star);
      expect(ast.right).toBeInstanceOf(LiteralExpr);
    });

    it("parses a division expression", () => {
      const tokens = [
        tok(TokenType.Number, "10", 10),
        tok(TokenType.Slash, "/", null, 2),
        tok(TokenType.Number, "2", 2, 3),
        tok(TokenType.Eof, "", null, 4),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(BinaryExpr);
      expect(ast.left).toBeInstanceOf(LiteralExpr);
      expect(ast.operator.type).toBe(TokenType.Slash);
      expect(ast.right).toBeInstanceOf(LiteralExpr);
    });

    it("parses a modulo expression", () => {
      const tokens = [
        tok(TokenType.Number, "5", 5),
        tok(TokenType.Percent, "%", null, 1),
        tok(TokenType.Number, "3", 3, 2),
        tok(TokenType.Eof, "", null, 3),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(BinaryExpr);
      expect(ast.left).toBeInstanceOf(LiteralExpr);
      expect(ast.operator.type).toBe(TokenType.Percent);
      expect(ast.right).toBeInstanceOf(LiteralExpr);
    });

    // Comparison expressions
    it("parses a greater than expression", () => {
      const tokens = [
        tok(TokenType.Number, "5", 5),
        tok(TokenType.Greater, ">", null, 1),
        tok(TokenType.Number, "3", 3, 2),
        tok(TokenType.Eof, "", null, 3),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(BinaryExpr);
      expect(ast.left).toBeInstanceOf(LiteralExpr);
      expect(ast.operator.type).toBe(TokenType.Greater);
      expect(ast.right).toBeInstanceOf(LiteralExpr);
    });

    it("parses a greater than or equal to expression", () => {
      const tokens = [
        tok(TokenType.Number, "5", 5),
        tok(TokenType.GreaterEq, ">=", null, 1),
        tok(TokenType.Number, "3", 3, 2),
        tok(TokenType.Eof, "", null, 3),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(BinaryExpr);
      expect(ast.left).toBeInstanceOf(LiteralExpr);
      expect(ast.operator.type).toBe(TokenType.GreaterEq);
      expect(ast.right).toBeInstanceOf(LiteralExpr);
    });

    it("parses a less than expression", () => {
      const tokens = [
        tok(TokenType.Number, "5", 5),
        tok(TokenType.Less, "<", null, 1),
        tok(TokenType.Number, "3", 3, 2),
        tok(TokenType.Eof, "", null, 3),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(BinaryExpr);
      expect(ast.left).toBeInstanceOf(LiteralExpr);
      expect(ast.operator.type).toBe(TokenType.Less);
      expect(ast.right).toBeInstanceOf(LiteralExpr);
    });

    it("parses a less than or equal to expression", () => {
      const tokens = [
        tok(TokenType.Number, "5", 5),
        tok(TokenType.LessEq, "<=", null, 1),
        tok(TokenType.Number, "3", 3, 2),
        tok(TokenType.Eof, "", null, 3),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(BinaryExpr);
      expect(ast.left).toBeInstanceOf(LiteralExpr);
      expect(ast.operator.type).toBe(TokenType.LessEq);
      expect(ast.right).toBeInstanceOf(LiteralExpr);
    });

    // Equality expressions
    it("parses an equality expression", () => {
      const tokens = [
        tok(TokenType.Number, "5", 5),
        tok(TokenType.EqEq, "==", null, 1),
        tok(TokenType.Number, "5", 5, 2),
        tok(TokenType.Eof, "", null, 3),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(BinaryExpr);
      expect(ast.left).toBeInstanceOf(LiteralExpr);
      expect(ast.operator.type).toBe(TokenType.EqEq);
      expect(ast.right).toBeInstanceOf(LiteralExpr);
    });

    it("parses an inequality expression", () => {
      const tokens = [
        tok(TokenType.Number, "5", 5),
        tok(TokenType.BangEq, "!=", null, 1),
        tok(TokenType.Number, "3", 3, 2),
        tok(TokenType.Eof, "", null, 3),
      ];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(BinaryExpr);
      expect(ast.left).toBeInstanceOf(LiteralExpr);
      expect(ast.operator.type).toBe(TokenType.BangEq);
      expect(ast.right).toBeInstanceOf(LiteralExpr);
    });
  });

  describe("variable expressions", () => {
    it("parses a variable expression", () => {
      const tokens = [tok(TokenType.Identifier, "num"), tok(TokenType.Eof, "", null, 1)];
      const parser = new Parser(tokens);
      const { ast } = parser.parse();

      expect(ast).toBeInstanceOf(VarExpr);
      expect(ast.name.lexeme).toBe("num");
    });
  });
});
