import { describe, expect, it } from "vitest";
import { ParseError, Parser } from "../src/parser.js";
import {
  AssignExpr,
  BinaryExpr,
  type Expr,
  ExprStmt,
  GetExpr,
  GroupingExpr,
  IndexExpr,
  LetStmt,
  LiteralExpr,
  SetExpr,
  Token,
  TokenType,
  UnaryExpr,
  VarExpr,
} from "@cantrip/ast";
import type { Span } from "@cantrip/types";

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
  describe("expressions", () => {
    describe("literals", () => {
      it("parses a number literal", () => {
        const tokens = [
          tok(TokenType.Number, "42", 42),
          tok(TokenType.Semicolon, ";", null, 2),
          tok(TokenType.Eof, "", null, 3),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(LiteralExpr);
        expect(((ast[0] as ExprStmt).expr as LiteralExpr).value).toBe(42);
      });

      it("parses a string literal", () => {
        // Lexeme includes quotes; literal value doesn't
        const tokens = [
          tok(TokenType.String, '"Hello!"', "Hello!"),
          tok(TokenType.Semicolon, ";", null, 8),
          tok(TokenType.Eof, "", null, 9),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(LiteralExpr);
        expect(((ast[0] as ExprStmt).expr as LiteralExpr).value).toBe("Hello!");
      });

      it("parses true", () => {
        const tokens = [
          tok(TokenType.True, "true"),
          tok(TokenType.Semicolon, ";", null, 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(LiteralExpr);
        expect(((ast[0] as ExprStmt).expr as LiteralExpr).value).toBe(true);
      });

      it("parses false", () => {
        const tokens = [
          tok(TokenType.False, "false"),
          tok(TokenType.Semicolon, ";", null, 5),
          tok(TokenType.Eof, "", null, 6),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(LiteralExpr);
        expect(((ast[0] as ExprStmt).expr as LiteralExpr).value).toBe(false);
      });

      it("parses nil", () => {
        const tokens = [
          tok(TokenType.Nil, "nil"),
          tok(TokenType.Semicolon, ";", null, 3),
          tok(TokenType.Eof, "", null, 4),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(LiteralExpr);
        expect(((ast[0] as ExprStmt).expr as LiteralExpr).value).toBeNull();
      });

      it("parses an empty array literal", () => {
        const tokens = [
          tok(TokenType.LeftBracket, "["),
          tok(TokenType.RightBracket, "]", null, 1),
          tok(TokenType.Semicolon, ";", null, 2),
          tok(TokenType.Eof, "", null, 3),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(LiteralExpr);
        expect(((ast[0] as ExprStmt).expr as LiteralExpr).value).toEqual([]);
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
          tok(TokenType.Semicolon, ";", null, 7),
          tok(TokenType.Eof, "", null, 8),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(LiteralExpr);
        const expected = [
          new LiteralExpr(1, makeSpan(1, 2)),
          new LiteralExpr(2, makeSpan(3, 4)),
          new LiteralExpr(3, makeSpan(5, 6)),
        ];
        expect(((ast[0] as ExprStmt).expr as LiteralExpr).value).toEqual(expected);
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
          tok(TokenType.Semicolon, ";", null, 8),
          tok(TokenType.Eof, "", null, 9),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(LiteralExpr);
        const expected = [
          new LiteralExpr(1, makeSpan(1, 2)),
          new LiteralExpr(2, makeSpan(3, 4)),
          new LiteralExpr(3, makeSpan(5, 6)),
        ];
        expect(((ast[0] as ExprStmt).expr as LiteralExpr).value).toEqual(expected);
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
          tok(TokenType.Semicolon, ";", null, 9),
          tok(TokenType.Eof, "", null, 10),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(LiteralExpr);
        const expected = [
          new LiteralExpr(1, makeSpan(1, 2)),
          new LiteralExpr(
            [new LiteralExpr(2, makeSpan(4, 5)), new LiteralExpr(3, makeSpan(6, 7))],
            makeSpan(3, 8),
          ),
        ];
        expect(((ast[0] as ExprStmt).expr as LiteralExpr).value).toEqual(expected);
      });

      it("parses an empty object literal", () => {
        const tokens = [
          tok(TokenType.LeftBrace, "{"),
          tok(TokenType.RightBrace, "}", null, 1),
          tok(TokenType.Semicolon, ";", null, 2),
          tok(TokenType.Eof, "", null, 3),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(LiteralExpr);
        const expected = new Map<string, Expr>();
        expect(((ast[0] as ExprStmt).expr as LiteralExpr).value).toEqual(expected);
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
          tok(TokenType.Semicolon, ";", null, 22),
          tok(TokenType.Eof, "", null, 23),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(LiteralExpr);
        const expected = new Map<string, Expr>([
          ["name", new LiteralExpr("Reyek", makeSpan(6, 13))],
          ["level", new LiteralExpr(5, makeSpan(20, 21))],
        ]);
        expect(((ast[0] as ExprStmt).expr as LiteralExpr).value).toEqual(expected);
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
          tok(TokenType.Semicolon, ";", null, 23),
          tok(TokenType.Eof, "", null, 24),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(LiteralExpr);
        const expected = new Map<string, Expr>([
          ["name", new LiteralExpr("Reyek", makeSpan(6, 13))],
          ["level", new LiteralExpr(5, makeSpan(20, 21))],
        ]);
        expect(((ast[0] as ExprStmt).expr as LiteralExpr).value).toEqual(expected);
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
          tok(TokenType.Semicolon, ";", null, 50),
          tok(TokenType.Eof, "", null, 51),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(LiteralExpr);
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
        expect(((ast[0] as ExprStmt).expr as LiteralExpr).value).toEqual(expected);
      });

      it("parses an object literal with a string key", () => {
        const tokens = [
          tok(TokenType.LeftBrace, "{"),
          tok(TokenType.String, '"test-field"', "test-field", 1),
          tok(TokenType.Colon, ":", 13),
          tok(TokenType.Number, "42", 42, 14),
          tok(TokenType.RightBrace, "}", null, 16),
          tok(TokenType.Semicolon, ";", null, 17),
          tok(TokenType.Eof, "", null, 18),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(LiteralExpr);
        const expected = new Map<string, Expr>([
          ["test-field", new LiteralExpr(42, makeSpan(14, 16))],
        ]);
        expect(((ast[0] as ExprStmt).expr as LiteralExpr).value).toEqual(expected);
      });

      describe("errors", () => {
        it("pushes an error with a missing comma in array", () => {
          const tokens = [
            tok(TokenType.LeftBracket, "["),
            tok(TokenType.Number, "1", 1, 1),
            tok(TokenType.Comma, ",", null, 2),
            tok(TokenType.Number, "2", 2, 3),
            tok(TokenType.Number, "3", 3, 5),
            tok(TokenType.RightBracket, "]", null, 6),
            tok(TokenType.Semicolon, ";", null, 7),
            tok(TokenType.Eof, "", null, 8),
          ];
          const parser = new Parser(tokens);
          const { ast, parseErrors } = parser.parse();

          expect(ast).toHaveLength(1);
          expect(ast[0]).toBeNull();
          expect(parseErrors).toHaveLength(1);
          expect(parseErrors[0]).toBeInstanceOf(ParseError);
          expect(parseErrors[0].message).toBe("Expect ',' between array elements.");
        });

        it("pushes an error with a missing closing bracket", () => {
          const tokens = [
            tok(TokenType.LeftBracket, "["),
            tok(TokenType.Number, "1", 1, 1),
            tok(TokenType.Comma, ",", null, 2),
            tok(TokenType.Number, "2", 2, 3),
            tok(TokenType.Comma, ",", null, 4),
            tok(TokenType.Number, "3", 3, 5),
            tok(TokenType.Semicolon, ";", null, 6),
            tok(TokenType.Eof, "", null, 7),
          ];
          const parser = new Parser(tokens);
          const { ast, parseErrors } = parser.parse();

          expect(ast).toHaveLength(1);
          expect(ast[0]).toBeNull();
          expect(parseErrors).toHaveLength(1);
          expect(parseErrors[0]).toBeInstanceOf(ParseError);
          expect(parseErrors[0].message).toBe("Expect ']' after array literal.");
        });

        it("pushes an error with a missing comma in object", () => {
          const tokens = [
            tok(TokenType.LeftBrace, "{"),
            tok(TokenType.Identifier, "name", null, 1),
            tok(TokenType.Colon, ":", null, 5),
            tok(TokenType.String, '"Reyek"', "Reyek", 6),
            tok(TokenType.Identifier, "level", null, 13),
            tok(TokenType.Colon, ":", null, 18),
            tok(TokenType.Number, "3", 3, 19),
            tok(TokenType.RightBrace, "}", null, 20),
            tok(TokenType.Semicolon, ";", null, 21),
            tok(TokenType.Eof, "", null, 22),
          ];
          const parser = new Parser(tokens);
          const { ast, parseErrors } = parser.parse();

          expect(ast).toHaveLength(1);
          expect(ast[0]).toBeNull();
          expect(parseErrors).toHaveLength(1);
          expect(parseErrors[0]).toBeInstanceOf(ParseError);
          expect(parseErrors[0].message).toBe("Expect ',' between object fields.");
        });

        it("pushes an error with a missing field identifier", () => {
          const tokens = [
            tok(TokenType.LeftBrace, "{"),
            tok(TokenType.Identifier, "name", null, 1),
            tok(TokenType.Colon, ":", null, 5),
            tok(TokenType.String, '"Reyek"', "Reyek", 6),
            tok(TokenType.Comma, ",", null, 13),
            tok(TokenType.Colon, ":", null, 14),
            tok(TokenType.Number, "3", 3, 15),
            tok(TokenType.RightBrace, "}", null, 16),
            tok(TokenType.Semicolon, ";", null, 17),
            tok(TokenType.Eof, "", null, 18),
          ];
          const parser = new Parser(tokens);
          const { ast, parseErrors } = parser.parse();

          expect(ast).toHaveLength(1);
          expect(ast[0]).toBeNull();
          expect(parseErrors).toHaveLength(1);
          expect(parseErrors[0]).toBeInstanceOf(ParseError);
          expect(parseErrors[0].message).toBe("Expect field identifier.");
        });

        it("pushes an error with a missing colon", () => {
          const tokens = [
            tok(TokenType.LeftBrace, "{"),
            tok(TokenType.Identifier, "name", null, 1),
            tok(TokenType.Colon, ":", null, 5),
            tok(TokenType.String, '"Reyek"', "Reyek", 6),
            tok(TokenType.Comma, ",", null, 13),
            tok(TokenType.Identifier, "level", null, 14),
            tok(TokenType.Number, "3", 3, 19),
            tok(TokenType.RightBrace, "}", null, 20),
            tok(TokenType.Semicolon, ";", null, 21),
            tok(TokenType.Eof, "", null, 22),
          ];
          const parser = new Parser(tokens);
          const { ast, parseErrors } = parser.parse();

          expect(ast).toHaveLength(1);
          expect(ast[0]).toBeNull();
          expect(parseErrors).toHaveLength(1);
          expect(parseErrors[0]).toBeInstanceOf(ParseError);
          expect(parseErrors[0].message).toBe("Expect ':' after field identifier.");
        });

        it("pushes an error with a missing field value", () => {
          const tokens = [
            tok(TokenType.LeftBrace, "{"),
            tok(TokenType.Identifier, "name", null, 1),
            tok(TokenType.Colon, ":", null, 5),
            tok(TokenType.String, '"Reyek"', "Reyek", 6),
            tok(TokenType.Comma, ",", null, 13),
            tok(TokenType.Identifier, "level", null, 14),
            tok(TokenType.Colon, ":", null, 18),
            tok(TokenType.RightBrace, "}", null, 19),
            tok(TokenType.Semicolon, ";", null, 20),
            tok(TokenType.Eof, "", null, 21),
          ];
          const parser = new Parser(tokens);
          const { ast, parseErrors } = parser.parse();

          expect(ast).toHaveLength(1);
          expect(ast[0]).toBeNull();
          expect(parseErrors).toHaveLength(1);
          expect(parseErrors[0]).toBeInstanceOf(ParseError);
          expect(parseErrors[0].message).toBe("Expect expression.");
        });

        it("pushes an error with a missing closing brace", () => {
          const tokens = [
            tok(TokenType.LeftBrace, "{"),
            tok(TokenType.Identifier, "name", null, 1),
            tok(TokenType.Colon, ":", null, 5),
            tok(TokenType.String, '"Reyek"', "Reyek", 6),
            tok(TokenType.Comma, ",", null, 13),
            tok(TokenType.Identifier, "level", null, 14),
            tok(TokenType.Colon, ":", null, 18),
            tok(TokenType.Number, "3", null, 19),
            tok(TokenType.Semicolon, ";", null, 20),
            tok(TokenType.Eof, "", null, 21),
          ];
          const parser = new Parser(tokens);
          const { ast, parseErrors } = parser.parse();

          expect(ast).toHaveLength(1);
          expect(ast[0]).toBeNull();
          expect(parseErrors).toHaveLength(1);
          expect(parseErrors[0]).toBeInstanceOf(ParseError);
          expect(parseErrors[0].message).toBe("Expect '}' after object literal.");
        });
      });
    });

    describe("grouping expressions", () => {
      it("parses a grouping expression", () => {
        const tokens = [
          tok(TokenType.LeftParen, "("),
          tok(TokenType.Number, "3.14", 3.14, 1),
          tok(TokenType.RightParen, ")", null, 5),
          tok(TokenType.Semicolon, ";", null, 6),
          tok(TokenType.Eof, "", null, 7),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(GroupingExpr);
        expect(((ast[0] as ExprStmt).expr as GroupingExpr).expression).toBeInstanceOf(
          LiteralExpr,
        );
      });
    });

    describe("unary expressions", () => {
      it("parses a negation expression", () => {
        const tokens = [
          tok(TokenType.Minus, "-"),
          tok(TokenType.Number, "5", 5, 1),
          tok(TokenType.Semicolon, ";", 2),
          tok(TokenType.Eof, "", null, 3),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(UnaryExpr);
        expect(((ast[0] as ExprStmt).expr as UnaryExpr).operator.type).toBe(
          TokenType.Minus,
        );
        expect(((ast[0] as ExprStmt).expr as UnaryExpr).right).toBeInstanceOf(
          LiteralExpr,
        );
      });

      it("parses a logical not expression", () => {
        const tokens = [
          tok(TokenType.Bang, "!"),
          tok(TokenType.True, "true", null, 1),
          tok(TokenType.Semicolon, ";", null, 2),
          tok(TokenType.Eof, "", null, 3),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(UnaryExpr);
        expect(((ast[0] as ExprStmt).expr as UnaryExpr).operator.type).toBe(
          TokenType.Bang,
        );
        expect(((ast[0] as ExprStmt).expr as UnaryExpr).right).toBeInstanceOf(
          LiteralExpr,
        );
      });
    });

    describe("binary expressions", () => {
      // Term expressions
      it("parses an addition expression", () => {
        const tokens = [
          tok(TokenType.Number, "5", 5),
          tok(TokenType.Plus, "+", null, 1),
          tok(TokenType.Number, "5", 5, 2),
          tok(TokenType.Semicolon, ";", null, 3),
          tok(TokenType.Eof, "", null, 4),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(BinaryExpr);
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).left).toBeInstanceOf(
          LiteralExpr,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).operator.type).toBe(
          TokenType.Plus,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).right).toBeInstanceOf(
          LiteralExpr,
        );
      });

      it("parses a subtraction expression", () => {
        const tokens = [
          tok(TokenType.Number, "10", 10),
          tok(TokenType.Minus, "-", null, 2),
          tok(TokenType.Number, "5", 5, 3),
          tok(TokenType.Semicolon, ";", null, 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(BinaryExpr);
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).left).toBeInstanceOf(
          LiteralExpr,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).operator.type).toBe(
          TokenType.Minus,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).right).toBeInstanceOf(
          LiteralExpr,
        );
      });

      // Factor expressions
      it("parses a multiplication expression", () => {
        const tokens = [
          tok(TokenType.Number, "5", 5),
          tok(TokenType.Star, "*", null, 1),
          tok(TokenType.Number, "5", 5, 2),
          tok(TokenType.Semicolon, ";", null, 3),
          tok(TokenType.Eof, "", null, 4),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(BinaryExpr);
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).left).toBeInstanceOf(
          LiteralExpr,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).operator.type).toBe(
          TokenType.Star,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).right).toBeInstanceOf(
          LiteralExpr,
        );
      });

      it("parses a division expression", () => {
        const tokens = [
          tok(TokenType.Number, "10", 10),
          tok(TokenType.Slash, "/", null, 2),
          tok(TokenType.Number, "2", 2, 3),
          tok(TokenType.Semicolon, ";", null, 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(BinaryExpr);
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).left).toBeInstanceOf(
          LiteralExpr,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).operator.type).toBe(
          TokenType.Slash,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).right).toBeInstanceOf(
          LiteralExpr,
        );
      });

      it("parses a modulo expression", () => {
        const tokens = [
          tok(TokenType.Number, "5", 5),
          tok(TokenType.Percent, "%", null, 1),
          tok(TokenType.Number, "3", 3, 2),
          tok(TokenType.Semicolon, ";", null, 3),
          tok(TokenType.Eof, "", null, 4),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(BinaryExpr);
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).left).toBeInstanceOf(
          LiteralExpr,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).operator.type).toBe(
          TokenType.Percent,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).right).toBeInstanceOf(
          LiteralExpr,
        );
      });

      // Comparison expressions
      it("parses a greater than expression", () => {
        const tokens = [
          tok(TokenType.Number, "5", 5),
          tok(TokenType.Greater, ">", null, 1),
          tok(TokenType.Number, "3", 3, 2),
          tok(TokenType.Semicolon, ";", null, 3),
          tok(TokenType.Eof, "", null, 4),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(BinaryExpr);
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).left).toBeInstanceOf(
          LiteralExpr,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).operator.type).toBe(
          TokenType.Greater,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).right).toBeInstanceOf(
          LiteralExpr,
        );
      });

      it("parses a greater than or equal to expression", () => {
        const tokens = [
          tok(TokenType.Number, "5", 5),
          tok(TokenType.GreaterEq, ">=", null, 1),
          tok(TokenType.Number, "3", 3, 3),
          tok(TokenType.Semicolon, ";", null, 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(BinaryExpr);
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).left).toBeInstanceOf(
          LiteralExpr,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).operator.type).toBe(
          TokenType.GreaterEq,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).right).toBeInstanceOf(
          LiteralExpr,
        );
      });

      it("parses a less than expression", () => {
        const tokens = [
          tok(TokenType.Number, "5", 5),
          tok(TokenType.Less, "<", null, 1),
          tok(TokenType.Number, "3", 3, 2),
          tok(TokenType.Semicolon, ";", null, 3),
          tok(TokenType.Eof, "", null, 4),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(BinaryExpr);
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).left).toBeInstanceOf(
          LiteralExpr,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).operator.type).toBe(
          TokenType.Less,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).right).toBeInstanceOf(
          LiteralExpr,
        );
      });

      it("parses a less than or equal to expression", () => {
        const tokens = [
          tok(TokenType.Number, "5", 5),
          tok(TokenType.LessEq, "<=", null, 1),
          tok(TokenType.Number, "3", 3, 3),
          tok(TokenType.Semicolon, ";", null, 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(BinaryExpr);
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).left).toBeInstanceOf(
          LiteralExpr,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).operator.type).toBe(
          TokenType.LessEq,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).right).toBeInstanceOf(
          LiteralExpr,
        );
      });

      // Equality expressions
      it("parses an equality expression", () => {
        const tokens = [
          tok(TokenType.Number, "5", 5),
          tok(TokenType.EqEq, "==", null, 1),
          tok(TokenType.Number, "5", 5, 3),
          tok(TokenType.Semicolon, ";", null, 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(BinaryExpr);
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).left).toBeInstanceOf(
          LiteralExpr,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).operator.type).toBe(
          TokenType.EqEq,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).right).toBeInstanceOf(
          LiteralExpr,
        );
      });

      it("parses an inequality expression", () => {
        const tokens = [
          tok(TokenType.Number, "5", 5),
          tok(TokenType.BangEq, "!=", null, 1),
          tok(TokenType.Number, "3", 3, 3),
          tok(TokenType.Semicolon, ";", null, 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(BinaryExpr);
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).left).toBeInstanceOf(
          LiteralExpr,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).operator.type).toBe(
          TokenType.BangEq,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).right).toBeInstanceOf(
          LiteralExpr,
        );
      });
    });

    describe("variable expressions", () => {
      it("parses a variable expression", () => {
        const tokens = [
          tok(TokenType.Identifier, "num"),
          tok(TokenType.Semicolon, ";", null, 3),
          tok(TokenType.Eof, "", null, 4),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(VarExpr);
        expect(((ast[0] as ExprStmt).expr as VarExpr).name.lexeme).toBe("num");
      });
    });

    describe("assignment expressions", () => {
      it("parses a standard assignment expression", () => {
        const tokens = [
          tok(TokenType.Identifier, "answer"),
          tok(TokenType.Eq, "=", null, 6),
          tok(TokenType.Number, "42", 42, 7),
          tok(TokenType.Semicolon, ";", 9),
          tok(TokenType.Eof, "", null, 10),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(AssignExpr);
        expect(((ast[0] as ExprStmt).expr as AssignExpr).name.lexeme).toBe("answer");
        expect(((ast[0] as ExprStmt).expr as AssignExpr).operator.type).toBe(
          TokenType.Eq,
        );
        expect(((ast[0] as ExprStmt).expr as AssignExpr).value).toEqual(
          new LiteralExpr(42, makeSpan(7, 9)),
        );
      });

      it("parses an addition assignment expression", () => {
        const tokens = [
          tok(TokenType.Identifier, "counter"),
          tok(TokenType.PlusEq, "+=", null, 7),
          tok(TokenType.Number, "1", 1, 8),
          tok(TokenType.Semicolon, ";", 9),
          tok(TokenType.Eof, "", null, 10),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(AssignExpr);
        expect(((ast[0] as ExprStmt).expr as AssignExpr).name.lexeme).toBe("counter");
        expect(((ast[0] as ExprStmt).expr as AssignExpr).operator.type).toBe(
          TokenType.PlusEq,
        );
        expect(((ast[0] as ExprStmt).expr as AssignExpr).value).toEqual(
          new LiteralExpr(1, makeSpan(8, 9)),
        );
      });

      it("parses a subtraction assignment expression", () => {
        const tokens = [
          tok(TokenType.Identifier, "health"),
          tok(TokenType.MinusEq, "-=", null, 6),
          tok(TokenType.Number, "5", 5, 8),
          tok(TokenType.Semicolon, ";", 9),
          tok(TokenType.Eof, "", null, 10),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(AssignExpr);
        expect(((ast[0] as ExprStmt).expr as AssignExpr).name.lexeme).toBe("health");
        expect(((ast[0] as ExprStmt).expr as AssignExpr).operator.type).toBe(
          TokenType.MinusEq,
        );
        expect(((ast[0] as ExprStmt).expr as AssignExpr).value).toEqual(
          new LiteralExpr(5, makeSpan(8, 9)),
        );
      });

      it("parses a multiplication assignment expression", () => {
        const tokens = [
          tok(TokenType.Identifier, "factor"),
          tok(TokenType.StarEq, "*=", null, 6),
          tok(TokenType.Number, "5", 5, 8),
          tok(TokenType.Semicolon, ";", 9),
          tok(TokenType.Eof, "", null, 10),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(AssignExpr);
        expect(((ast[0] as ExprStmt).expr as AssignExpr).name.lexeme).toBe("factor");
        expect(((ast[0] as ExprStmt).expr as AssignExpr).operator.type).toBe(
          TokenType.StarEq,
        );
        expect(((ast[0] as ExprStmt).expr as AssignExpr).value).toEqual(
          new LiteralExpr(5, makeSpan(8, 9)),
        );
      });

      it("parses a division assignment expression", () => {
        const tokens = [
          tok(TokenType.Identifier, "half"),
          tok(TokenType.SlashEq, "/=", null, 4),
          tok(TokenType.Number, "2", 2, 6),
          tok(TokenType.Semicolon, ";", 7),
          tok(TokenType.Eof, "", null, 9),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(AssignExpr);
        expect(((ast[0] as ExprStmt).expr as AssignExpr).name.lexeme).toBe("half");
        expect(((ast[0] as ExprStmt).expr as AssignExpr).operator.type).toBe(
          TokenType.SlashEq,
        );
        expect(((ast[0] as ExprStmt).expr as AssignExpr).value).toEqual(
          new LiteralExpr(2, makeSpan(6, 7)),
        );
      });

      it("parses a modulo assignment expression", () => {
        const tokens = [
          tok(TokenType.Identifier, "remainder"),
          tok(TokenType.PercentEq, "%=", null, 9),
          tok(TokenType.Number, "3", 3, 11),
          tok(TokenType.Semicolon, ";", 12),
          tok(TokenType.Eof, "", null, 13),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(AssignExpr);
        expect(((ast[0] as ExprStmt).expr as AssignExpr).name.lexeme).toBe("remainder");
        expect(((ast[0] as ExprStmt).expr as AssignExpr).operator.type).toBe(
          TokenType.PercentEq,
        );
        expect(((ast[0] as ExprStmt).expr as AssignExpr).value).toEqual(
          new LiteralExpr(3, makeSpan(11, 12)),
        );
      });

      it("parses a set expression", () => {
        const tokens = [
          tok(TokenType.Identifier, "reyek"),
          tok(TokenType.Dot, ".", null, 6),
          tok(TokenType.Identifier, "level", null, 7),
          tok(TokenType.Eq, "=", null, 12),
          tok(TokenType.Number, "5", 5, 13),
          tok(TokenType.Semicolon, ";", null, 14),
          tok(TokenType.Eof, "", null, 15),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(SetExpr);
        expect(((ast[0] as ExprStmt).expr as SetExpr).object).toBeInstanceOf(VarExpr);
        expect(((ast[0] as ExprStmt).expr as SetExpr).name.lexeme).toBe("level");
        expect(((ast[0] as ExprStmt).expr as SetExpr).operator.type).toBe(TokenType.Eq);
        expect(((ast[0] as ExprStmt).expr as SetExpr).value).toBeInstanceOf(LiteralExpr);
      });
    });

    describe("call expressions", () => {
      it("parses a get expression", () => {
        const tokens = [
          tok(TokenType.Identifier, "reyek"),
          tok(TokenType.Dot, ".", null, 6),
          tok(TokenType.Identifier, "subclass", null, 7),
          tok(TokenType.Semicolon, ";", 15),
          tok(TokenType.Eof, "", null, 16),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(GetExpr);
        expect(((ast[0] as ExprStmt).expr as GetExpr).object).toBeInstanceOf(VarExpr);
        expect(((ast[0] as ExprStmt).expr as GetExpr).name.lexeme).toBe("subclass");
      });

      it("parses an index expression", () => {
        const tokens = [
          tok(TokenType.Identifier, "users"),
          tok(TokenType.LeftBracket, "[", null, 5),
          tok(TokenType.Number, "2", 2, 6),
          tok(TokenType.RightBracket, "]", null, 7),
          tok(TokenType.Semicolon, ";", null, 8),
          tok(TokenType.Eof, "", null, 9),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(IndexExpr);
        expect(((ast[0] as ExprStmt).expr as IndexExpr).indexee).toBeInstanceOf(VarExpr);
        expect(((ast[0] as ExprStmt).expr as IndexExpr).bracket.type).toBe(
          TokenType.LeftBracket,
        );
        expect(((ast[0] as ExprStmt).expr as IndexExpr).index).toBeInstanceOf(
          LiteralExpr,
        );
      });
    });
  });

  describe("statements", () => {
    describe("declarations", () => {
      it("parses a variable declaration", () => {
        const tokens = [
          tok(TokenType.Let, "let"),
          tok(TokenType.Identifier, "answer", null, 4),
          tok(TokenType.Semicolon, ";", null, 5),
          tok(TokenType.Eof, "", null, 6),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(LetStmt);
        expect((ast[0] as LetStmt).name.lexeme).toBe("answer");
        expect((ast[0] as LetStmt).initializer).toBeNull();
      });

      it("parses a variable declaration with an initializer", () => {
        const tokens = [
          tok(TokenType.Let, "let"),
          tok(TokenType.Identifier, "answer", null, 4),
          tok(TokenType.Eq, "=", null, 5),
          tok(TokenType.Number, "42", 42, 6),
          tok(TokenType.Semicolon, ";", null, 8),
          tok(TokenType.Eof, "", null, 9),
        ];
        const parser = new Parser(tokens);
        const { ast } = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(LetStmt);
        expect((ast[0] as LetStmt).name.lexeme).toBe("answer");
        expect((ast[0] as LetStmt).initializer).toBeInstanceOf(LiteralExpr);
      });
    });
  });
});
