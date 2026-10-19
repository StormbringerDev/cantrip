import { describe, expect, it, vi } from "vitest";

import { DiagnosticCollector } from "../src/diagnostic/collector.js";
import { interpret } from "../src/interpreter/tree-walker.js";
import { binary, grouping, literal, unary } from "../src/parser/expr.js";

import { makeSpan, tok } from "./test-helpers.js";
import { TokenType } from "../src/parser/token.js";

describe("interpreter", () => {
  describe("expressions", () => {
    describe("binary", () => {
      it("evaluates an addition expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const expr = binary(
          literal(10, makeSpan(0, 2)),
          tok(TokenType.Plus, "+", null, 3),
          literal(5, makeSpan(5, 6)),
          makeSpan(0, 6),
        );
        interpret(expr, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("15");
      });

      it("evaluates a concatenation expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const expr = binary(
          literal("Hello, ", makeSpan(0, 9)),
          tok(TokenType.Plus, "+", null, 10),
          literal("world!", makeSpan(11, 19)),
          makeSpan(0, 19),
        );
        interpret(expr, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("Hello, world!");
      });

      it("evaluates a subtraction expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const expr = binary(
          literal(10, makeSpan(0, 2)),
          tok(TokenType.Minus, "-", null, 3),
          literal(5, makeSpan(5, 6)),
          makeSpan(0, 6),
        );
        interpret(expr, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("5");
      });

      it("evaluates a multiplication expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const expr = binary(
          literal(10, makeSpan(0, 2)),
          tok(TokenType.Star, "*", null, 3),
          literal(5, makeSpan(5, 6)),
          makeSpan(0, 6),
        );
        interpret(expr, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("50");
      });

      it("evaluates a division expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const expr = binary(
          literal(10, makeSpan(0, 2)),
          tok(TokenType.Slash, "/", null, 3),
          literal(5, makeSpan(5, 6)),
          makeSpan(0, 6),
        );
        interpret(expr, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("2");
      });

      it("evaluates a modulo expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const expr = binary(
          literal(11, makeSpan(0, 2)),
          tok(TokenType.Percent, "%", null, 3),
          literal(5, makeSpan(5, 6)),
          makeSpan(0, 6),
        );
        interpret(expr, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("1");
      });

      it("evaluates a greater than expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const expr = binary(
          literal(10, makeSpan(0, 2)),
          tok(TokenType.Greater, ">", null, 3),
          literal(5, makeSpan(5, 6)),
          makeSpan(0, 6),
        );
        interpret(expr, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("true");
      });

      it("evaluates a greater equal expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const expr = binary(
          literal(10, makeSpan(0, 2)),
          tok(TokenType.GreaterEq, ">=", null, 3),
          literal(5, makeSpan(6, 7)),
          makeSpan(0, 7),
        );
        interpret(expr, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("true");
      });

      it("evaluates a less than expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const expr = binary(
          literal(10, makeSpan(0, 2)),
          tok(TokenType.Less, "<", null, 3),
          literal(5, makeSpan(5, 6)),
          makeSpan(0, 6),
        );
        interpret(expr, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("false");
      });

      it("evaluates a less equal expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const expr = binary(
          literal(10, makeSpan(0, 2)),
          tok(TokenType.LessEq, "<=", null, 3),
          literal(5, makeSpan(6, 7)),
          makeSpan(0, 7),
        );
        interpret(expr, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("false");
      });

      it("evaluates an equality expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const expr = binary(
          literal(10, makeSpan(0, 2)),
          tok(TokenType.EqEq, "==", null, 3),
          literal(5, makeSpan(6, 7)),
          makeSpan(0, 7),
        );
        interpret(expr, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("false");
      });

      it("evaluates an inequality expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const expr = binary(
          literal(10, makeSpan(0, 2)),
          tok(TokenType.BangEq, "!=", null, 3),
          literal(5, makeSpan(6, 7)),
          makeSpan(0, 7),
        );
        interpret(expr, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("true");
      });
    });

    describe("grouping", () => {
      it("evaluates a grouped expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const expr = grouping(
          binary(
            literal(40, makeSpan(1, 3)),
            tok(TokenType.Plus, "+", null, 4),
            literal(2, makeSpan(6, 7)),
            makeSpan(1, 7),
          ),
          makeSpan(0, 8),
        );
        interpret(expr, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("42");
      });
    });

    describe("literal", () => {
      it("evaluates a number literal", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const expr = literal(42, makeSpan(0, 2));
        interpret(expr, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("42");
      });

      it("evaluates a string literal", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const expr = literal("Hello!", makeSpan(0, 8));
        interpret(expr, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("Hello!");
      });

      it("evaluates literal 'true'", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const expr = literal(true, makeSpan(0, 4));
        interpret(expr, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("true");
      });

      it("evaluates literal 'false'", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const expr = literal(false, makeSpan(0, 5));
        interpret(expr, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("false");
      });

      it("evaluates literal 'nil'", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const expr = literal(null, makeSpan(0, 3));
        interpret(expr, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("nil");
      });
    });

    describe("unary", () => {
      it("evaluates a unary negation expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const expr = unary(
          tok(TokenType.Minus, "-"),
          literal(5, makeSpan(1, 2)),
          makeSpan(0, 2),
        );
        interpret(expr, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("-5");
      });

      it("evaluates a logical not expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const expr = unary(
          tok(TokenType.Bang, "!"),
          literal(true, makeSpan(1, 5)),
          makeSpan(0, 5),
        );
        interpret(expr, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("false");
      });
    });
  });
});
