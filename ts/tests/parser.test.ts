import { describe, expect, it } from "vitest";

import { DiagnosticCollector } from "../src/diagnostic/collector.js";
import type {
  Assign,
  Binary,
  BlockExpr,
  Call,
  Expr,
  Fn,
  Grouping,
  If,
  Literal,
  Unary,
  Variable,
} from "../src/parser/expr.js";
import type {
  BlockStmt,
  Break,
  Const,
  Expression,
  Let,
  Return,
  Stmt,
  While,
} from "../src/parser/stmt.js";
import { Parser } from "../src/parser/parser.js";
import { TokenType } from "../src/parser/token.js";

import { tok } from "./test-helpers.js";

describe("parser", () => {
  describe("statements", () => {
    describe("const declaration", () => {
      it("parses a const declaration", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Const, "const"),
          tok(TokenType.Identifier, "maxRuns", null, 6),
          tok(TokenType.Eq, "=", null, 14),
          tok(TokenType.Number, "10", 10, 16),
          tok(TokenType.Semicolon, ";", null, 18),
          tok(TokenType.Eof, "", null, 19),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Stmt).type).toBe("Const");
        expect((statements[0] as Const).name.lexeme).toBe("maxRuns");
        expect((statements[0] as Const).initializer.type).toBe("Literal");
      });
    });

    describe("fn declaration", () => {
      it("parses a function declaration", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Fn, "fn"),
          tok(TokenType.Identifier, "sayHello", null, 3),
          tok(TokenType.LeftParen, "(", null, 11),
          tok(TokenType.RightParen, ")", null, 12),
          tok(TokenType.LeftBrace, "{", null, 14),
          tok(TokenType.Identifier, "print", null, 16),
          tok(TokenType.LeftParen, "(", null, 21),
          tok(TokenType.String, '"Hello!"', "Hello!", 22),
          tok(TokenType.RightParen, ")", null, 30),
          tok(TokenType.Semicolon, ";", 31),
          tok(TokenType.RightBrace, "}", null, 33),
          tok(TokenType.Eof, "", null, 34),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Stmt).type).toBe("Const");
        expect((statements[0] as Const).name.lexeme).toBe("sayHello");
        expect((statements[0] as Const).initializer.type).toBe("Fn");
      });
    });

    describe("let declaration", () => {
      it("parses a let declaration", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Let, "let"),
          tok(TokenType.Identifier, "x", null, 4),
          tok(TokenType.Semicolon, ";", null, 5),
          tok(TokenType.Eof, "", null, 6),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Stmt).type).toBe("Let");
        expect((statements[0] as Let).name.lexeme).toBe("x");
        expect((statements[0] as Let).initializer).toBeNull();
      });

      it("parses a let declaration with an initializer", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Let, "let"),
          tok(TokenType.Identifier, "x", null, 4),
          tok(TokenType.Eq, "=", null, 6),
          tok(TokenType.Number, "42", 42, 8),
          tok(TokenType.Semicolon, ";", null, 10),
          tok(TokenType.Eof, "", null, 11),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Stmt).type).toBe("Let");
        expect((statements[0] as Let).name.lexeme).toBe("x");
        expect((statements[0] as Let).initializer).not.toBeNull();
      });

      it("emits an error on missing semicolon", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Let, "let"),
          tok(TokenType.Identifier, "x", null, 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(true);
        expect(statements).toHaveLength(1);
        expect(statements[0]).toBeNull();
        const diags = diagnostics.getDiagnostics();
        expect(diags).toHaveLength(1);
        expect(diags[0].severity).toBe("error");
        expect(diags[0].message).toBe("expect ';' after variable declaration");
      });
    });

    describe("block", () => {
      it("parses a block statement", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.LeftBrace, "{", null, 0),
          tok(TokenType.Let, "let", null, 2),
          tok(TokenType.Identifier, "x", null, 6),
          tok(TokenType.Eq, "=", null, 8),
          tok(TokenType.Number, "42", 42, 10),
          tok(TokenType.Semicolon, ";", null, 12),
          tok(TokenType.RightBrace, "}", null, 14),
          tok(TokenType.Eof, "", null, 15),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Stmt).type).toBe("BlockStmt");
        expect((statements[0] as BlockStmt).statements).toHaveLength(1);
      });

      it("parses a block statements and ignores final value", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.LeftBrace, "{", null, 0),
          tok(TokenType.Let, "let", null, 2),
          tok(TokenType.Identifier, "x", null, 6),
          tok(TokenType.Eq, "=", null, 8),
          tok(TokenType.Number, "10", 10, 10),
          tok(TokenType.Semicolon, ";", null, 12),
          tok(TokenType.Identifier, "x", null, 14),
          tok(TokenType.Plus, "+", null, 16),
          tok(TokenType.Number, "5", 5, 18),
          tok(TokenType.RightBrace, "}", null, 20),
          tok(TokenType.Eof, "", null, 21),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Stmt).type).toBe("BlockStmt");
        expect((statements[0] as BlockStmt).statements).toHaveLength(1);
      });

      it("emits an error on missing closing brace", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.LeftBrace, "{", null, 0),
          tok(TokenType.Let, "let", null, 2),
          tok(TokenType.Identifier, "x", null, 6),
          tok(TokenType.Eq, "=", null, 8),
          tok(TokenType.Number, "42", 42, 10),
          tok(TokenType.Semicolon, ";", null, 12),
          tok(TokenType.Eof, "", null, 13),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(true);
        expect(statements).toHaveLength(1);
        const diags = diagnostics.getDiagnostics();
        expect(diags).toHaveLength(1);
        expect(diags[0].severity).toBe("error");
        expect(diags[0].message).toBe("expect '}' after block statements");
      });
    });

    describe("break", () => {
      it("parses a break statement", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Break, "break"),
          tok(TokenType.Semicolon, ";", null, 5),
          tok(TokenType.Eof, "", null, 6),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Stmt).type).toBe("Break");
        expect((statements[0] as Break).keyword.type).toBe(TokenType.Break);
      });
    });

    describe("continue", () => {
      it("parses a continue statement", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Continue, "continue"),
          tok(TokenType.Semicolon, ";", null, 8),
          tok(TokenType.Eof, "", null, 9),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Stmt).type).toBe("Continue");
        expect((statements[0] as Break).keyword.type).toBe(TokenType.Continue);
      });
    });

    describe("expression", () => {
      it("parses an expression statement", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "40", 40),
          tok(TokenType.Plus, "+", null, 3),
          tok(TokenType.Number, "2", 2, 5),
          tok(TokenType.Semicolon, ";", null, 6),
          tok(TokenType.Eof, "", null, 7),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Stmt).type).toBe("Expression");
        expect((statements[0] as Expression).expression.type).toBe("Binary");
      });

      it("emits an error on missing semicolon", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "40", 40),
          tok(TokenType.Plus, "+", null, 3),
          tok(TokenType.Number, "2", 2, 5),
          tok(TokenType.Eof, "", null, 6),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(true);
        expect(statements).toHaveLength(1);
        expect(statements[0]).toBeNull();
        const diags = diagnostics.getDiagnostics();
        expect(diags).toHaveLength(1);
        expect(diags[0].severity).toBe("error");
        expect(diags[0].message).toBe("expect ';' after expression");
      });
    });

    describe("return", () => {
      it("parses a return statement", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Return, "return"),
          tok(TokenType.Semicolon, ";", null, 6),
          tok(TokenType.Eof, "", null, 7),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Stmt).type).toBe("Return");
        expect((statements[0] as Return).keyword.type).toBe(TokenType.Return);
        expect((statements[0] as Return).value).toBeNull();
      });

      it("parses a return statement with a value", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Return, "return"),
          tok(TokenType.Number, "42", 42, 7),
          tok(TokenType.Semicolon, ";", null, 9),
          tok(TokenType.Eof, "", null, 10),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Stmt).type).toBe("Return");
        expect((statements[0] as Return).keyword.type).toBe(TokenType.Return);
        expect(((statements[0] as Return).value as Expr).type).toBe("Literal");
      });
    });

    describe("while", () => {
      it("parses a while statement", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.While, "while"),
          tok(TokenType.True, "true", null, 6),
          tok(TokenType.LeftBrace, "{", null, 11),
          tok(TokenType.String, '"Help!"', "Help!", 13),
          tok(TokenType.RightBrace, "}", null, 20),
          tok(TokenType.Eof, "", null, 21),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Stmt).type).toBe("While");
        expect((statements[0] as While).condition.type).toBe("Literal");
        expect((statements[0] as While).body.type).toBe("BlockStmt");
      });
    });
  });

  describe("expressions", () => {
    describe("assign", () => {
      it("parses an assignment expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Identifier, "x"),
          tok(TokenType.Eq, "=", null, 3),
          tok(TokenType.Number, "42", 42, 5),
          tok(TokenType.Semicolon, ";", null, 7),
          tok(TokenType.Eof, "", null, 8),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Assign");
        expect(
          ((statements[0] as Expression).expression as Assign).name.lexeme,
        ).toBe("x");
        expect(
          ((statements[0] as Expression).expression as Assign).value.type,
        ).toBe("Literal");
      });

      it("emits an error if left side is not a variable", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.String, '"x"', "x"),
          tok(TokenType.Eq, "=", null, 4),
          tok(TokenType.Number, "42", 42, 6),
          tok(TokenType.Semicolon, ";", null, 8),
          tok(TokenType.Eof, "", null, 9),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(true);
        expect(statements).toHaveLength(1);
        const diags = diagnostics.getDiagnostics();
        expect(diags).toHaveLength(1);
        expect(diags[0].severity).toBe("error");
        expect(diags[0].message).toBe("invalid assignment target");
      });
    });

    describe("binary", () => {
      it("parses a logical or expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.True, "true"),
          tok(TokenType.Or, "or", null, 5),
          tok(TokenType.False, "false", null, 8),
          tok(TokenType.Semicolon, ";", null, 9),
          tok(TokenType.Eof, "", null, 10),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Binary");
        expect(
          ((statements[0] as Expression).expression as Binary).left.type,
        ).toBe("Literal");
        expect(
          ((statements[0] as Expression).expression as Binary).operator.type,
        ).toBe(TokenType.Or);
        expect(
          ((statements[0] as Expression).expression as Binary).right.type,
        ).toBe("Literal");
      });

      it("parses a logical and expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.False, "false"),
          tok(TokenType.And, "and", null, 6),
          tok(TokenType.False, "true", null, 10),
          tok(TokenType.Semicolon, ";", null, 14),
          tok(TokenType.Eof, "", null, 15),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Binary");
        expect(
          ((statements[0] as Expression).expression as Binary).left.type,
        ).toBe("Literal");
        expect(
          ((statements[0] as Expression).expression as Binary).operator.type,
        ).toBe(TokenType.And);
        expect(
          ((statements[0] as Expression).expression as Binary).right.type,
        ).toBe("Literal");
      });

      it("parses an equality expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "1", 1),
          tok(TokenType.EqEq, "==", null, 2),
          tok(TokenType.Number, "2", 5),
          tok(TokenType.Semicolon, ";", null, 6),
          tok(TokenType.Eof, "", null, 7),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Binary");
        expect(
          ((statements[0] as Expression).expression as Binary).left.type,
        ).toBe("Literal");
        expect(
          ((statements[0] as Expression).expression as Binary).operator.type,
        ).toBe(TokenType.EqEq);
        expect(
          ((statements[0] as Expression).expression as Binary).right.type,
        ).toBe("Literal");
      });

      it("parses an inequality expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "1", 1),
          tok(TokenType.BangEq, "!=", null, 2),
          tok(TokenType.Number, "2", 5),
          tok(TokenType.Semicolon, ";", null, 6),
          tok(TokenType.Eof, "", null, 7),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Binary");
        expect(
          ((statements[0] as Expression).expression as Binary).left.type,
        ).toBe("Literal");
        expect(
          ((statements[0] as Expression).expression as Binary).operator.type,
        ).toBe(TokenType.BangEq);
        expect(
          ((statements[0] as Expression).expression as Binary).right.type,
        ).toBe("Literal");
      });

      it("parses a greater than expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "1", 1),
          tok(TokenType.Greater, ">", null, 2),
          tok(TokenType.Number, "2", 4),
          tok(TokenType.Semicolon, ";", null, 5),
          tok(TokenType.Eof, "", null, 6),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Binary");
        expect(
          ((statements[0] as Expression).expression as Binary).left.type,
        ).toBe("Literal");
        expect(
          ((statements[0] as Expression).expression as Binary).operator.type,
        ).toBe(TokenType.Greater);
        expect(
          ((statements[0] as Expression).expression as Binary).right.type,
        ).toBe("Literal");
      });

      it("parses a greater equal expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "1", 1),
          tok(TokenType.GreaterEq, ">=", null, 2),
          tok(TokenType.Number, "2", 5),
          tok(TokenType.Semicolon, ";", null, 6),
          tok(TokenType.Eof, "", null, 7),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Binary");
        expect(
          ((statements[0] as Expression).expression as Binary).left.type,
        ).toBe("Literal");
        expect(
          ((statements[0] as Expression).expression as Binary).operator.type,
        ).toBe(TokenType.GreaterEq);
        expect(
          ((statements[0] as Expression).expression as Binary).right.type,
        ).toBe("Literal");
      });

      it("parses a less than expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "1", 1),
          tok(TokenType.Less, "<", null, 2),
          tok(TokenType.Number, "2", 4),
          tok(TokenType.Semicolon, ";", null, 5),
          tok(TokenType.Eof, "", null, 6),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Binary");
        expect(
          ((statements[0] as Expression).expression as Binary).left.type,
        ).toBe("Literal");
        expect(
          ((statements[0] as Expression).expression as Binary).operator.type,
        ).toBe(TokenType.Less);
        expect(
          ((statements[0] as Expression).expression as Binary).right.type,
        ).toBe("Literal");
      });

      it("parses a less equal expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "1", 1),
          tok(TokenType.LessEq, "<=", null, 2),
          tok(TokenType.Number, "2", 5),
          tok(TokenType.Semicolon, ";", null, 6),
          tok(TokenType.Eof, "", null, 7),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Binary");
        expect(
          ((statements[0] as Expression).expression as Binary).left.type,
        ).toBe("Literal");
        expect(
          ((statements[0] as Expression).expression as Binary).operator.type,
        ).toBe(TokenType.LessEq);
        expect(
          ((statements[0] as Expression).expression as Binary).right.type,
        ).toBe("Literal");
      });

      it("parses an addition expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "1", 1),
          tok(TokenType.Plus, "+", null, 2),
          tok(TokenType.Number, "2", 2, 4),
          tok(TokenType.Semicolon, ";", null, 5),
          tok(TokenType.Eof, "", null, 6),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Binary");
        expect(
          ((statements[0] as Expression).expression as Binary).left.type,
        ).toBe("Literal");
        expect(
          ((statements[0] as Expression).expression as Binary).operator.type,
        ).toBe(TokenType.Plus);
        expect(
          ((statements[0] as Expression).expression as Binary).right.type,
        ).toBe("Literal");
      });

      it("parses a subtraction expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "1", 1),
          tok(TokenType.Minus, "-", null, 2),
          tok(TokenType.Number, "2", 2, 4),
          tok(TokenType.Semicolon, ";", null, 5),
          tok(TokenType.Eof, "", null, 6),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Binary");
        expect(
          ((statements[0] as Expression).expression as Binary).left.type,
        ).toBe("Literal");
        expect(
          ((statements[0] as Expression).expression as Binary).operator.type,
        ).toBe(TokenType.Minus);
        expect(
          ((statements[0] as Expression).expression as Binary).right.type,
        ).toBe("Literal");
      });

      it("parses a multiplication expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "1", 1),
          tok(TokenType.Star, "*", null, 2),
          tok(TokenType.Number, "2", 2, 4),
          tok(TokenType.Semicolon, ";", null, 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Binary");
        expect(
          ((statements[0] as Expression).expression as Binary).left.type,
        ).toBe("Literal");
        expect(
          ((statements[0] as Expression).expression as Binary).operator.type,
        ).toBe(TokenType.Star);
        expect(
          ((statements[0] as Expression).expression as Binary).right.type,
        ).toBe("Literal");
      });

      it("parses a division expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "1", 1),
          tok(TokenType.Slash, "/", null, 2),
          tok(TokenType.Number, "2", 2, 4),
          tok(TokenType.Semicolon, ";", null, 5),
          tok(TokenType.Eof, "", null, 6),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Binary");
        expect(
          ((statements[0] as Expression).expression as Binary).left.type,
        ).toBe("Literal");
        expect(
          ((statements[0] as Expression).expression as Binary).operator.type,
        ).toBe(TokenType.Slash);
        expect(
          ((statements[0] as Expression).expression as Binary).right.type,
        ).toBe("Literal");
      });

      it("parses a modulo expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "1", 1),
          tok(TokenType.Percent, "%", null, 2),
          tok(TokenType.Number, "2", 4),
          tok(TokenType.Semicolon, ";", null, 5),
          tok(TokenType.Eof, "", null, 6),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Binary");
        expect(
          ((statements[0] as Expression).expression as Binary).left.type,
        ).toBe("Literal");
        expect(
          ((statements[0] as Expression).expression as Binary).operator.type,
        ).toBe(TokenType.Percent);
        expect(
          ((statements[0] as Expression).expression as Binary).right.type,
        ).toBe("Literal");
      });
    });

    describe("block", () => {
      it("parses a block expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.LeftParen, "("),
          tok(TokenType.LeftBrace, "{", null, 1),
          tok(TokenType.Let, "let", null, 3),
          tok(TokenType.Identifier, "x", null, 7),
          tok(TokenType.Eq, "=", null, 9),
          tok(TokenType.Number, "42", 42, 11),
          tok(TokenType.Semicolon, ";", null, 13),
          tok(TokenType.RightBrace, "}", null, 15),
          tok(TokenType.RightParen, ")", null, 16),
          tok(TokenType.Semicolon, ";", null, 17),
          tok(TokenType.Eof, "", null, 18),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect(
          ((statements[0] as Expression).expression as Grouping).expression
            .type,
        ).toBe("BlockExpr");
        expect(
          (
            ((statements[0] as Expression).expression as Grouping)
              .expression as BlockExpr
          ).statements,
        ).toHaveLength(1);
        expect(
          (
            ((statements[0] as Expression).expression as Grouping)
              .expression as BlockExpr
          ).value,
        ).toBeNull();
      });

      it("parses a block expression with final value", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.LeftParen, "("),
          tok(TokenType.LeftBrace, "{", null, 1),
          tok(TokenType.Let, "let", null, 3),
          tok(TokenType.Identifier, "x", null, 7),
          tok(TokenType.Eq, "=", null, 9),
          tok(TokenType.Number, "10", 10, 11),
          tok(TokenType.Semicolon, ";", null, 13),
          tok(TokenType.Identifier, "x", null, 15),
          tok(TokenType.Plus, "+", null, 17),
          tok(TokenType.Number, "5", 5, 19),
          tok(TokenType.RightBrace, "}", null, 21),
          tok(TokenType.RightParen, ")", null, 22),
          tok(TokenType.Semicolon, ";", null, 23),
          tok(TokenType.Eof, "", null, 24),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect(
          ((statements[0] as Expression).expression as Grouping).expression
            .type,
        ).toBe("BlockExpr");
        expect(
          (
            ((statements[0] as Expression).expression as Grouping)
              .expression as BlockExpr
          ).statements,
        ).toHaveLength(1);
        expect(
          (
            ((statements[0] as Expression).expression as Grouping)
              .expression as BlockExpr
          ).value,
        ).not.toBeNull();
      });

      it("emits an error on missing closing brace", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.LeftParen, "("),
          tok(TokenType.LeftBrace, "{", null, 1),
          tok(TokenType.Let, "let", null, 3),
          tok(TokenType.Identifier, "x", null, 7),
          tok(TokenType.Eq, "=", null, 9),
          tok(TokenType.Number, "42", 42, 11),
          tok(TokenType.Semicolon, ";", null, 13),
          tok(TokenType.Eof, "", null, 14),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(true);
        expect(statements).toHaveLength(1);
        const diags = diagnostics.getDiagnostics();
        expect(diags).toHaveLength(1);
        expect(diags[0].severity).toBe("error");
        expect(diags[0].message).toBe("expect '}' after block statements");
      });
    });

    describe("call", () => {
      it("parses a call expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Identifier, "time"),
          tok(TokenType.LeftParen, "(", null, 4),
          tok(TokenType.RightParen, ")", null, 5),
          tok(TokenType.Semicolon, ";", null, 6),
          tok(TokenType.Eof, "", null, 7),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Call");
        expect(
          ((statements[0] as Expression).expression as Call).callee.type,
        ).toBe("Variable");
        expect(
          ((statements[0] as Expression).expression as Call).paren.type,
        ).toBe(TokenType.RightParen);
        expect(
          ((statements[0] as Expression).expression as Call).args,
        ).toHaveLength(0);
      });

      it("parses a call expression with arguments", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Identifier, "add"),
          tok(TokenType.LeftParen, "(", null, 3),
          tok(TokenType.Number, "40", 40, 4),
          tok(TokenType.Comma, ",", null, 6),
          tok(TokenType.Number, "2", 2, 8),
          tok(TokenType.RightParen, ")", null, 9),
          tok(TokenType.Semicolon, ";", null, 10),
          tok(TokenType.Eof, "", null, 11),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Call");
        expect(
          ((statements[0] as Expression).expression as Call).callee.type,
        ).toBe("Variable");
        expect(
          ((statements[0] as Expression).expression as Call).paren.type,
        ).toBe(TokenType.RightParen);
        expect(
          ((statements[0] as Expression).expression as Call).args,
        ).toHaveLength(2);
      });

      it("parses a call expression with arguments and a trailing comma", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Identifier, "add"),
          tok(TokenType.LeftParen, "(", null, 3),
          tok(TokenType.Number, "40", 40, 4),
          tok(TokenType.Comma, ",", null, 6),
          tok(TokenType.Number, "2", 2, 8),
          tok(TokenType.Comma, ",", null, 9),
          tok(TokenType.RightParen, ")", null, 10),
          tok(TokenType.Semicolon, ";", null, 11),
          tok(TokenType.Eof, "", null, 12),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Call");
        expect(
          ((statements[0] as Expression).expression as Call).callee.type,
        ).toBe("Variable");
        expect(
          ((statements[0] as Expression).expression as Call).paren.type,
        ).toBe(TokenType.RightParen);
        expect(
          ((statements[0] as Expression).expression as Call).args,
        ).toHaveLength(2);
      });
    });

    describe("fn", () => {
      it("parses an anonymous function expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.LeftParen, "("),
          tok(TokenType.Fn, "fn", null, 1),
          tok(TokenType.LeftParen, "(", null, 3),
          tok(TokenType.RightParen, ")", null, 4),
          tok(TokenType.LeftBrace, "{", null, 6),
          tok(TokenType.Number, "5", 5, 8),
          tok(TokenType.RightBrace, "}", null, 10),
          tok(TokenType.RightParen, ")", null, 11),
          tok(TokenType.Semicolon, ";", null, 12),
          tok(TokenType.Eof, "", null, 13),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect(
          ((statements[0] as Expression).expression as Grouping).expression
            .type,
        ).toBe("Fn");
        expect(
          (
            ((statements[0] as Expression).expression as Grouping)
              .expression as Fn
          ).params,
        ).toHaveLength(0);
        expect(
          (
            ((statements[0] as Expression).expression as Grouping)
              .expression as Fn
          ).body.type,
        ).toBe("BlockExpr");
      });
    });

    describe("if", () => {
      it("parses an if expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.If, "if"),
          tok(TokenType.True, "true", null, 3),
          tok(TokenType.LeftBrace, "{", null, 8),
          tok(TokenType.Number, "5", 5, 10),
          tok(TokenType.RightBrace, "}", null, 12),
          tok(TokenType.Eof, "", null, 13),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Stmt).type).toBe("Expression");
        expect((statements[0] as Expression).expression.type).toBe("If");
        expect(
          ((statements[0] as Expression).expression as If).condition.type,
        ).toBe("Literal");
        expect(
          ((statements[0] as Expression).expression as If).thenBranch.type,
        ).toBe("BlockExpr");
        expect(
          ((statements[0] as Expression).expression as If).elseBranch,
        ).toBeNull();
      });

      it("parses an if-else expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.If, "if"),
          tok(TokenType.True, "true", null, 3),
          tok(TokenType.LeftBrace, "{", null, 8),
          tok(TokenType.Number, "5", 5, 10),
          tok(TokenType.RightBrace, "}", null, 12),
          tok(TokenType.Else, "else", null, 14),
          tok(TokenType.LeftBrace, "{", null, 19),
          tok(TokenType.Number, "8", 8, 21),
          tok(TokenType.RightBrace, "}", null, 23),
          tok(TokenType.Eof, "", null, 24),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Stmt).type).toBe("Expression");
        expect((statements[0] as Expression).expression.type).toBe("If");
        expect(
          ((statements[0] as Expression).expression as If).condition.type,
        ).toBe("Literal");
        expect(
          ((statements[0] as Expression).expression as If).thenBranch.type,
        ).toBe("BlockExpr");
        expect(
          (((statements[0] as Expression).expression as If).elseBranch as Expr)
            .type,
        ).toBe("BlockExpr");
      });

      it("parses an if-else-if expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.If, "if"),
          tok(TokenType.True, "true", null, 3),
          tok(TokenType.LeftBrace, "{", null, 8),
          tok(TokenType.Number, "5", 5, 10),
          tok(TokenType.RightBrace, "}", null, 12),
          tok(TokenType.Else, "else", null, 14),
          tok(TokenType.If, "if", null, 19),
          tok(TokenType.False, "false", null, 22),
          tok(TokenType.LeftBrace, "{", null, 28),
          tok(TokenType.Number, "8", 8, 30),
          tok(TokenType.RightBrace, "}", null, 32),
          tok(TokenType.Eof, "", null, 33),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Stmt).type).toBe("Expression");
        expect((statements[0] as Expression).expression.type).toBe("If");
        expect(
          ((statements[0] as Expression).expression as If).condition.type,
        ).toBe("Literal");
        expect(
          ((statements[0] as Expression).expression as If).thenBranch.type,
        ).toBe("BlockExpr");
        expect(
          (((statements[0] as Expression).expression as If).elseBranch as Expr)
            .type,
        ).toBe("If");
      });
    });

    describe("grouping", () => {
      it("parses a grouping expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.LeftParen, "("),
          tok(TokenType.Number, "1", 1, 1),
          tok(TokenType.Plus, "+", null, 3),
          tok(TokenType.Number, "2", 5),
          tok(TokenType.RightParen, ")", null, 6),
          tok(TokenType.Semicolon, ";", null, 7),
          tok(TokenType.Eof, "", null, 8),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Grouping");
        expect(
          ((statements[0] as Expression).expression as Grouping).expression
            .type,
        ).toBe("Binary");
      });

      it("emits an error on missing closing paren", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.LeftParen, "("),
          tok(TokenType.Number, "1", 1, 1),
          tok(TokenType.Plus, "+", null, 3),
          tok(TokenType.Number, "2", 5),
          tok(TokenType.Eof, "", null, 6),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(true);
        expect(statements).toHaveLength(1);
        expect(statements[0]).toBeNull();
        const diags = diagnostics.getDiagnostics();
        expect(diags[0].message).toBe("expect `)` after expression");
      });
    });

    describe("literal", () => {
      it("parses a number literal", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "42", 42),
          tok(TokenType.Semicolon, ";", null, 2),
          tok(TokenType.Eof, "", null, 3),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Literal");
        expect(
          ((statements[0] as Expression).expression as Literal).value,
        ).toBe(42);
      });

      it("parses a string literal", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.String, '"Hello!"', "Hello!"),
          tok(TokenType.Semicolon, ";", null, 8),
          tok(TokenType.Eof, "", null, 9),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Literal");
        expect(
          ((statements[0] as Expression).expression as Literal).value,
        ).toBe("Hello!");
      });

      it("parses literal 'true'", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.True, "true"),
          tok(TokenType.Semicolon, ";", null, 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Literal");
        expect(
          ((statements[0] as Expression).expression as Literal).value,
        ).toBe(true);
      });

      it("parses literal 'false'", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.False, "false"),
          tok(TokenType.Semicolon, ";", null, 5),
          tok(TokenType.Eof, "", null, 6),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Literal");
        expect(
          ((statements[0] as Expression).expression as Literal).value,
        ).toBe(false);
      });

      it("parses literal 'nil'", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Nil, "nil"),
          tok(TokenType.Semicolon, ";", null, 3),
          tok(TokenType.Eof, "", null, 4),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Literal");
        expect(
          ((statements[0] as Expression).expression as Literal).value,
        ).toBe(null);
      });
    });

    describe("unary", () => {
      it("parses a unary negation expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Minus, "-"),
          tok(TokenType.Number, "5", 5, 1),
          tok(TokenType.Semicolon, ";", null, 2),
          tok(TokenType.Eof, "", null, 3),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Unary");
        expect(
          ((statements[0] as Expression).expression as Unary).operator.type,
        ).toBe(TokenType.Minus);
        expect(
          ((statements[0] as Expression).expression as Unary).right.type,
        ).toBe("Literal");
      });

      it("parses a logical not expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Bang, "!"),
          tok(TokenType.True, "true", null, 1),
          tok(TokenType.Semicolon, ";", null, 5),
          tok(TokenType.Eof, "", null, 6),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Unary");
        expect(
          ((statements[0] as Expression).expression as Unary).operator.type,
        ).toBe(TokenType.Bang);
        expect(
          ((statements[0] as Expression).expression as Unary).right.type,
        ).toBe("Literal");
      });
    });

    describe("variable", () => {
      it("parses a variable expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Identifier, "total"),
          tok(TokenType.Semicolon, ";", null, 5),
          tok(TokenType.Eof, "", null, 6),
        ];
        const statements = new Parser(tokens, diagnostics).parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(statements).toHaveLength(1);
        expect((statements[0] as Expression).expression.type).toBe("Variable");
        expect(
          ((statements[0] as Expression).expression as Variable).name.lexeme,
        ).toBe("total");
      });
    });
  });

  describe("miscelaneous", () => {
    it("emits an error on missing expression", () => {
      const diagnostics = new DiagnosticCollector();
      const tokens = [
        tok(TokenType.Bang, "!"),
        tok(TokenType.Eof, "", null, 1),
      ];
      const statements = new Parser(tokens, diagnostics).parse();

      expect(diagnostics.hasError()).toBe(true);
      expect(statements).toHaveLength(1);
      expect(statements[0]).toBeNull();
      const diags = diagnostics.getDiagnostics();
      expect(diags).toHaveLength(1);
      expect(diags[0].message).toBe("expect expression");
    });
  });
});
