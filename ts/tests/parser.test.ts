import { describe, expect, it } from "vitest";

import { DiagnosticCollector } from "../src/diagnostic/collector.js";
import type {
  Binary,
  Expr,
  Grouping,
  Literal,
  Unary,
} from "../src/parser/expr.js";
import { Parser } from "../src/parser/parser.js";
import { TokenType } from "../src/parser/token.js";

import { tok } from "./test-helpers.js";

describe("parser", () => {
  describe("expressions", () => {
    describe("binary", () => {
      it("parses an addition expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "1", 1),
          tok(TokenType.Plus, "+", null, 2),
          tok(TokenType.Number, "2", 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens, diagnostics);
        const ast = parser.parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(ast).not.toBeNull();
        expect((ast as Expr).type).toBe("Binary");
        expect((ast as Binary).left.type).toBe("Literal");
        expect((ast as Binary).operator.type).toBe(TokenType.Plus);
        expect((ast as Binary).right.type).toBe("Literal");
      });

      it("parses a subtraction expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "1", 1),
          tok(TokenType.Minus, "-", null, 2),
          tok(TokenType.Number, "2", 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens, diagnostics);
        const ast = parser.parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(ast).not.toBeNull();
        expect((ast as Expr).type).toBe("Binary");
        expect((ast as Binary).left.type).toBe("Literal");
        expect((ast as Binary).operator.type).toBe(TokenType.Minus);
        expect((ast as Binary).right.type).toBe("Literal");
      });

      it("parses a multiplication expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "1", 1),
          tok(TokenType.Star, "*", null, 2),
          tok(TokenType.Number, "2", 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens, diagnostics);
        const ast = parser.parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(ast).not.toBeNull();
        expect((ast as Expr).type).toBe("Binary");
        expect((ast as Binary).left.type).toBe("Literal");
        expect((ast as Binary).operator.type).toBe(TokenType.Star);
        expect((ast as Binary).right.type).toBe("Literal");
      });

      it("parses a division expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "1", 1),
          tok(TokenType.Slash, "/", null, 2),
          tok(TokenType.Number, "2", 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens, diagnostics);
        const ast = parser.parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(ast).not.toBeNull();
        expect((ast as Expr).type).toBe("Binary");
        expect((ast as Binary).left.type).toBe("Literal");
        expect((ast as Binary).operator.type).toBe(TokenType.Slash);
        expect((ast as Binary).right.type).toBe("Literal");
      });

      it("parses a modulo expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "1", 1),
          tok(TokenType.Percent, "%", null, 2),
          tok(TokenType.Number, "2", 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens, diagnostics);
        const ast = parser.parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(ast).not.toBeNull();
        expect((ast as Expr).type).toBe("Binary");
        expect((ast as Binary).left.type).toBe("Literal");
        expect((ast as Binary).operator.type).toBe(TokenType.Percent);
        expect((ast as Binary).right.type).toBe("Literal");
      });

      it("parses an equality expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "1", 1),
          tok(TokenType.EqEq, "==", null, 2),
          tok(TokenType.Number, "2", 5),
          tok(TokenType.Eof, "", null, 6),
        ];
        const parser = new Parser(tokens, diagnostics);
        const ast = parser.parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(ast).not.toBeNull();
        expect((ast as Expr).type).toBe("Binary");
        expect((ast as Binary).left.type).toBe("Literal");
        expect((ast as Binary).operator.type).toBe(TokenType.EqEq);
        expect((ast as Binary).right.type).toBe("Literal");
      });

      it("parses an inequality expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "1", 1),
          tok(TokenType.BangEq, "!=", null, 2),
          tok(TokenType.Number, "2", 5),
          tok(TokenType.Eof, "", null, 6),
        ];
        const parser = new Parser(tokens, diagnostics);
        const ast = parser.parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(ast).not.toBeNull();
        expect((ast as Expr).type).toBe("Binary");
        expect((ast as Binary).left.type).toBe("Literal");
        expect((ast as Binary).operator.type).toBe(TokenType.BangEq);
        expect((ast as Binary).right.type).toBe("Literal");
      });

      it("parses a greater than expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "1", 1),
          tok(TokenType.Greater, ">", null, 2),
          tok(TokenType.Number, "2", 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens, diagnostics);
        const ast = parser.parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(ast).not.toBeNull();
        expect((ast as Expr).type).toBe("Binary");
        expect((ast as Binary).left.type).toBe("Literal");
        expect((ast as Binary).operator.type).toBe(TokenType.Greater);
        expect((ast as Binary).right.type).toBe("Literal");
      });

      it("parses a greater equal expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "1", 1),
          tok(TokenType.GreaterEq, ">=", null, 2),
          tok(TokenType.Number, "2", 5),
          tok(TokenType.Eof, "", null, 6),
        ];
        const parser = new Parser(tokens, diagnostics);
        const ast = parser.parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(ast).not.toBeNull();
        expect((ast as Expr).type).toBe("Binary");
        expect((ast as Binary).left.type).toBe("Literal");
        expect((ast as Binary).operator.type).toBe(TokenType.GreaterEq);
        expect((ast as Binary).right.type).toBe("Literal");
      });

      it("parses a less than expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "1", 1),
          tok(TokenType.Less, "<", null, 2),
          tok(TokenType.Number, "2", 4),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens, diagnostics);
        const ast = parser.parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(ast).not.toBeNull();
        expect((ast as Expr).type).toBe("Binary");
        expect((ast as Binary).left.type).toBe("Literal");
        expect((ast as Binary).operator.type).toBe(TokenType.Less);
        expect((ast as Binary).right.type).toBe("Literal");
      });

      it("parses a less equal expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "1", 1),
          tok(TokenType.LessEq, "<=", null, 2),
          tok(TokenType.Number, "2", 5),
          tok(TokenType.Eof, "", null, 6),
        ];
        const parser = new Parser(tokens, diagnostics);
        const ast = parser.parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(ast).not.toBeNull();
        expect((ast as Expr).type).toBe("Binary");
        expect((ast as Binary).left.type).toBe("Literal");
        expect((ast as Binary).operator.type).toBe(TokenType.LessEq);
        expect((ast as Binary).right.type).toBe("Literal");
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
          tok(TokenType.Eof, "", null, 7),
        ];
        const parser = new Parser(tokens, diagnostics);
        const ast = parser.parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(ast).not.toBeNull();
        expect((ast as Expr).type).toBe("Grouping");
        expect((ast as Grouping).expression.type).toBe("Binary");
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
        const parser = new Parser(tokens, diagnostics);
        const ast = parser.parse();

        expect(diagnostics.hasError()).toBe(true);
        expect(ast).toBeNull();
        const diags = diagnostics.getDiagnostics();
        expect(diags).toHaveLength(1);
        expect(diags[0].message).toBe("expect `)` after expression");
      });
    });

    describe("literal", () => {
      it("parses a number literal", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Number, "42", 42),
          tok(TokenType.Eof, "", null, 2),
        ];
        const parser = new Parser(tokens, diagnostics);
        const ast = parser.parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(ast).not.toBeNull();
        expect((ast as Expr).type).toBe("Literal");
        expect((ast as Literal).value).toBe(42);
      });

      it("parses a string literal", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.String, '"Hello!"', "Hello!"),
          tok(TokenType.Eof, "", null, 8),
        ];
        const parser = new Parser(tokens, diagnostics);
        const ast = parser.parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(ast).not.toBeNull();
        expect((ast as Expr).type).toBe("Literal");
        expect((ast as Literal).value).toBe("Hello!");
      });

      it("parses literal 'true'", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.True, "true"),
          tok(TokenType.Eof, "", null, 4),
        ];
        const parser = new Parser(tokens, diagnostics);
        const ast = parser.parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(ast).not.toBeNull();
        expect((ast as Expr).type).toBe("Literal");
        expect((ast as Literal).value).toBe(true);
      });

      it("parses literal 'false'", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.False, "false"),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens, diagnostics);
        const ast = parser.parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(ast).not.toBeNull();
        expect((ast as Expr).type).toBe("Literal");
        expect((ast as Literal).value).toBe(false);
      });

      it("parses literal 'nil'", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Nil, "nil"),
          tok(TokenType.Eof, "", null, 3),
        ];
        const parser = new Parser(tokens, diagnostics);
        const ast = parser.parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(ast).not.toBeNull();
        expect((ast as Expr).type).toBe("Literal");
        expect((ast as Literal).value).toBe(null);
      });
    });

    describe("unary", () => {
      it("parses a unary negation expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Minus, "-"),
          tok(TokenType.Number, "5", 5, 1),
          tok(TokenType.Eof, "", null, 2),
        ];
        const parser = new Parser(tokens, diagnostics);
        const ast = parser.parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(ast).not.toBeNull();
        expect((ast as Expr).type).toBe("Unary");
        expect((ast as Unary).operator.type).toBe(TokenType.Minus);
        expect((ast as Unary).right.type).toBe("Literal");
      });

      it("parses a logical not expression", () => {
        const diagnostics = new DiagnosticCollector();
        const tokens = [
          tok(TokenType.Bang, "!"),
          tok(TokenType.True, "true", null, 1),
          tok(TokenType.Eof, "", null, 5),
        ];
        const parser = new Parser(tokens, diagnostics);
        const ast = parser.parse();

        expect(diagnostics.hasError()).toBe(false);
        expect(ast).not.toBeNull();
        expect((ast as Expr).type).toBe("Unary");
        expect((ast as Unary).operator.type).toBe(TokenType.Bang);
        expect((ast as Unary).right.type).toBe("Literal");
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
      const parser = new Parser(tokens, diagnostics);
      const ast = parser.parse();

      expect(diagnostics.hasError()).toBe(true);
      expect(ast).toBeNull();
      const diags = diagnostics.getDiagnostics();
      expect(diags).toHaveLength(1);
      expect(diags[0].message).toBe("expect expression");
    });
  });
});
