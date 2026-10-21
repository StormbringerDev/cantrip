import { describe, expect, it, vi } from "vitest";

import { DiagnosticCollector } from "../src/diagnostic/collector.js";
import { interpret } from "../src/interpreter/tree-walker.js";
import * as astExpr from "../src/parser/expr.js";
import * as astStmt from "../src/parser/stmt.js";

import { makeSpan, tok } from "./test-helpers.js";
import { TokenType } from "../src/parser/token.js";

describe("interpreter", () => {
  describe("stdlib", () => {
    it("prints a value to stdout", () => {
      const spy = vi.spyOn(console, "log");
      const diagnostics = new DiagnosticCollector();
      const stmt = astStmt.expression(
        astExpr.call(
          astExpr.variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
          tok(TokenType.RightParen, ")", null, 8),
          [astExpr.literal(42, makeSpan(6, 8))],
          makeSpan(0, 9),
        ),
        makeSpan(0, 10),
      );
      interpret([stmt], diagnostics);

      expect(diagnostics.hasError()).toBe(false);
      expect(spy).toHaveBeenCalledWith("42");
    });
  });

  describe("expressions", () => {
    describe("binary", () => {
      it("evaluates an equality expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const stmt = astStmt.expression(
          astExpr.call(
            astExpr.variable(
              tok(TokenType.Identifier, "print"),
              makeSpan(0, 5),
            ),
            tok(TokenType.RightParen, ")", null, 13),
            [
              astExpr.binary(
                astExpr.literal(10, makeSpan(6, 8)),
                tok(TokenType.EqEq, "==", null, 9),
                astExpr.literal(5, makeSpan(12, 13)),
                makeSpan(6, 13),
              ),
            ],
            makeSpan(0, 14),
          ),
          makeSpan(0, 15),
        );
        interpret([stmt], diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("false");
      });

      it("evaluates an inequality expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const stmt = astStmt.expression(
          astExpr.call(
            astExpr.variable(
              tok(TokenType.Identifier, "print"),
              makeSpan(0, 5),
            ),
            tok(TokenType.RightParen, ")", null, 13),
            [
              astExpr.binary(
                astExpr.literal(10, makeSpan(6, 8)),
                tok(TokenType.BangEq, "!=", null, 9),
                astExpr.literal(5, makeSpan(12, 13)),
                makeSpan(6, 13),
              ),
            ],
            makeSpan(0, 14),
          ),
          makeSpan(0, 15),
        );
        interpret([stmt], diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("true");
      });

      it("evaluates a greater than expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const stmt = astStmt.expression(
          astExpr.call(
            astExpr.variable(
              tok(TokenType.Identifier, "print"),
              makeSpan(0, 5),
            ),
            tok(TokenType.RightParen, ")", null, 12),
            [
              astExpr.binary(
                astExpr.literal(10, makeSpan(6, 8)),
                tok(TokenType.Greater, ">", null, 9),
                astExpr.literal(5, makeSpan(11, 12)),
                makeSpan(6, 12),
              ),
            ],
            makeSpan(0, 13),
          ),
          makeSpan(0, 14),
        );
        interpret([stmt], diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("true");
      });

      it("evaluates a greater equal expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const stmt = astStmt.expression(
          astExpr.call(
            astExpr.variable(
              tok(TokenType.Identifier, "print"),
              makeSpan(0, 5),
            ),
            tok(TokenType.RightParen, ")", null, 13),
            [
              astExpr.binary(
                astExpr.literal(10, makeSpan(6, 8)),
                tok(TokenType.GreaterEq, ">=", null, 9),
                astExpr.literal(5, makeSpan(12, 13)),
                makeSpan(6, 13),
              ),
            ],
            makeSpan(0, 14),
          ),
          makeSpan(0, 15),
        );
        interpret([stmt], diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("true");
      });

      it("evaluates a less than expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const stmt = astStmt.expression(
          astExpr.call(
            astExpr.variable(
              tok(TokenType.Identifier, "print"),
              makeSpan(0, 5),
            ),
            tok(TokenType.RightParen, ")", null, 12),
            [
              astExpr.binary(
                astExpr.literal(10, makeSpan(6, 8)),
                tok(TokenType.Less, "<", null, 9),
                astExpr.literal(5, makeSpan(11, 12)),
                makeSpan(6, 12),
              ),
            ],
            makeSpan(0, 13),
          ),
          makeSpan(0, 14),
        );
        interpret([stmt], diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("false");
      });

      it("evaluates a less equal expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const stmt = astStmt.expression(
          astExpr.call(
            astExpr.variable(
              tok(TokenType.Identifier, "print"),
              makeSpan(0, 5),
            ),
            tok(TokenType.RightParen, ")", null, 13),
            [
              astExpr.binary(
                astExpr.literal(10, makeSpan(6, 8)),
                tok(TokenType.LessEq, "<=", null, 9),
                astExpr.literal(5, makeSpan(12, 13)),
                makeSpan(6, 13),
              ),
            ],
            makeSpan(0, 14),
          ),
          makeSpan(0, 15),
        );
        interpret([stmt], diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("false");
      });

      it("evaluates an addition expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const stmt = astStmt.expression(
          astExpr.call(
            astExpr.variable(
              tok(TokenType.Identifier, "print"),
              makeSpan(0, 5),
            ),
            tok(TokenType.RightParen, ")", null, 12),
            [
              astExpr.binary(
                astExpr.literal(10, makeSpan(6, 8)),
                tok(TokenType.Plus, "+", null, 9),
                astExpr.literal(5, makeSpan(11, 12)),
                makeSpan(6, 12),
              ),
            ],
            makeSpan(0, 13),
          ),
          makeSpan(0, 14),
        );
        interpret([stmt], diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("15");
      });

      it("evaluates a concatenation expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const stmt = astStmt.expression(
          astExpr.call(
            astExpr.variable(
              tok(TokenType.Identifier, "print"),
              makeSpan(0, 5),
            ),
            tok(TokenType.RightParen, ")", null, 26),
            [
              astExpr.binary(
                astExpr.literal("Hello, ", makeSpan(6, 15)),
                tok(TokenType.Plus, "+", null, 16),
                astExpr.literal("world!", makeSpan(18, 26)),
                makeSpan(6, 26),
              ),
            ],
            makeSpan(0, 27),
          ),
          makeSpan(0, 28),
        );
        interpret([stmt], diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("Hello, world!");
      });

      it("evaluates a subtraction expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const stmt = astStmt.expression(
          astExpr.call(
            astExpr.variable(
              tok(TokenType.Identifier, "print"),
              makeSpan(0, 5),
            ),
            tok(TokenType.RightParen, ")", null, 12),
            [
              astExpr.binary(
                astExpr.literal(10, makeSpan(6, 8)),
                tok(TokenType.Minus, "-", null, 9),
                astExpr.literal(5, makeSpan(11, 12)),
                makeSpan(6, 12),
              ),
            ],
            makeSpan(0, 13),
          ),
          makeSpan(0, 14),
        );
        interpret([stmt], diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("5");
      });

      it("evaluates a multiplication expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const stmt = astStmt.expression(
          astExpr.call(
            astExpr.variable(
              tok(TokenType.Identifier, "print"),
              makeSpan(0, 5),
            ),
            tok(TokenType.RightParen, ")", null, 12),
            [
              astExpr.binary(
                astExpr.literal(10, makeSpan(6, 8)),
                tok(TokenType.Star, "*", null, 9),
                astExpr.literal(5, makeSpan(11, 12)),
                makeSpan(6, 12),
              ),
            ],
            makeSpan(0, 13),
          ),
          makeSpan(0, 14),
        );
        interpret([stmt], diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("50");
      });

      it("evaluates a division expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const stmt = astStmt.expression(
          astExpr.call(
            astExpr.variable(
              tok(TokenType.Identifier, "print"),
              makeSpan(0, 5),
            ),
            tok(TokenType.RightParen, ")", null, 12),
            [
              astExpr.binary(
                astExpr.literal(10, makeSpan(6, 8)),
                tok(TokenType.Slash, "/", null, 9),
                astExpr.literal(5, makeSpan(11, 12)),
                makeSpan(6, 12),
              ),
            ],
            makeSpan(0, 13),
          ),
          makeSpan(0, 14),
        );
        interpret([stmt], diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("2");
      });

      it("evaluates a modulo expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const stmt = astStmt.expression(
          astExpr.call(
            astExpr.variable(
              tok(TokenType.Identifier, "print"),
              makeSpan(0, 5),
            ),
            tok(TokenType.RightParen, ")", null, 12),
            [
              astExpr.binary(
                astExpr.literal(11, makeSpan(6, 8)),
                tok(TokenType.Percent, "%", null, 9),
                astExpr.literal(5, makeSpan(11, 12)),
                makeSpan(6, 12),
              ),
            ],
            makeSpan(0, 13),
          ),
          makeSpan(0, 14),
        );
        interpret([stmt], diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("1");
      });
    });

    describe("grouping", () => {
      it("evaluates a grouped expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const stmt = astStmt.expression(
          astExpr.call(
            astExpr.variable(
              tok(TokenType.Identifier, "print"),
              makeSpan(0, 5),
            ),
            tok(TokenType.RightParen, ")", null, 14),
            [
              astExpr.grouping(
                astExpr.binary(
                  astExpr.literal(40, makeSpan(7, 9)),
                  tok(TokenType.Plus, "+", null, 10),
                  astExpr.literal(2, makeSpan(12, 13)),
                  makeSpan(7, 13),
                ),
                makeSpan(6, 14),
              ),
            ],
            makeSpan(0, 15),
          ),
          makeSpan(0, 16),
        );
        interpret([stmt], diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("42");
      });
    });

    describe("literal", () => {
      it("evaluates a number literal", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const stmt = astStmt.expression(
          astExpr.call(
            astExpr.variable(
              tok(TokenType.Identifier, "print"),
              makeSpan(0, 5),
            ),
            tok(TokenType.RightParen, ")", null, 8),
            [astExpr.literal(42, makeSpan(6, 8))],
            makeSpan(0, 9),
          ),
          makeSpan(0, 10),
        );
        interpret([stmt], diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("42");
      });

      it("evaluates a string literal", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const stmt = astStmt.expression(
          astExpr.call(
            astExpr.variable(
              tok(TokenType.Identifier, "print"),
              makeSpan(0, 5),
            ),
            tok(TokenType.RightParen, ")", null, 14),
            [astExpr.literal("Hello!", makeSpan(6, 14))],
            makeSpan(0, 15),
          ),
          makeSpan(0, 16),
        );
        interpret([stmt], diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("Hello!");
      });

      it("evaluates literal 'true'", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const stmt = astStmt.expression(
          astExpr.call(
            astExpr.variable(
              tok(TokenType.Identifier, "print"),
              makeSpan(0, 5),
            ),
            tok(TokenType.RightParen, ")", null, 10),
            [astExpr.literal(true, makeSpan(6, 10))],
            makeSpan(0, 11),
          ),
          makeSpan(0, 12),
        );
        interpret([stmt], diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("true");
      });

      it("evaluates literal 'false'", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const stmt = astStmt.expression(
          astExpr.call(
            astExpr.variable(
              tok(TokenType.Identifier, "print"),
              makeSpan(0, 5),
            ),
            tok(TokenType.RightParen, ")", null, 11),
            [astExpr.literal(false, makeSpan(6, 11))],
            makeSpan(0, 12),
          ),
          makeSpan(0, 13),
        );
        interpret([stmt], diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("false");
      });

      it("evaluates literal 'nil'", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const stmt = astStmt.expression(
          astExpr.call(
            astExpr.variable(
              tok(TokenType.Identifier, "print"),
              makeSpan(0, 5),
            ),
            tok(TokenType.RightParen, ")", null, 9),
            [astExpr.literal(null, makeSpan(6, 9))],
            makeSpan(0, 10),
          ),
          makeSpan(0, 11),
        );
        interpret([stmt], diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("nil");
      });
    });

    describe("unary", () => {
      it("evaluates a unary negation expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const stmt = astStmt.expression(
          astExpr.call(
            astExpr.variable(
              tok(TokenType.Identifier, "print"),
              makeSpan(0, 5),
            ),
            tok(TokenType.RightParen, ")", null, 8),
            [
              astExpr.unary(
                tok(TokenType.Minus, "-", null, 6),
                astExpr.literal(5, makeSpan(7, 8)),
                makeSpan(6, 8),
              ),
            ],
            makeSpan(0, 9),
          ),
          makeSpan(0, 10),
        );
        interpret([stmt], diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("-5");
      });

      it("evaluates a logical not expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const stmt = astStmt.expression(
          astExpr.call(
            astExpr.variable(
              tok(TokenType.Identifier, "print"),
              makeSpan(0, 5),
            ),
            tok(TokenType.RightParen, ")", null, 11),
            [
              astExpr.unary(
                tok(TokenType.Bang, "!", null, 6),
                astExpr.literal(true, makeSpan(7, 11)),
                makeSpan(6, 11),
              ),
            ],
            makeSpan(0, 12),
          ),
          makeSpan(0, 13),
        );
        interpret([stmt], diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("false");
      });
    });
  });
});
