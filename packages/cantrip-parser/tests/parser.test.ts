import { describe, expect, it } from "vitest";
import { Parser } from "../src/parser.js";
import {
  AssignExpr,
  BinaryExpr,
  BlockExpr,
  BlockStmt,
  BreakStmt,
  CallExpr,
  ContinueStmt,
  type Expr,
  ExprStmt,
  FunctionStmt,
  GetExpr,
  GroupingExpr,
  IfExpr,
  IndexExpr,
  IndexSetExpr,
  LetStmt,
  LiteralExpr,
  LoopExpr,
  MatchExpr,
  ReturnStmt,
  SetExpr,
  Token,
  TokenType,
  UnaryExpr,
  VarExpr,
  WhileStmt,
} from "@cantrip/ast";
import type { Span } from "@cantrip/types";
import { DiagnosticCollector } from "@cantrip/diagnostics";

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
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "42", 42),
          tok(TokenType.Semicolon, ";", null, 2),
          tok(TokenType.Eof, "", null, 3),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(LiteralExpr);
        expect(((ast[0] as ExprStmt).expr as LiteralExpr).value).toBe(42);
      });

      it("parses a string literal", () => {
        // Lexeme includes quotes; literal value doesn't
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.String, '"Hello!"', "Hello!"),
          tok(TokenType.Semicolon, ";", null, 8),
          tok(TokenType.Eof, "", null, 9),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(LiteralExpr);
        expect(((ast[0] as ExprStmt).expr as LiteralExpr).value).toBe("Hello!");
      });

      it("parses true", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.True, "true"),
          tok(TokenType.Semicolon, ";", null, 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(LiteralExpr);
        expect(((ast[0] as ExprStmt).expr as LiteralExpr).value).toBe(true);
      });

      it("parses false", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.False, "false"),
          tok(TokenType.Semicolon, ";", null, 5),
          tok(TokenType.Eof, "", null, 6),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(LiteralExpr);
        expect(((ast[0] as ExprStmt).expr as LiteralExpr).value).toBe(false);
      });

      it("parses nil", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Nil, "nil"),
          tok(TokenType.Semicolon, ";", null, 3),
          tok(TokenType.Eof, "", null, 4),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(LiteralExpr);
        expect(((ast[0] as ExprStmt).expr as LiteralExpr).value).toBeNull();
      });

      it("parses an empty array literal", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.LeftBracket, "["),
          tok(TokenType.RightBracket, "]", null, 1),
          tok(TokenType.Semicolon, ";", null, 2),
          tok(TokenType.Eof, "", null, 3),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(LiteralExpr);
        expect(((ast[0] as ExprStmt).expr as LiteralExpr).value).toEqual([]);
      });

      it("parses an array literal", () => {
        const diagnostics = new DiagnosticCollector();
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
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
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
        const diagnostics = new DiagnosticCollector();
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
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
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
        const diagnostics = new DiagnosticCollector();
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
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
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
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.LeftParen, "("),
          tok(TokenType.LeftBrace, "{", null, 1),
          tok(TokenType.RightBrace, "}", null, 2),
          tok(TokenType.RightParen, ")", null, 3),
          tok(TokenType.Semicolon, ";", null, 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(GroupingExpr);
        expect(((ast[0] as ExprStmt).expr as GroupingExpr).expression).toBeInstanceOf(
          LiteralExpr,
        );
        const expected = new Map<string, Expr>();
        expect(
          (((ast[0] as ExprStmt).expr as GroupingExpr).expression as LiteralExpr).value,
        ).toEqual(expected);
      });

      it("parses an object literal", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.LeftParen, "("),
          tok(TokenType.LeftBrace, "{", null, 1),
          tok(TokenType.Identifier, "name", null, 2),
          tok(TokenType.Colon, ":", null, 6),
          tok(TokenType.String, '"Reyek"', "Reyek", 7),
          tok(TokenType.Comma, ",", null, 14),
          tok(TokenType.Identifier, "level", null, 15),
          tok(TokenType.Colon, ":", null, 20),
          tok(TokenType.Number, "5", 5, 21),
          tok(TokenType.RightBrace, "}", null, 22),
          tok(TokenType.RightParen, ")", null, 23),
          tok(TokenType.Semicolon, ";", null, 24),
          tok(TokenType.Eof, "", null, 25),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(GroupingExpr);
        expect(((ast[0] as ExprStmt).expr as GroupingExpr).expression).toBeInstanceOf(
          LiteralExpr,
        );
        const expected = new Map<string, Expr>([
          ["name", new LiteralExpr("Reyek", makeSpan(7, 14))],
          ["level", new LiteralExpr(5, makeSpan(21, 22))],
        ]);
        expect(
          (((ast[0] as ExprStmt).expr as GroupingExpr).expression as LiteralExpr).value,
        ).toEqual(expected);
      });

      it("parses an object literal with a trailing comma", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.LeftParen, "("),
          tok(TokenType.LeftBrace, "{", null, 1),
          tok(TokenType.Identifier, "name", null, 2),
          tok(TokenType.Colon, ":", null, 6),
          tok(TokenType.String, '"Reyek"', "Reyek", 7),
          tok(TokenType.Comma, ",", null, 14),
          tok(TokenType.Identifier, "level", null, 15),
          tok(TokenType.Colon, ":", null, 20),
          tok(TokenType.Number, "5", 5, 21),
          tok(TokenType.Comma, ",", null, 22),
          tok(TokenType.RightBrace, "}", null, 23),
          tok(TokenType.RightParen, ")", null, 24),
          tok(TokenType.Semicolon, ";", null, 25),
          tok(TokenType.Eof, "", null, 26),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(GroupingExpr);
        expect(((ast[0] as ExprStmt).expr as GroupingExpr).expression).toBeInstanceOf(
          LiteralExpr,
        );
        const expected = new Map<string, Expr>([
          ["name", new LiteralExpr("Reyek", makeSpan(7, 14))],
          ["level", new LiteralExpr(5, makeSpan(21, 22))],
        ]);
        expect(
          (((ast[0] as ExprStmt).expr as GroupingExpr).expression as LiteralExpr).value,
        ).toEqual(expected);
      });

      it("parses nested object literals", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.LeftParen, "("),
          tok(TokenType.LeftBrace, "{", null, 1),
          tok(TokenType.Identifier, "name", null, 2),
          tok(TokenType.Colon, ":", null, 6),
          tok(TokenType.String, '"Reyek"', "Reyek", 7),
          tok(TokenType.Comma, ",", null, 14),
          tok(TokenType.Identifier, "savingThrows", null, 15),
          tok(TokenType.Colon, ":", null, 27),
          tok(TokenType.LeftBrace, "{", null, 28),
          tok(TokenType.Identifier, "int", null, 29),
          tok(TokenType.Colon, ":", null, 32),
          tok(TokenType.True, "true", null, 33),
          tok(TokenType.Comma, ",", null, 37),
          tok(TokenType.Identifier, "wis", null, 38),
          tok(TokenType.Colon, ":", null, 41),
          tok(TokenType.True, "true", null, 45),
          tok(TokenType.RightBrace, "}", null, 49),
          tok(TokenType.RightBrace, "}", null, 50),
          tok(TokenType.RightParen, ")", null, 51),
          tok(TokenType.Semicolon, ";", null, 52),
          tok(TokenType.Eof, "", null, 53),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(GroupingExpr);
        expect(((ast[0] as ExprStmt).expr as GroupingExpr).expression).toBeInstanceOf(
          LiteralExpr,
        );
        const expected = new Map<string, Expr>([
          ["name", new LiteralExpr("Reyek", makeSpan(7, 14))],
          [
            "savingThrows",
            new LiteralExpr(
              new Map<string, Expr>([
                ["int", new LiteralExpr(true, makeSpan(33, 37))],
                ["wis", new LiteralExpr(true, makeSpan(45, 49))],
              ]),
              makeSpan(28, 50),
            ),
          ],
        ]);
        expect(
          (((ast[0] as ExprStmt).expr as GroupingExpr).expression as LiteralExpr).value,
        ).toEqual(expected);
      });

      it("parses an object literal with a string key", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.LeftParen, "("),
          tok(TokenType.LeftBrace, "{", null, 1),
          tok(TokenType.String, '"test-field"', "test-field", 2),
          tok(TokenType.Colon, ":", 14),
          tok(TokenType.Number, "42", 42, 15),
          tok(TokenType.RightBrace, "}", null, 17),
          tok(TokenType.RightParen, ")", null, 18),
          tok(TokenType.Semicolon, ";", null, 19),
          tok(TokenType.Eof, "", null, 20),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(GroupingExpr);
        expect(((ast[0] as ExprStmt).expr as GroupingExpr).expression).toBeInstanceOf(
          LiteralExpr,
        );
        const expected = new Map<string, Expr>([
          ["test-field", new LiteralExpr(42, makeSpan(15, 17))],
        ]);
        expect(
          (((ast[0] as ExprStmt).expr as GroupingExpr).expression as LiteralExpr).value,
        ).toEqual(expected);
      });

      describe("errors", () => {
        it("pushes an error with a missing comma in array", () => {
          const diagnostics = new DiagnosticCollector();
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
          const parser = new Parser(tokens, diagnostics, "<test>");
          const ast = parser.parse();

          expect(diagnostics.hasErrors()).toBe(true);
          const diags = diagnostics.diagnostics();
          expect(diags).toHaveLength(1);
          expect(diags[0].message).toBe("Expect ',' between array elements.");
          expect(ast).toHaveLength(1);
          expect(ast[0]).toBeNull();
        });

        it("pushes an error with a missing closing bracket", () => {
          const diagnostics = new DiagnosticCollector();
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
          const parser = new Parser(tokens, diagnostics, "<test>");
          const ast = parser.parse();

          expect(diagnostics.hasErrors()).toBe(true);
          const diags = diagnostics.diagnostics();
          expect(diags).toHaveLength(1);
          expect(diags[0].message).toBe("Expect ']' after array literal.");
          expect(ast).toHaveLength(1);
          expect(ast[0]).toBeNull();
        });

        it("pushes an error with a missing comma in object", () => {
          const diagnostics = new DiagnosticCollector();
          const tokens = [
            tok(TokenType.LeftParen, "("),
            tok(TokenType.LeftBrace, "{", null, 1),
            tok(TokenType.Identifier, "name", null, 2),
            tok(TokenType.Colon, ":", null, 6),
            tok(TokenType.String, '"Reyek"', "Reyek", 7),
            tok(TokenType.Identifier, "level", null, 14),
            tok(TokenType.Colon, ":", null, 19),
            tok(TokenType.Number, "3", 3, 20),
            tok(TokenType.RightBrace, "}", null, 21),
            tok(TokenType.RightParen, ")", null, 22),
            tok(TokenType.Semicolon, ";", null, 23),
            tok(TokenType.Eof, "", null, 24),
          ];
          const parser = new Parser(tokens, diagnostics, "<test>");
          const ast = parser.parse();

          expect(diagnostics.hasErrors()).toBe(true);
          const diags = diagnostics.diagnostics();
          expect(diags).toHaveLength(1);
          expect(diags[0].message).toBe("Expect ',' between object fields.");
          expect(ast).toHaveLength(1);
          expect(ast[0]).toBeNull();
        });

        it("pushes an error with a missing field identifier", () => {
          const diagnostics = new DiagnosticCollector();
          const tokens = [
            tok(TokenType.LeftParen, "("),
            tok(TokenType.LeftBrace, "{", null, 1),
            tok(TokenType.Identifier, "name", null, 2),
            tok(TokenType.Colon, ":", null, 6),
            tok(TokenType.String, '"Reyek"', "Reyek", 7),
            tok(TokenType.Comma, ",", null, 14),
            tok(TokenType.Colon, ":", null, 15),
            tok(TokenType.Number, "3", 3, 16),
            tok(TokenType.RightBrace, "}", null, 17),
            tok(TokenType.RightParen, ")", null, 18),
            tok(TokenType.Semicolon, ";", null, 19),
            tok(TokenType.Eof, "", null, 20),
          ];
          const parser = new Parser(tokens, diagnostics, "<test>");
          const ast = parser.parse();

          expect(diagnostics.hasErrors()).toBe(true);
          const diags = diagnostics.diagnostics();
          expect(diags).toHaveLength(1);
          expect(diags[0].message).toBe("Expect field identifier.");
          expect(ast).toHaveLength(1);
          expect(ast[0]).toBeNull();
        });

        it("pushes an error with a missing colon", () => {
          const diagnostics = new DiagnosticCollector();
          const tokens = [
            tok(TokenType.LeftParen, "("),
            tok(TokenType.LeftBrace, "{", null, 1),
            tok(TokenType.Identifier, "name", null, 2),
            tok(TokenType.Colon, ":", null, 6),
            tok(TokenType.String, '"Reyek"', "Reyek", 7),
            tok(TokenType.Comma, ",", null, 14),
            tok(TokenType.Identifier, "level", null, 15),
            tok(TokenType.Number, "3", 3, 20),
            tok(TokenType.RightBrace, "}", null, 21),
            tok(TokenType.RightParen, ")", null, 22),
            tok(TokenType.Semicolon, ";", null, 23),
            tok(TokenType.Eof, "", null, 24),
          ];
          const parser = new Parser(tokens, diagnostics, "<test>");
          const ast = parser.parse();

          expect(diagnostics.hasErrors()).toBe(true);
          const diags = diagnostics.diagnostics();
          expect(diags).toHaveLength(1);
          expect(diags[0].message).toBe("Expect ':' after field identifier.");
          expect(ast).toHaveLength(1);
          expect(ast[0]).toBeNull();
        });

        it("pushes an error with a missing field value", () => {
          const diagnostics = new DiagnosticCollector();
          const tokens = [
            tok(TokenType.LeftParen, "("),
            tok(TokenType.LeftBrace, "{", null, 1),
            tok(TokenType.Identifier, "name", null, 2),
            tok(TokenType.Colon, ":", null, 6),
            tok(TokenType.String, '"Reyek"', "Reyek", 7),
            tok(TokenType.Comma, ",", null, 14),
            tok(TokenType.Identifier, "level", null, 15),
            tok(TokenType.Colon, ":", null, 19),
            tok(TokenType.RightBrace, "}", null, 20),
            tok(TokenType.RightParen, ")", null, 21),
            tok(TokenType.Semicolon, ";", null, 22),
            tok(TokenType.Eof, "", null, 23),
          ];
          const parser = new Parser(tokens, diagnostics, "<test>");
          const ast = parser.parse();

          expect(diagnostics.hasErrors()).toBe(true);
          const diags = diagnostics.diagnostics();
          expect(diags).toHaveLength(1);
          expect(diags[0].message).toBe("Expect expression.");
          expect(ast).toHaveLength(1);
          expect(ast[0]).toBeNull();
        });

        it("pushes an error with a missing closing brace", () => {
          const diagnostics = new DiagnosticCollector();
          const tokens = [
            tok(TokenType.LeftParen, "("),
            tok(TokenType.LeftBrace, "{", null, 1),
            tok(TokenType.Identifier, "name", null, 2),
            tok(TokenType.Colon, ":", null, 6),
            tok(TokenType.String, '"Reyek"', "Reyek", 7),
            tok(TokenType.Comma, ",", null, 14),
            tok(TokenType.Identifier, "level", null, 15),
            tok(TokenType.Colon, ":", null, 19),
            tok(TokenType.Number, "3", null, 20),
            tok(TokenType.Semicolon, ";", null, 21),
            tok(TokenType.Eof, "", null, 22),
          ];
          const parser = new Parser(tokens, diagnostics, "<test>");
          const ast = parser.parse();

          expect(diagnostics.hasErrors()).toBe(true);
          const diags = diagnostics.diagnostics();
          expect(diags).toHaveLength(1);
          expect(diags[0].message).toBe("Expect '}' after object literal.");
          expect(ast).toHaveLength(1);
          expect(ast[0]).toBeNull();
        });
      });
    });

    describe("grouping expressions", () => {
      const diagnostics = new DiagnosticCollector();
      it("parses a grouping expression", () => {
        const tokens = [
          tok(TokenType.LeftParen, "("),
          tok(TokenType.Number, "3.14", 3.14, 1),
          tok(TokenType.RightParen, ")", null, 5),
          tok(TokenType.Semicolon, ";", null, 6),
          tok(TokenType.Eof, "", null, 7),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
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
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Minus, "-"),
          tok(TokenType.Number, "5", 5, 1),
          tok(TokenType.Semicolon, ";", 2),
          tok(TokenType.Eof, "", null, 3),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
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
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Bang, "!"),
          tok(TokenType.True, "true", null, 1),
          tok(TokenType.Semicolon, ";", null, 2),
          tok(TokenType.Eof, "", null, 3),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
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
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "5", 5),
          tok(TokenType.Plus, "+", null, 1),
          tok(TokenType.Number, "5", 5, 2),
          tok(TokenType.Semicolon, ";", null, 3),
          tok(TokenType.Eof, "", null, 4),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
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
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "10", 10),
          tok(TokenType.Minus, "-", null, 2),
          tok(TokenType.Number, "5", 5, 3),
          tok(TokenType.Semicolon, ";", null, 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
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
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "5", 5),
          tok(TokenType.Star, "*", null, 1),
          tok(TokenType.Number, "5", 5, 2),
          tok(TokenType.Semicolon, ";", null, 3),
          tok(TokenType.Eof, "", null, 4),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
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
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "10", 10),
          tok(TokenType.Slash, "/", null, 2),
          tok(TokenType.Number, "2", 2, 3),
          tok(TokenType.Semicolon, ";", null, 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
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
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "5", 5),
          tok(TokenType.Percent, "%", null, 1),
          tok(TokenType.Number, "3", 3, 2),
          tok(TokenType.Semicolon, ";", null, 3),
          tok(TokenType.Eof, "", null, 4),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
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
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "5", 5),
          tok(TokenType.Greater, ">", null, 1),
          tok(TokenType.Number, "3", 3, 2),
          tok(TokenType.Semicolon, ";", null, 3),
          tok(TokenType.Eof, "", null, 4),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
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
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "5", 5),
          tok(TokenType.GreaterEq, ">=", null, 1),
          tok(TokenType.Number, "3", 3, 3),
          tok(TokenType.Semicolon, ";", null, 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
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
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "5", 5),
          tok(TokenType.Less, "<", null, 1),
          tok(TokenType.Number, "3", 3, 2),
          tok(TokenType.Semicolon, ";", null, 3),
          tok(TokenType.Eof, "", null, 4),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
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
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "5", 5),
          tok(TokenType.LessEq, "<=", null, 1),
          tok(TokenType.Number, "3", 3, 3),
          tok(TokenType.Semicolon, ";", null, 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens, diagnostics, "<text>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
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
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "5", 5),
          tok(TokenType.EqEq, "==", null, 1),
          tok(TokenType.Number, "5", 5, 3),
          tok(TokenType.Semicolon, ";", null, 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
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
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "5", 5),
          tok(TokenType.BangEq, "!=", null, 1),
          tok(TokenType.Number, "3", 3, 3),
          tok(TokenType.Semicolon, ";", null, 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
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

      // Logic expressions
      it("parses an 'or' expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.True, "true"),
          tok(TokenType.Or, "or", null, 5),
          tok(TokenType.False, "false", null, 8),
          tok(TokenType.Semicolon, ";", null, 13),
          tok(TokenType.Eof, "", null, 14),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(BinaryExpr);
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).left).toBeInstanceOf(
          LiteralExpr,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).operator.type).toBe(
          TokenType.Or,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).right).toBeInstanceOf(
          LiteralExpr,
        );
      });

      it("parses an 'and' expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.True, "true"),
          tok(TokenType.And, "and", null, 5),
          tok(TokenType.False, "false", null, 9),
          tok(TokenType.Semicolon, ";", null, 14),
          tok(TokenType.Eof, "", null, 15),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(BinaryExpr);
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).left).toBeInstanceOf(
          LiteralExpr,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).operator.type).toBe(
          TokenType.And,
        );
        expect(((ast[0] as ExprStmt).expr as BinaryExpr).right).toBeInstanceOf(
          LiteralExpr,
        );
      });
    });

    describe("variable expressions", () => {
      it("parses a variable expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Identifier, "num"),
          tok(TokenType.Semicolon, ";", null, 3),
          tok(TokenType.Eof, "", null, 4),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(VarExpr);
        expect(((ast[0] as ExprStmt).expr as VarExpr).name.lexeme).toBe("num");
      });
    });

    describe("assignment expressions", () => {
      it("parses a standard assignment expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Identifier, "answer"),
          tok(TokenType.Eq, "=", null, 6),
          tok(TokenType.Number, "42", 42, 7),
          tok(TokenType.Semicolon, ";", 9),
          tok(TokenType.Eof, "", null, 10),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(AssignExpr);
        expect(((ast[0] as ExprStmt).expr as AssignExpr).name.lexeme).toBe("answer");
        expect(((ast[0] as ExprStmt).expr as AssignExpr).value).toEqual(
          new LiteralExpr(42, makeSpan(7, 9)),
        );
      });

      it("parses an addition assignment expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Identifier, "counter"),
          tok(TokenType.PlusEq, "+=", null, 7),
          tok(TokenType.Number, "1", 1, 8),
          tok(TokenType.Semicolon, ";", 9),
          tok(TokenType.Eof, "", null, 10),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(AssignExpr);
        expect(((ast[0] as ExprStmt).expr as AssignExpr).name.lexeme).toBe("counter");
        expect(((ast[0] as ExprStmt).expr as AssignExpr).value).toEqual(
          new BinaryExpr(
            new VarExpr(tok(TokenType.Identifier, "counter"), makeSpan(0, 7)),
            tok(TokenType.Plus, "+"),
            new LiteralExpr(1, makeSpan(8, 9)),
            makeSpan(8, 9),
          ),
        );
      });

      it("parses a subtraction assignment expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Identifier, "health"),
          tok(TokenType.MinusEq, "-=", null, 6),
          tok(TokenType.Number, "5", 5, 8),
          tok(TokenType.Semicolon, ";", 9),
          tok(TokenType.Eof, "", null, 10),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(AssignExpr);
        expect(((ast[0] as ExprStmt).expr as AssignExpr).name.lexeme).toBe("health");
        expect(((ast[0] as ExprStmt).expr as AssignExpr).value).toEqual(
          new BinaryExpr(
            new VarExpr(tok(TokenType.Identifier, "health"), makeSpan(0, 6)),
            tok(TokenType.Minus, "-"),
            new LiteralExpr(5, makeSpan(8, 9)),
            makeSpan(8, 9),
          ),
        );
      });

      it("parses a multiplication assignment expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Identifier, "factor"),
          tok(TokenType.StarEq, "*=", null, 6),
          tok(TokenType.Number, "5", 5, 8),
          tok(TokenType.Semicolon, ";", 9),
          tok(TokenType.Eof, "", null, 10),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(AssignExpr);
        expect(((ast[0] as ExprStmt).expr as AssignExpr).name.lexeme).toBe("factor");
        expect(((ast[0] as ExprStmt).expr as AssignExpr).value).toEqual(
          new BinaryExpr(
            new VarExpr(tok(TokenType.Identifier, "factor"), makeSpan(0, 6)),
            tok(TokenType.Star, "*"),
            new LiteralExpr(5, makeSpan(8, 9)),
            makeSpan(8, 9),
          ),
        );
      });

      it("parses a division assignment expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Identifier, "half"),
          tok(TokenType.SlashEq, "/=", null, 4),
          tok(TokenType.Number, "2", 2, 6),
          tok(TokenType.Semicolon, ";", 7),
          tok(TokenType.Eof, "", null, 9),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(AssignExpr);
        expect(((ast[0] as ExprStmt).expr as AssignExpr).name.lexeme).toBe("half");
        expect(((ast[0] as ExprStmt).expr as AssignExpr).value).toEqual(
          new BinaryExpr(
            new VarExpr(tok(TokenType.Identifier, "half"), makeSpan(0, 4)),
            tok(TokenType.Slash, "/"),
            new LiteralExpr(2, makeSpan(6, 7)),
            makeSpan(6, 7),
          ),
        );
      });

      it("parses a modulo assignment expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Identifier, "remainder"),
          tok(TokenType.PercentEq, "%=", null, 9),
          tok(TokenType.Number, "3", 3, 11),
          tok(TokenType.Semicolon, ";", 12),
          tok(TokenType.Eof, "", null, 13),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(AssignExpr);
        expect(((ast[0] as ExprStmt).expr as AssignExpr).name.lexeme).toBe("remainder");
        expect(((ast[0] as ExprStmt).expr as AssignExpr).value).toEqual(
          new BinaryExpr(
            new VarExpr(tok(TokenType.Identifier, "remainder"), makeSpan(0, 9)),
            tok(TokenType.Percent, "%"),
            new LiteralExpr(3, makeSpan(11, 12)),
            makeSpan(11, 12),
          ),
        );
      });

      it("parses a set expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Identifier, "reyek"),
          tok(TokenType.Dot, ".", null, 6),
          tok(TokenType.Identifier, "level", null, 7),
          tok(TokenType.Eq, "=", null, 12),
          tok(TokenType.Number, "5", 5, 13),
          tok(TokenType.Semicolon, ";", null, 14),
          tok(TokenType.Eof, "", null, 15),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(SetExpr);
        expect(((ast[0] as ExprStmt).expr as SetExpr).object).toBeInstanceOf(VarExpr);
        expect(((ast[0] as ExprStmt).expr as SetExpr).name.lexeme).toBe("level");
        expect(((ast[0] as ExprStmt).expr as SetExpr).value).toBeInstanceOf(LiteralExpr);
      });

      it("parses an index set expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Identifier, "names"),
          tok(TokenType.LeftBracket, "[", null, 5),
          tok(TokenType.Number, "2", 2, 6),
          tok(TokenType.RightBracket, "]", null, 7),
          tok(TokenType.Eq, "=", null, 9),
          tok(TokenType.String, '"Kara"', "Kara", 11),
          tok(TokenType.Semicolon, ";", null, 17),
          tok(TokenType.Eof, "", null, 18),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(IndexSetExpr);
        expect(((ast[0] as ExprStmt).expr as IndexSetExpr).indexee).toBeInstanceOf(
          VarExpr,
        );
        expect(((ast[0] as ExprStmt).expr as IndexSetExpr).bracket.type).toBe(
          TokenType.LeftBracket,
        );
        expect(((ast[0] as ExprStmt).expr as IndexSetExpr).index).toBeInstanceOf(
          LiteralExpr,
        );
        expect(((ast[0] as ExprStmt).expr as IndexSetExpr).value).toBeInstanceOf(
          LiteralExpr,
        );
      });
    });

    describe("call expressions", () => {
      it("parses a get expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Identifier, "reyek"),
          tok(TokenType.Dot, ".", null, 6),
          tok(TokenType.Identifier, "subclass", null, 7),
          tok(TokenType.Semicolon, ";", 15),
          tok(TokenType.Eof, "", null, 16),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(GetExpr);
        expect(((ast[0] as ExprStmt).expr as GetExpr).object).toBeInstanceOf(VarExpr);
        expect(((ast[0] as ExprStmt).expr as GetExpr).name.lexeme).toBe("subclass");
      });

      it("parses an index expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Identifier, "users"),
          tok(TokenType.LeftBracket, "[", null, 5),
          tok(TokenType.Number, "2", 2, 6),
          tok(TokenType.RightBracket, "]", null, 7),
          tok(TokenType.Semicolon, ";", null, 8),
          tok(TokenType.Eof, "", null, 9),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
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

      it("parses a call expression with no arguments", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Identifier, "greetWorld"),
          tok(TokenType.LeftParen, "(", null, 11),
          tok(TokenType.RightParen, ")", null, 12),
          tok(TokenType.Semicolon, ";", null, 13),
          tok(TokenType.Eof, "", null, 14),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(CallExpr);
        expect(((ast[0] as ExprStmt).expr as CallExpr).callee).toBeInstanceOf(VarExpr);
        expect(((ast[0] as ExprStmt).expr as CallExpr).paren.type).toBe(
          TokenType.RightParen,
        );
        expect(((ast[0] as ExprStmt).expr as CallExpr).args).toHaveLength(0);
      });

      it("parses a call expression with arguments", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Identifier, "add"),
          tok(TokenType.LeftParen, "(", null, 4),
          tok(TokenType.Number, "1", 1, 5),
          tok(TokenType.Comma, ",", null, 6),
          tok(TokenType.Number, "2", 2, 8),
          tok(TokenType.RightParen, ")", null, 9),
          tok(TokenType.Semicolon, ";", null, 10),
          tok(TokenType.Eof, "", null, 11),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(CallExpr);
        expect(((ast[0] as ExprStmt).expr as CallExpr).callee).toBeInstanceOf(VarExpr);
        expect(((ast[0] as ExprStmt).expr as CallExpr).paren.type).toBe(
          TokenType.RightParen,
        );
        expect(((ast[0] as ExprStmt).expr as CallExpr).args).toHaveLength(2);
      });
    });

    describe("block expressions", () => {
      it("parses a block expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.LeftParen, "("),
          tok(TokenType.LeftBrace, "{", null, 1),
          tok(TokenType.Let, "let", null, 2),
          tok(TokenType.Identifier, "answer", null, 6),
          tok(TokenType.Eq, "=", null, 12),
          tok(TokenType.Number, "42", 42, 13),
          tok(TokenType.Semicolon, ";", null, 15),
          tok(TokenType.RightBrace, "}", null, 16),
          tok(TokenType.RightParen, ")", null, 17),
          tok(TokenType.Semicolon, ";", null, 18),
          tok(TokenType.Eof, "", null, 19),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(GroupingExpr);
        expect(((ast[0] as ExprStmt).expr as GroupingExpr).expression).toBeInstanceOf(
          BlockExpr,
        );
        expect(
          (((ast[0] as ExprStmt).expr as GroupingExpr).expression as BlockExpr)
            .statements,
        ).toHaveLength(1);
        expect(
          (((ast[0] as ExprStmt).expr as GroupingExpr).expression as BlockExpr)
            .statements[0],
        ).toBeInstanceOf(LetStmt);
        expect(
          (((ast[0] as ExprStmt).expr as GroupingExpr).expression as BlockExpr).value,
        ).toBeNull();
      });

      it("parses a block expression with a value", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.LeftParen, "("),
          tok(TokenType.LeftBrace, "{", null, 1),
          tok(TokenType.Number, "5", 5, 2),
          tok(TokenType.Plus, "+", null, 3),
          tok(TokenType.Number, "5", 5, 4),
          tok(TokenType.RightBrace, "}", null, 5),
          tok(TokenType.RightParen, ")", null, 6),
          tok(TokenType.Semicolon, ";", null, 7),
          tok(TokenType.Eof, "", null, 8),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(GroupingExpr);
        expect(((ast[0] as ExprStmt).expr as GroupingExpr).expression).toBeInstanceOf(
          BlockExpr,
        );
        expect(
          (((ast[0] as ExprStmt).expr as GroupingExpr).expression as BlockExpr)
            .statements,
        ).toHaveLength(0);
        expect(
          (((ast[0] as ExprStmt).expr as GroupingExpr).expression as BlockExpr).value,
        ).toBeInstanceOf(BinaryExpr);
      });
    });

    describe("if expressions", () => {
      it("parses an if expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.If, "if"),
          tok(TokenType.Identifier, "flag", null, 3),
          tok(TokenType.LeftBrace, "{", null, 8),
          tok(TokenType.True, "true", null, 10),
          tok(TokenType.RightBrace, "}", null, 15),
          tok(TokenType.Eof, "", null, 16),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(IfExpr);
        expect(((ast[0] as ExprStmt).expr as IfExpr).condition).toBeInstanceOf(VarExpr);
        expect(((ast[0] as ExprStmt).expr as IfExpr).thenBranch).toBeInstanceOf(
          BlockExpr,
        );
        expect(
          (((ast[0] as ExprStmt).expr as IfExpr).thenBranch as BlockExpr).statements,
        ).toHaveLength(0);
        expect(
          (((ast[0] as ExprStmt).expr as IfExpr).thenBranch as BlockExpr).value,
        ).toBeInstanceOf(LiteralExpr);
        expect(((ast[0] as ExprStmt).expr as IfExpr).elseBranch).toBeNull();
      });

      it("parses an if expression with an else clause", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.If, "if"),
          tok(TokenType.Identifier, "flag", null, 3),
          tok(TokenType.LeftBrace, "{", null, 8),
          tok(TokenType.True, "true", null, 10),
          tok(TokenType.RightBrace, "}", null, 15),
          tok(TokenType.Else, "else", null, 17),
          tok(TokenType.LeftBrace, "{", null, 22),
          tok(TokenType.False, "false", null, 24),
          tok(TokenType.RightBrace, "}", null, 30),
          tok(TokenType.Eof, "", null, 31),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(IfExpr);
        expect(((ast[0] as ExprStmt).expr as IfExpr).condition).toBeInstanceOf(VarExpr);
        expect(((ast[0] as ExprStmt).expr as IfExpr).thenBranch).toBeInstanceOf(
          BlockExpr,
        );
        expect(
          (((ast[0] as ExprStmt).expr as IfExpr).thenBranch as BlockExpr).statements,
        ).toHaveLength(0);
        expect(
          (((ast[0] as ExprStmt).expr as IfExpr).thenBranch as BlockExpr).value,
        ).toBeInstanceOf(LiteralExpr);
        expect(((ast[0] as ExprStmt).expr as IfExpr).elseBranch).toBeInstanceOf(
          BlockExpr,
        );
      });

      it("parses an if expression with an else if clause", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.If, "if"),
          tok(TokenType.Identifier, "flag1", null, 3),
          tok(TokenType.LeftBrace, "{", null, 9),
          tok(TokenType.True, "true", null, 11),
          tok(TokenType.RightBrace, "}", null, 16),
          tok(TokenType.Else, "else", null, 18),
          tok(TokenType.If, "if", null, 23),
          tok(TokenType.Identifier, "flag2", null, 26),
          tok(TokenType.LeftBrace, "{", null, 28),
          tok(TokenType.False, "false", null, 30),
          tok(TokenType.RightBrace, "}", null, 36),
          tok(TokenType.Eof, "", null, 37),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(IfExpr);
        expect(((ast[0] as ExprStmt).expr as IfExpr).condition).toBeInstanceOf(VarExpr);
        expect(((ast[0] as ExprStmt).expr as IfExpr).thenBranch).toBeInstanceOf(
          BlockExpr,
        );
        expect(
          (((ast[0] as ExprStmt).expr as IfExpr).thenBranch as BlockExpr).statements,
        ).toHaveLength(0);
        expect(
          (((ast[0] as ExprStmt).expr as IfExpr).thenBranch as BlockExpr).value,
        ).toBeInstanceOf(LiteralExpr);
        expect(((ast[0] as ExprStmt).expr as IfExpr).elseBranch).toBeInstanceOf(IfExpr);
      });
    });

    describe("loop expressions", () => {
      it("parses a loop expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Loop, "loop"),
          tok(TokenType.LeftBrace, "{", null, 5),
          tok(TokenType.Let, "let", null, 7),
          tok(TokenType.Identifier, "x", null, 11),
          tok(TokenType.Eq, "=", null, 13),
          tok(TokenType.Number, "42", 42, 15),
          tok(TokenType.Semicolon, ";", null, 17),
          tok(TokenType.RightBrace, "}", null, 19),
          tok(TokenType.Eof, "", null, 20),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(LoopExpr);
        expect(((ast[0] as ExprStmt).expr as LoopExpr).body).toBeInstanceOf(BlockExpr);
      });
    });

    describe("match expressions", () => {
      it("parses a match expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Match, "match"),
          tok(TokenType.Identifier, "x"),
          tok(TokenType.LeftBrace, "{"),
          tok(TokenType.Number, "1", 1),
          tok(TokenType.FatArrow, "=>"),
          tok(TokenType.Number, "10", 10),
          tok(TokenType.Comma, ","),
          tok(TokenType.Number, "2", 2),
          tok(TokenType.FatArrow, "=>"),
          tok(TokenType.Number, "20", 20),
          tok(TokenType.Comma, ","),
          tok(TokenType.Number, "3", 3),
          tok(TokenType.FatArrow, "=>"),
          tok(TokenType.Number, "30", 30),
          tok(TokenType.Comma, ","),
          tok(TokenType.Identifier, "_"),
          tok(TokenType.FatArrow, "=>"),
          tok(TokenType.Number, "100", 100),
          tok(TokenType.RightBrace, "}"),
          tok(TokenType.Eof, ""),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ExprStmt);
        expect((ast[0] as ExprStmt).expr).toBeInstanceOf(MatchExpr);
        expect(((ast[0] as ExprStmt).expr as MatchExpr).matcher).toBeInstanceOf(VarExpr);
        const expected = new Map<Expr, Expr>([
          [new LiteralExpr(1, makeSpan(0, 1)), new LiteralExpr(10, makeSpan(0, 2))],
          [new LiteralExpr(2, makeSpan(0, 1)), new LiteralExpr(20, makeSpan(0, 2))],
          [new LiteralExpr(3, makeSpan(0, 1)), new LiteralExpr(30, makeSpan(0, 2))],
          [
            new VarExpr(tok(TokenType.Identifier, "_"), makeSpan(0, 1)),
            new LiteralExpr(100, makeSpan(0, 3)),
          ],
        ]);
        expect(((ast[0] as ExprStmt).expr as MatchExpr).branches).toEqual(expected);
      });
    });
  });

  describe("statements", () => {
    describe("declarations", () => {
      it("parses a variable declaration", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Let, "let"),
          tok(TokenType.Identifier, "answer", null, 4),
          tok(TokenType.Semicolon, ";", null, 5),
          tok(TokenType.Eof, "", null, 6),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(LetStmt);
        expect((ast[0] as LetStmt).name.lexeme).toBe("answer");
        expect((ast[0] as LetStmt).initializer).toBeNull();
      });

      it("parses a variable declaration with an initializer", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Let, "let"),
          tok(TokenType.Identifier, "answer", null, 4),
          tok(TokenType.Eq, "=", null, 5),
          tok(TokenType.Number, "42", 42, 6),
          tok(TokenType.Semicolon, ";", null, 8),
          tok(TokenType.Eof, "", null, 9),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(LetStmt);
        expect((ast[0] as LetStmt).name.lexeme).toBe("answer");
        expect((ast[0] as LetStmt).initializer).toBeInstanceOf(LiteralExpr);
      });

      it("parses a function declaration with no parameters", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Fn, "fn"),
          tok(TokenType.Identifier, "five", null, 4),
          tok(TokenType.LeftParen, "(", null, 8),
          tok(TokenType.RightParen, ")", null, 9),
          tok(TokenType.LeftBrace, "{", null, 11),
          tok(TokenType.Number, "5", 5, 13),
          tok(TokenType.RightBrace, "}", null, 15),
          tok(TokenType.Eof, "", null, 16),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(FunctionStmt);
        expect((ast[0] as FunctionStmt).name.lexeme).toBe("five");
        expect((ast[0] as FunctionStmt).params).toHaveLength(0);
        expect((ast[0] as FunctionStmt).body).toBeInstanceOf(BlockExpr);
      });

      it("parses a function declaration with parameters", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Fn, "fn"),
          tok(TokenType.Identifier, "add", null, 4),
          tok(TokenType.LeftParen, "(", null, 7),
          tok(TokenType.Identifier, "a", null, 8),
          tok(TokenType.Comma, ",", null, 9),
          tok(TokenType.Identifier, "b", null, 11),
          tok(TokenType.RightParen, ")", null, 12),
          tok(TokenType.LeftBrace, "{", null, 14),
          tok(TokenType.Identifier, "a", null, 16),
          tok(TokenType.Plus, "+", null, 18),
          tok(TokenType.Identifier, "b", null, 20),
          tok(TokenType.RightBrace, "}", null, 22),
          tok(TokenType.Eof, "", null, 23),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(FunctionStmt);
        expect((ast[0] as FunctionStmt).name.lexeme).toBe("add");
        expect((ast[0] as FunctionStmt).params).toHaveLength(2);
        expect((ast[0] as FunctionStmt).body).toBeInstanceOf(BlockExpr);
      });
    });

    describe("blocks", () => {
      it("parses an empty block statement", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.LeftBrace, "{"),
          tok(TokenType.RightBrace, "}", null, 1),
          tok(TokenType.Eof, "", null, 2),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(BlockStmt);
        expect((ast[0] as BlockStmt).statements).toHaveLength(0);
      });

      it("parses a block statement with unterminated expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.LeftBrace, "{"),
          tok(TokenType.Number, "42", 42, 1),
          tok(TokenType.RightBrace, "}", null, 3),
          tok(TokenType.Eof, "", null, 4),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(BlockStmt);
        expect((ast[0] as BlockStmt).statements).toHaveLength(0);
      });

      it("parses a block statement with expression statement", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.LeftBrace, "{"),
          tok(TokenType.Number, "42", 42, 1),
          tok(TokenType.Semicolon, ";", null, 3),
          tok(TokenType.RightBrace, "}", null, 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(BlockStmt);
        expect((ast[0] as BlockStmt).statements).toHaveLength(1);
        expect((ast[0] as BlockStmt).statements[0]).toBeInstanceOf(ExprStmt);
      });

      it("parses a block statement with a let declaration", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.LeftBrace, "{"),
          tok(TokenType.Let, "let", null, 1),
          tok(TokenType.Identifier, "x", null, 5),
          tok(TokenType.Eq, "=", null, 6),
          tok(TokenType.Number, "1", 42, 7),
          tok(TokenType.Semicolon, ";", null, 8),
          tok(TokenType.RightBrace, "}", null, 9),
          tok(TokenType.Eof, "", null, 10),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(BlockStmt);
        expect((ast[0] as BlockStmt).statements).toHaveLength(1);
        expect((ast[0] as BlockStmt).statements[0]).toBeInstanceOf(LetStmt);
      });
    });

    describe("break & continue statements", () => {
      it("parses a break statement", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Break, "break"),
          tok(TokenType.Semicolon, ";", null, 5),
          tok(TokenType.Eof, "", null, 6),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(BreakStmt);
        expect((ast[0] as BreakStmt).keyword.type).toBe(TokenType.Break);
        expect((ast[0] as BreakStmt).value).toBeNull();
      });

      it("parses a break statement with a value", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Break, "break"),
          tok(TokenType.Number, "10", 10, 6),
          tok(TokenType.Semicolon, ";", null, 8),
          tok(TokenType.Eof, "", null, 9),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(BreakStmt);
        expect((ast[0] as BreakStmt).keyword.type).toBe(TokenType.Break);
        expect((ast[0] as BreakStmt).value).toBeInstanceOf(LiteralExpr);
      });

      it("parses a continue statement", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Continue, "continue"),
          tok(TokenType.Semicolon, ";", null, 8),
          tok(TokenType.Eof, "", null, 9),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ContinueStmt);
        expect((ast[0] as ContinueStmt).keyword.type).toBe(TokenType.Continue);
      });
    });

    describe("while loops", () => {
      it("parses a while loop", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.While, "while"),
          tok(TokenType.Identifier, "flag", null, 6),
          tok(TokenType.LeftBrace, "{", null, 8),
          tok(TokenType.Let, "let", null, 10),
          tok(TokenType.Identifier, "x", null, 14),
          tok(TokenType.Eq, "=", null, 16),
          tok(TokenType.Number, "42", 42, 18),
          tok(TokenType.Semicolon, ";", null, 20),
          tok(TokenType.RightBrace, "}", null, 22),
          tok(TokenType.Eof, "", null, 23),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(WhileStmt);
        expect((ast[0] as WhileStmt).condition).toBeInstanceOf(VarExpr);
        expect((ast[0] as WhileStmt).body).toBeInstanceOf(BlockStmt);
        expect(((ast[0] as WhileStmt).body as BlockStmt).statements).toHaveLength(1);
      });
    });

    describe("return statements", () => {
      it("parses a bare return statement", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Return, "return"),
          tok(TokenType.Semicolon, ";", null, 6),
          tok(TokenType.Eof, "", null, 7),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ReturnStmt);
        expect((ast[0] as ReturnStmt).keyword.type).toBe(TokenType.Return);
        expect((ast[0] as ReturnStmt).value).toBeNull();
      });

      it("parses a return statement with a value", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Return, "return"),
          tok(TokenType.Number, "42", 42, 7),
          tok(TokenType.Semicolon, ";", null, 8),
          tok(TokenType.Eof, "", null, 9),
        ];
        const parser = new Parser(tokens, diagnostics, "<test>");
        const ast = parser.parse();

        expect(ast).toHaveLength(1);
        expect(ast[0]).toBeInstanceOf(ReturnStmt);
        expect((ast[0] as ReturnStmt).keyword.type).toBe(TokenType.Return);
        expect((ast[0] as ReturnStmt).value).toBeInstanceOf(LiteralExpr);
      });
    });
  });
});
