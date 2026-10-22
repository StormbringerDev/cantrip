import { describe, expect, it, vi } from "vitest";

import { DiagnosticCollector } from "../src/diagnostic/collector.js";
import {
  BreakException,
  ContinueException,
} from "../src/interpreter/exceptions.js";
import * as stdlib from "../src/interpreter/stdlib.js";
import { interpret } from "../src/interpreter/tree-walker.js";
import {
  call,
  type Expr,
  variable,
  literal,
  binary,
  assign,
  grouping,
  unary,
  blockExpr,
} from "../src/parser/expr.js";
import {
  blockStmt,
  break_,
  const_,
  continue_,
  expression,
  let_,
  type Stmt,
  while_,
} from "../src/parser/stmt.js";
import { TokenType } from "../src/parser/token.js";

import { makeSpan, tok } from "./test-helpers.js";

describe("interpreter", () => {
  describe("stdlib", () => {
    describe("print", () => {
      it("prints a value to stdout", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements: Stmt[] = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 8),
              [literal(42, makeSpan(6, 8))],
              makeSpan(0, 9),
            ),
            makeSpan(0, 10),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("42");
      });

      it("returns unit type", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 15),
              [
                call(
                  variable(
                    tok(TokenType.Identifier, "print", null, 6),
                    makeSpan(6, 11),
                  ),
                  tok(TokenType.RightParen, ")", null, 14),
                  [literal("", makeSpan(12, 14))],
                  makeSpan(6, 15),
                ),
              ],
              makeSpan(0, 16),
            ),
            makeSpan(0, 17),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("()");
      });
    });

    describe("time", () => {
      it("returns miliseconds since unix epoch", () => {
        vi.setSystemTime(new Date("2026-10-20T12:00:00Z"));
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements: Stmt[] = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 12),
              [
                call(
                  variable(
                    tok(TokenType.Identifier, "time", null, 6),
                    makeSpan(6, 10),
                  ),
                  tok(TokenType.RightParen, ")", null, 11),
                  [],
                  makeSpan(6, 12),
                ),
              ],
              makeSpan(0, 13),
            ),
            makeSpan(0, 14),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        const expected = new Date("2026-10-20T12:00:00Z").getTime();
        expect(spy).toHaveBeenCalledWith(`${expected}`);
      });
    });
  });

  describe("statements", () => {
    describe("const declaration", () => {
      it("declares a new constant", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements: Stmt[] = [
          const_(
            tok(TokenType.Identifier, "x", null, 6),
            literal(5, makeSpan(10, 11)),
            makeSpan(0, 12),
          ),
          expression(
            call(
              variable(
                tok(TokenType.Identifier, "print", null, 13),
                makeSpan(13, 18),
              ),
              tok(TokenType.RightParen, ")", null, 20),
              [
                variable(
                  tok(TokenType.Identifier, "x", null, 19),
                  makeSpan(19, 20),
                ),
              ],
              makeSpan(13, 21),
            ),
            makeSpan(13, 21),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("5");
      });
    });

    describe("let declaration", () => {
      it("declares a new variable", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements: Stmt[] = [
          let_(tok(TokenType.Identifier, "x", null, 4), null, makeSpan(0, 6)),
          expression(
            call(
              variable(
                tok(TokenType.Identifier, "print", null, 7),
                makeSpan(7, 12),
              ),
              tok(TokenType.RightParen, ")", null, 14),
              [
                variable(
                  tok(TokenType.Identifier, "x", null, 13),
                  makeSpan(13, 14),
                ),
              ],
              makeSpan(7, 15),
            ),
            makeSpan(7, 16),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("()");
      });

      it("declares and initializes a new variable", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements: Stmt[] = [
          let_(
            tok(TokenType.Identifier, "x", null, 4),
            literal(5, makeSpan(8, 9)),
            makeSpan(0, 10),
          ),
          expression(
            call(
              variable(
                tok(TokenType.Identifier, "print", null, 11),
                makeSpan(11, 16),
              ),
              tok(TokenType.RightParen, ")", null, 18),
              [
                variable(
                  tok(TokenType.Identifier, "x", null, 17),
                  makeSpan(17, 18),
                ),
              ],
              makeSpan(11, 18),
            ),
            makeSpan(11, 19),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("5");
      });
    });

    describe("block", () => {
      it("executes a block statement", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const local = variable(
          tok(TokenType.Identifier, "x", null, 19),
          makeSpan(19, 20),
        );
        const statements: Stmt[] = [
          blockStmt(
            [
              let_(
                tok(TokenType.Identifier, "x", null, 7),
                literal(42, makeSpan(9, 11)),
                makeSpan(2, 12),
              ),
              expression(
                call(
                  variable(
                    tok(TokenType.Identifier, "print", null, 13),
                    makeSpan(13, 18),
                  ),
                  tok(TokenType.RightParen, ")", null, 20),
                  [local],
                  makeSpan(13, 21),
                ),
                makeSpan(13, 22),
              ),
            ],
            makeSpan(0, 24),
          ),
        ];
        const locals = new Map<Expr, number>([[local, 0]]);
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("42");
      });
    });

    describe("break", () => {
      it("executes a break statement", () => {
        const diagnostics = new DiagnosticCollector();
        const statements: Stmt[] = [
          break_(tok(TokenType.Break, "break"), makeSpan(0, 6)),
        ];
        const locals = new Map<Expr, number>();
        expect(() => interpret(statements, locals, diagnostics)).toThrow(
          BreakException,
        );
      });
    });

    describe("continue", () => {
      it("executes a continue statement", () => {
        const diagnostics = new DiagnosticCollector();
        const statements: Stmt[] = [
          continue_(tok(TokenType.Continue, "continue"), makeSpan(0, 9)),
        ];
        const locals = new Map<Expr, number>();
        expect(() => interpret(statements, locals, diagnostics)).toThrow(
          ContinueException,
        );
      });
    });

    describe("while", () => {
      it("executes a while statement", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements: Stmt[] = [
          let_(
            tok(TokenType.Identifier, "i", null, 4),
            literal(0, makeSpan(8, 9)),
            makeSpan(0, 10),
          ),
          while_(
            binary(
              variable(
                tok(TokenType.Identifier, "i", null, 17),
                makeSpan(17, 18),
              ),
              tok(TokenType.Less, "<", null, 19),
              literal(5, makeSpan(21, 22)),
              makeSpan(17, 22),
            ),
            blockStmt(
              [
                expression(
                  assign(
                    tok(TokenType.Identifier, "i", null, 25),
                    binary(
                      variable(
                        tok(TokenType.Identifier, "i", null, 29),
                        makeSpan(29, 30),
                      ),
                      tok(TokenType.Plus, "+", null, 31),
                      literal(1, makeSpan(33, 34)),
                      makeSpan(29, 34),
                    ),
                    makeSpan(25, 34),
                  ),
                  makeSpan(25, 35),
                ),
                expression(
                  call(
                    variable(
                      tok(TokenType.Identifier, "print", null, 36),
                      makeSpan(36, 41),
                    ),
                    tok(TokenType.RightParen, ")", null, 43),
                    [
                      variable(
                        tok(TokenType.Identifier, "i", null, 42),
                        makeSpan(42, 43),
                      ),
                    ],
                    makeSpan(36, 44),
                  ),
                  makeSpan(36, 45),
                ),
              ],
              makeSpan(23, 47),
            ),
            makeSpan(11, 47),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("1");
        expect(spy).toHaveBeenCalledWith("2");
        expect(spy).toHaveBeenCalledWith("3");
        expect(spy).toHaveBeenCalledWith("4");
        expect(spy).toHaveBeenCalledWith("5");
      });
    });
  });

  describe("expressions", () => {
    describe("assign", () => {
      it("evaluates an assignment expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements: Stmt[] = [
          let_(tok(TokenType.Identifier, "x", null, 4), null, makeSpan(0, 6)),
          expression(
            call(
              variable(
                tok(TokenType.Identifier, "print", null, 7),
                makeSpan(7, 12),
              ),
              tok(TokenType.RightParen, ")", null, 14),
              [
                variable(
                  tok(TokenType.Identifier, "x", null, 13),
                  makeSpan(13, 14),
                ),
              ],
              makeSpan(7, 15),
            ),
            makeSpan(7, 16),
          ),
          expression(
            assign(
              tok(TokenType.Identifier, "x", null, 17),
              literal(42, makeSpan(21, 22)),
              makeSpan(17, 22),
            ),
            makeSpan(17, 23),
          ),
          expression(
            call(
              variable(
                tok(TokenType.Identifier, "print", null, 24),
                makeSpan(24, 29),
              ),
              tok(TokenType.RightParen, ")", null, 31),
              [
                variable(
                  tok(TokenType.Identifier, "x", null, 30),
                  makeSpan(30, 31),
                ),
              ],
              makeSpan(24, 32),
            ),
            makeSpan(24, 33),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("()");
        expect(spy).toHaveBeenCalledWith("42");
      });
    });

    describe("binary", () => {
      it("evaluates a logical or expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 17),
              [
                binary(
                  literal(false, makeSpan(6, 11)),
                  tok(TokenType.Or, "or", null, 12),
                  literal(69, makeSpan(15, 17)),
                  makeSpan(6, 17),
                ),
              ],
              makeSpan(0, 18),
            ),
            makeSpan(0, 19),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("69");
      });

      it("evaluates a logical or expression that short circuits", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 21),
              [
                binary(
                  literal("Kara", makeSpan(6, 12)),
                  tok(TokenType.Or, "or", null, 13),
                  literal(false, makeSpan(16, 21)),
                  makeSpan(6, 21),
                ),
              ],
              makeSpan(0, 22),
            ),
            makeSpan(0, 23),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("Kara");
      });

      it("evaluates a logical and expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 20),
              [
                binary(
                  literal(true, makeSpan(6, 10)),
                  tok(TokenType.And, "and", null, 11),
                  literal(false, makeSpan(15, 20)),
                  makeSpan(6, 20),
                ),
              ],
              makeSpan(0, 21),
            ),
            makeSpan(0, 22),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("false");
      });

      it("evaluates a logical and expression that short circuits", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statement = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 19),
              [
                binary(
                  literal(null, makeSpan(6, 9)),
                  tok(TokenType.And, "and", null, 11),
                  literal(true, makeSpan(15, 19)),
                  makeSpan(6, 19),
                ),
              ],
              makeSpan(0, 20),
            ),
            makeSpan(0, 21),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statement, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("nil");
      });

      it("evaluates an equality expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 13),
              [
                binary(
                  literal(10, makeSpan(6, 8)),
                  tok(TokenType.EqEq, "==", null, 9),
                  literal(5, makeSpan(12, 13)),
                  makeSpan(6, 13),
                ),
              ],
              makeSpan(0, 14),
            ),
            makeSpan(0, 15),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("false");
      });

      it("evaluates an inequality expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 13),
              [
                binary(
                  literal(10, makeSpan(6, 8)),
                  tok(TokenType.BangEq, "!=", null, 9),
                  literal(5, makeSpan(12, 13)),
                  makeSpan(6, 13),
                ),
              ],
              makeSpan(0, 14),
            ),
            makeSpan(0, 15),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("true");
      });

      it("evaluates a greater than expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 12),
              [
                binary(
                  literal(10, makeSpan(6, 8)),
                  tok(TokenType.Greater, ">", null, 9),
                  literal(5, makeSpan(11, 12)),
                  makeSpan(6, 12),
                ),
              ],
              makeSpan(0, 13),
            ),
            makeSpan(0, 14),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("true");
      });

      it("evaluates a greater equal expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 13),
              [
                binary(
                  literal(10, makeSpan(6, 8)),
                  tok(TokenType.GreaterEq, ">=", null, 9),
                  literal(5, makeSpan(12, 13)),
                  makeSpan(6, 13),
                ),
              ],
              makeSpan(0, 14),
            ),
            makeSpan(0, 15),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("true");
      });

      it("evaluates a less than expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 12),
              [
                binary(
                  literal(10, makeSpan(6, 8)),
                  tok(TokenType.Less, "<", null, 9),
                  literal(5, makeSpan(11, 12)),
                  makeSpan(6, 12),
                ),
              ],
              makeSpan(0, 13),
            ),
            makeSpan(0, 14),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("false");
      });

      it("evaluates a less equal expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 13),
              [
                binary(
                  literal(10, makeSpan(6, 8)),
                  tok(TokenType.LessEq, "<=", null, 9),
                  literal(5, makeSpan(12, 13)),
                  makeSpan(6, 13),
                ),
              ],
              makeSpan(0, 14),
            ),
            makeSpan(0, 15),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("false");
      });

      it("evaluates an addition expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 12),
              [
                binary(
                  literal(10, makeSpan(6, 8)),
                  tok(TokenType.Plus, "+", null, 9),
                  literal(5, makeSpan(11, 12)),
                  makeSpan(6, 12),
                ),
              ],
              makeSpan(0, 13),
            ),
            makeSpan(0, 14),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("15");
      });

      it("evaluates a concatenation expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 26),
              [
                binary(
                  literal("Hello, ", makeSpan(6, 15)),
                  tok(TokenType.Plus, "+", null, 16),
                  literal("world!", makeSpan(18, 26)),
                  makeSpan(6, 26),
                ),
              ],
              makeSpan(0, 27),
            ),
            makeSpan(0, 28),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("Hello, world!");
      });

      it("emits an error if '+' is performed on a non-number", () => {
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            binary(
              literal(5, makeSpan(0, 1)),
              tok(TokenType.Plus, "+", null, 2),
              literal(null, makeSpan(4, 7)),
              makeSpan(0, 7),
            ),
            makeSpan(0, 8),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(true);
        const diags = diagnostics.getDiagnostics();
        expect(diags).toHaveLength(1);
        expect(diags[0].severity).toBe("error");
        expect(diags[0].message).toBe(
          "operands must be two numbers or at least one string",
        );
      });

      it("evaluates a subtraction expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 12),
              [
                binary(
                  literal(10, makeSpan(6, 8)),
                  tok(TokenType.Minus, "-", null, 9),
                  literal(5, makeSpan(11, 12)),
                  makeSpan(6, 12),
                ),
              ],
              makeSpan(0, 13),
            ),
            makeSpan(0, 14),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("5");
      });

      it("evaluates a multiplication expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 12),
              [
                binary(
                  literal(10, makeSpan(6, 8)),
                  tok(TokenType.Star, "*", null, 9),
                  literal(5, makeSpan(11, 12)),
                  makeSpan(6, 12),
                ),
              ],
              makeSpan(0, 13),
            ),
            makeSpan(0, 14),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("50");
      });

      it("evaluates a division expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 12),
              [
                binary(
                  literal(10, makeSpan(6, 8)),
                  tok(TokenType.Slash, "/", null, 9),
                  literal(5, makeSpan(11, 12)),
                  makeSpan(6, 12),
                ),
              ],
              makeSpan(0, 13),
            ),
            makeSpan(0, 14),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("2");
      });

      it("evaluates a modulo expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 12),
              [
                binary(
                  literal(11, makeSpan(6, 8)),
                  tok(TokenType.Percent, "%", null, 9),
                  literal(5, makeSpan(11, 12)),
                  makeSpan(6, 12),
                ),
              ],
              makeSpan(0, 13),
            ),
            makeSpan(0, 14),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("1");
      });

      it("emits an error if operand isn't a number", () => {
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            binary(
              literal(5, makeSpan(0, 1)),
              tok(TokenType.Minus, "-", null, 2),
              literal(null, makeSpan(4, 7)),
              makeSpan(0, 7),
            ),
            makeSpan(0, 8),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(true);
        const diags = diagnostics.getDiagnostics();
        expect(diags).toHaveLength(1);
        expect(diags[0].severity).toBe("error");
        expect(diags[0].message).toBe("operands must be numbers");
      });
    });

    describe("block", () => {
      it("evaluates a block expression with no value", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements: Stmt[] = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 12),
              [
                blockExpr(
                  [expression(literal(5, makeSpan(8, 9)), makeSpan(8, 10))],
                  null,
                  makeSpan(6, 12),
                ),
              ],
              makeSpan(0, 13),
            ),
            makeSpan(0, 14),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("()");
      });

      it("evaluates a block expression with no value", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements: Stmt[] = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 11),
              [blockExpr([], literal(5, makeSpan(8, 9)), makeSpan(6, 11))],
              makeSpan(0, 12),
            ),
            makeSpan(0, 13),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("5");
      });
    });

    describe("call", () => {
      it("calls a funciton value", () => {
        const spy = vi.spyOn(stdlib.timeNative, "call");
        const diagnostics = new DiagnosticCollector();
        const statements: Stmt[] = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "time"), makeSpan(0, 4)),
              tok(TokenType.RightParen, ")", null, 5),
              [],
              makeSpan(0, 6),
            ),
            makeSpan(0, 7),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalled();
      });

      it("emits an error if value is not a function", () => {
        const diagnostics = new DiagnosticCollector();
        const statements: Stmt[] = [
          expression(
            call(
              literal(5, makeSpan(0, 1)),
              tok(TokenType.RightParen, ")", null, 3),
              [],
              makeSpan(0, 4),
            ),
            makeSpan(0, 5),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(true);
        const diags = diagnostics.getDiagnostics();
        expect(diags).toHaveLength(1);
        expect(diags[0].severity).toBe("error");
        expect(diags[0].message).toBe("can only call functions");
      });

      it("emits an error if wrong number of arguments is passed", () => {
        const diagnostics = new DiagnosticCollector();
        const statements: Stmt[] = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "time"), makeSpan(0, 4)),
              tok(TokenType.RightParen, ")", null, 6),
              [literal(5, makeSpan(5, 6))],
              makeSpan(0, 7),
            ),
            makeSpan(0, 8),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(true);
        const diags = diagnostics.getDiagnostics();
        expect(diags).toHaveLength(1);
        expect(diags[0].severity).toBe("error");
        expect(diags[0].message).toBe("expected 0 arguments, got 1");
      });
    });

    describe("grouping", () => {
      it("evaluates a grouped expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 14),
              [
                grouping(
                  binary(
                    literal(40, makeSpan(7, 9)),
                    tok(TokenType.Plus, "+", null, 10),
                    literal(2, makeSpan(12, 13)),
                    makeSpan(7, 13),
                  ),
                  makeSpan(6, 14),
                ),
              ],
              makeSpan(0, 15),
            ),
            makeSpan(0, 16),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("42");
      });
    });

    describe("literal", () => {
      it("evaluates a number literal", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 8),
              [literal(42, makeSpan(6, 8))],
              makeSpan(0, 9),
            ),
            makeSpan(0, 10),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("42");
      });

      it("evaluates a string literal", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 14),
              [literal("Hello!", makeSpan(6, 14))],
              makeSpan(0, 15),
            ),
            makeSpan(0, 16),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("Hello!");
      });

      it("evaluates literal 'true'", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 10),
              [literal(true, makeSpan(6, 10))],
              makeSpan(0, 11),
            ),
            makeSpan(0, 12),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("true");
      });

      it("evaluates literal 'false'", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 11),
              [literal(false, makeSpan(6, 11))],
              makeSpan(0, 12),
            ),
            makeSpan(0, 13),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("false");
      });

      it("evaluates literal 'nil'", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 9),
              [literal(null, makeSpan(6, 9))],
              makeSpan(0, 10),
            ),
            makeSpan(0, 11),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("nil");
      });
    });

    describe("unary", () => {
      it("evaluates a unary negation expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 8),
              [
                unary(
                  tok(TokenType.Minus, "-", null, 6),
                  literal(5, makeSpan(7, 8)),
                  makeSpan(6, 8),
                ),
              ],
              makeSpan(0, 9),
            ),
            makeSpan(0, 10),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("-5");
      });

      it("emits an error if operand is not a number", () => {
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            unary(
              tok(TokenType.Minus, "-"),
              literal(null, makeSpan(1, 4)),
              makeSpan(0, 4),
            ),
            makeSpan(0, 5),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(true);
        const diags = diagnostics.getDiagnostics();
        expect(diags).toHaveLength(1);
        expect(diags[0].severity).toBe("error");
        expect(diags[0].message).toBe("operand must be a number");
      });

      it("evaluates a logical not expression", () => {
        const spy = vi.spyOn(console, "log");
        const diagnostics = new DiagnosticCollector();
        const statements = [
          expression(
            call(
              variable(tok(TokenType.Identifier, "print"), makeSpan(0, 5)),
              tok(TokenType.RightParen, ")", null, 11),
              [
                unary(
                  tok(TokenType.Bang, "!", null, 6),
                  literal(true, makeSpan(7, 11)),
                  makeSpan(6, 11),
                ),
              ],
              makeSpan(0, 12),
            ),
            makeSpan(0, 13),
          ),
        ];
        const locals = new Map<Expr, number>();
        interpret(statements, locals, diagnostics);

        expect(diagnostics.hasError()).toBe(false);
        expect(spy).toHaveBeenCalledWith("false");
      });
    });
  });
});
