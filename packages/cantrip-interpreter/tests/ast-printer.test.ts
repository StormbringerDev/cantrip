import { describe, expect, it } from "vitest";
import {
  AssignExpr,
  BinaryExpr,
  type Expr,
  ExprStmt,
  GroupingExpr,
  LetStmt,
  LiteralExpr,
  Token,
  TokenType,
  UnaryExpr,
  VarExpr,
} from "@cantrip/ast";
import type { Span } from "@cantrip/types";
import { AstPrinter } from "../src/ast-printer.js";

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

describe("AstPrinter", () => {
  const printer = new AstPrinter();

  it("prints a literal value", () => {
    const program = [new ExprStmt(new LiteralExpr(42, makeSpan(0, 2)), makeSpan(0, 3))];
    const output = printer.print(program);
    expect(output).toBe("42");
  });

  it("prints a raw string", () => {
    const program = [
      new ExprStmt(new LiteralExpr("Hello\nWorld!", makeSpan(0, 15)), makeSpan(0, 16)),
    ];
    const output = printer.print(program);
    expect(output).toBe('"Hello\\nWorld!"');
  });

  it("prints 'nil'", () => {
    const program = [new ExprStmt(new LiteralExpr(null, makeSpan(0, 3)), makeSpan(0, 4))];
    const output = printer.print(program);
    expect(output).toBe("nil");
  });

  it("prints 'true'", () => {
    const program = [new ExprStmt(new LiteralExpr(true, makeSpan(0, 4)), makeSpan(0, 5))];
    const output = printer.print(program);
    expect(output).toBe("true");
  });

  it("prints 'false'", () => {
    const program = [
      new ExprStmt(new LiteralExpr(false, makeSpan(0, 4)), makeSpan(0, 5)),
    ];
    const output = printer.print(program);
    expect(output).toBe("false");
  });

  it("prints an array", () => {
    const program = [
      new ExprStmt(
        new LiteralExpr(
          [
            new LiteralExpr(1, makeSpan(1, 2)),
            new LiteralExpr(2, makeSpan(3, 4)),
            new LiteralExpr(3, makeSpan(5, 6)),
          ],
          makeSpan(0, 7),
        ),
        makeSpan(0, 8),
      ),
    ];
    const output = printer.print(program);
    expect(output).toBe("[1, 2, 3]");
  });

  it("prints an object", () => {
    const program = [
      new ExprStmt(
        new LiteralExpr(
          new Map<string, Expr>([
            ["name", new LiteralExpr("Reyek", makeSpan(6, 13))],
            ["class", new LiteralExpr("wizard", makeSpan(20, 28))],
          ]),
          makeSpan(0, 29),
        ),
        makeSpan(0, 30),
      ),
    ];
    const output = printer.print(program);
    expect(output).toBe('{ name: "Reyek", class: "wizard" }');
  });

  it("prints a binary expression", () => {
    const program = [
      new ExprStmt(
        new BinaryExpr(
          new LiteralExpr(5, makeSpan(0, 1)),
          tok(TokenType.Plus, "+", null, 1),
          new LiteralExpr(5, makeSpan(2, 3)),
          makeSpan(0, 3),
        ),
        makeSpan(0, 4),
      ),
    ];
    const output = printer.print(program);
    expect(output).toBe("(+ 5 5)");
  });

  it("prints a unary expression", () => {
    const program = [
      new ExprStmt(
        new UnaryExpr(
          tok(TokenType.Minus, "-"),
          new LiteralExpr(5, makeSpan(1, 2)),
          makeSpan(0, 2),
        ),
        makeSpan(0, 3),
      ),
    ];
    const output = printer.print(program);
    expect(output).toBe("(- 5)");
  });

  it("prints a grouping expression", () => {
    const program = [
      new ExprStmt(
        new GroupingExpr(
          new BinaryExpr(
            new LiteralExpr(5, makeSpan(1, 2)),
            tok(TokenType.Minus, "-", null, 2),
            new LiteralExpr(2, makeSpan(3, 4)),
            makeSpan(1, 4),
          ),
          makeSpan(0, 5),
        ),
        makeSpan(0, 6),
      ),
    ];
    const output = printer.print(program);
    expect(output).toBe("(group (- 5 2))");
  });

  it("prints a variable expression", () => {
    const program = [
      new ExprStmt(
        new VarExpr(tok(TokenType.Identifier, "answer"), makeSpan(0, 6)),
        makeSpan(0, 7),
      ),
    ];
    const output = printer.print(program);
    expect(output).toBe("answer");
  });

  it("prints an assignment expression", () => {
    const program = [
      new ExprStmt(
        new AssignExpr(
          tok(TokenType.Identifier, "answer"),
          tok(TokenType.Eq, "=", null, 6),
          new LiteralExpr(42, makeSpan(7, 9)),
          makeSpan(0, 9),
        ),
        makeSpan(0, 10),
      ),
    ];
    const output = printer.print(program);
    expect(output).toBe("(assign answer 42)");
  });

  it("prints an addition assignment expression", () => {
    const program = [
      new ExprStmt(
        new AssignExpr(
          tok(TokenType.Identifier, "count"),
          tok(TokenType.PlusEq, "+=", null, 6),
          new LiteralExpr(1, makeSpan(8, 9)),
          makeSpan(0, 9),
        ),
        makeSpan(0, 10),
      ),
    ];
    const output = printer.print(program);
    expect(output).toBe("(addAssign count 1)");
  });

  it("prints a subtraction assignment expression", () => {
    const program = [
      new ExprStmt(
        new AssignExpr(
          tok(TokenType.Identifier, "health"),
          tok(TokenType.MinusEq, "-=", null, 6),
          new LiteralExpr(5, makeSpan(8, 9)),
          makeSpan(0, 9),
        ),
        makeSpan(0, 10),
      ),
    ];
    const output = printer.print(program);
    expect(output).toBe("(subAssign health 5)");
  });

  it("prints a multiplication assignment expression", () => {
    const program = [
      new ExprStmt(
        new AssignExpr(
          tok(TokenType.Identifier, "factor"),
          tok(TokenType.StarEq, "*=", null, 6),
          new LiteralExpr(5, makeSpan(8, 9)),
          makeSpan(0, 9),
        ),
        makeSpan(0, 10),
      ),
    ];
    const output = printer.print(program);
    expect(output).toBe("(mulAssign factor 5)");
  });

  it("prints a division assignment expression", () => {
    const program = [
      new ExprStmt(
        new AssignExpr(
          tok(TokenType.Identifier, "half"),
          tok(TokenType.SlashEq, "/=", null, 4),
          new LiteralExpr(2, makeSpan(6, 7)),
          makeSpan(0, 7),
        ),
        makeSpan(0, 9),
      ),
    ];
    const output = printer.print(program);
    expect(output).toBe("(divAssign half 2)");
  });

  it("prints a modulo assignment expression", () => {
    const program = [
      new ExprStmt(
        new AssignExpr(
          tok(TokenType.Identifier, "remainder"),
          tok(TokenType.PercentEq, "%=", null, 9),
          new LiteralExpr(3, makeSpan(11, 12)),
          makeSpan(0, 12),
        ),
        makeSpan(0, 13),
      ),
    ];
    const output = printer.print(program);
    expect(output).toBe("(modAssign remainder 3)");
  });

  it("prints a let statement", () => {
    const program = [
      new LetStmt(tok(TokenType.Identifier, "answer"), null, makeSpan(0, 11)),
    ];
    const output = printer.print(program);
    expect(output).toBe("(let answer)");
  });

  it("prints a let statement with an initializer", () => {
    const program = [
      new LetStmt(
        tok(TokenType.Identifier, "answer"),
        new LiteralExpr(42, makeSpan(12, 14)),
        makeSpan(0, 15),
      ),
    ];
    const output = printer.print(program);
    expect(output).toBe("(let answer 42)");
  });
});
