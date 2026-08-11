import { describe, expect, it, vi } from "vitest";
import { Interpreter } from "../src/interpreter.js";
import type { RuntimeValue } from "../src/interpreter.js";
import {
  AssignExpr,
  BinaryExpr,
  BlockExpr,
  BlockStmt,
  Expr,
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

describe("interpreter", () => {
  describe("expressions", () => {
    describe("literal expressions", () => {
      it("evaluates a number literal", () => {
        const interpreter = new Interpreter();
        const expr = new LiteralExpr(42, makeSpan(0, 2));
        const result = interpreter.visitLiteralExpr(expr);
        expect(result).toBe(42);
      });

      it("evaluates a string literal", () => {
        const interpreter = new Interpreter();
        const expr = new LiteralExpr("Hello", makeSpan(0, 7));
        const result = interpreter.visitLiteralExpr(expr);
        expect(result).toBe("Hello");
      });

      it("evaluates 'true'", () => {
        const interpreter = new Interpreter();
        const expr = new LiteralExpr(true, makeSpan(0, 4));
        const result = interpreter.visitLiteralExpr(expr);
        expect(result).toBe(true);
      });

      it("evaluates 'false'", () => {
        const interpreter = new Interpreter();
        const expr = new LiteralExpr(false, makeSpan(0, 5));
        const result = interpreter.visitLiteralExpr(expr);
        expect(result).toBe(false);
      });

      it("evaluates 'nil' as 'null'", () => {
        const interpreter = new Interpreter();
        const expr = new LiteralExpr(null, makeSpan(0, 3));
        const result = interpreter.visitLiteralExpr(expr);
        expect(result).toBe(null);
      });

      it("evaluates an array literal", () => {
        const interpreter = new Interpreter();
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
        const interpreter = new Interpreter();
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
        const interpreter = new Interpreter();
        const expr = new UnaryExpr(
          tok(TokenType.Minus, "-"),
          new LiteralExpr(5, makeSpan(1, 2)),
          makeSpan(0, 2),
        );
        const result = interpreter.visitUnaryExpr(expr);
        expect(result).toBe(-5);
      });

      it("evaluates a logical not expression", () => {
        const interpreter = new Interpreter();
        const expr = new UnaryExpr(
          tok(TokenType.Bang, "!"),
          new LiteralExpr(true, makeSpan(1, 5)),
          makeSpan(0, 5),
        );
        const result = interpreter.visitUnaryExpr(expr);
        expect(result).toBe(false);
      });
    });

    describe("binary expressions", () => {
      it("evaluates an addition expression", () => {
        const interpreter = new Interpreter();
        const expr = new BinaryExpr(
          new LiteralExpr(5, makeSpan(0, 1)),
          tok(TokenType.Plus, "+", null, 2),
          new LiteralExpr(5, makeSpan(4, 6)),
          makeSpan(0, 6),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(10);
      });

      it("evaluates a concatenation expression", () => {
        const interpreter = new Interpreter();
        const expr = new BinaryExpr(
          new LiteralExpr("Hello, ", makeSpan(0, 9)),
          tok(TokenType.Plus, "+", null, 10),
          new LiteralExpr("world!", makeSpan(12, 19)),
          makeSpan(0, 19),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe("Hello, world!");
      });

      it("evaluates a subtraction expression", () => {
        const interpreter = new Interpreter();
        const expr = new BinaryExpr(
          new LiteralExpr(5, makeSpan(0, 1)),
          tok(TokenType.Minus, "-", null, 3),
          new LiteralExpr(2, makeSpan(5, 6)),
          makeSpan(0, 6),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(3);
      });

      it("evaluates a multiplication expression", () => {
        const interpreter = new Interpreter();
        const expr = new BinaryExpr(
          new LiteralExpr(5, makeSpan(0, 1)),
          tok(TokenType.Star, "*", null, 3),
          new LiteralExpr(5, makeSpan(5, 6)),
          makeSpan(0, 6),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(25);
      });

      it("evaluates a division expression", () => {
        const interpreter = new Interpreter();
        const expr = new BinaryExpr(
          new LiteralExpr(10, makeSpan(0, 2)),
          tok(TokenType.Slash, "/", null, 4),
          new LiteralExpr(2, makeSpan(6, 7)),
          makeSpan(0, 7),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(5);
      });

      it("evaluates a modulo expression", () => {
        const interpreter = new Interpreter();
        const expr = new BinaryExpr(
          new LiteralExpr(9, makeSpan(0, 1)),
          tok(TokenType.Percent, "%", null, 3),
          new LiteralExpr(2, makeSpan(5, 6)),
          makeSpan(0, 6),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(1);
      });

      it("evaluates an equality expression", () => {
        const interpreter = new Interpreter();
        const expr = new BinaryExpr(
          new LiteralExpr(7, makeSpan(0, 1)),
          tok(TokenType.EqEq, "==", null, 3),
          new LiteralExpr(3, makeSpan(6, 7)),
          makeSpan(0, 7),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(false);
      });

      it("evaluates an inequality expression", () => {
        const interpreter = new Interpreter();
        const expr = new BinaryExpr(
          new LiteralExpr(7, makeSpan(0, 1)),
          tok(TokenType.BangEq, "!=", null, 3),
          new LiteralExpr(3, makeSpan(6, 7)),
          makeSpan(0, 7),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(true);
      });

      it("evaluates a greater than expression", () => {
        const interpreter = new Interpreter();
        const expr = new BinaryExpr(
          new LiteralExpr(5, makeSpan(0, 1)),
          tok(TokenType.Greater, ">", null, 3),
          new LiteralExpr(3, makeSpan(5, 6)),
          makeSpan(0, 6),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(true);
      });

      it("evaluates a greater or equal expression", () => {
        const interpreter = new Interpreter();
        const expr = new BinaryExpr(
          new LiteralExpr(5, makeSpan(0, 1)),
          tok(TokenType.GreaterEq, ">=", null, 3),
          new LiteralExpr(3, makeSpan(6, 7)),
          makeSpan(0, 7),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(true);
      });

      it("evaluates a less than expression", () => {
        const interpreter = new Interpreter();
        const expr = new BinaryExpr(
          new LiteralExpr(5, makeSpan(0, 1)),
          tok(TokenType.Less, "<", null, 3),
          new LiteralExpr(3, makeSpan(5, 6)),
          makeSpan(0, 6),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(false);
      });

      it("evaluates a less or equal expression", () => {
        const interpreter = new Interpreter();
        const expr = new BinaryExpr(
          new LiteralExpr(5, makeSpan(0, 1)),
          tok(TokenType.LessEq, "<=", null, 3),
          new LiteralExpr(3, makeSpan(6, 7)),
          makeSpan(0, 7),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(false);
      });

      it("evaluates a logical or expression", () => {
        const interpreter = new Interpreter();
        const expr = new BinaryExpr(
          new LiteralExpr(true, makeSpan(0, 5)),
          tok(TokenType.Or, "or", null, 6),
          new LiteralExpr(false, makeSpan(9, 14)),
          makeSpan(0, 14),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(true);
      });

      it("evaluates a logical and expression", () => {
        const interpreter = new Interpreter();
        const expr = new BinaryExpr(
          new LiteralExpr(true, makeSpan(0, 5)),
          tok(TokenType.And, "and", null, 6),
          new LiteralExpr(false, makeSpan(10, 15)),
          makeSpan(0, 15),
        );
        const result = interpreter.visitBinaryExpr(expr);
        expect(result).toBe(false);
      });
    });

    describe("grouping expressions", () => {
      it("evaluates a grouping expression", () => {
        const interpreter = new Interpreter();
        const expr = new GroupingExpr(
          new BinaryExpr(
            new LiteralExpr(5, makeSpan(1, 2)),
            tok(TokenType.Plus, "+", null, 3),
            new LiteralExpr(5, makeSpan(5, 6)),
            makeSpan(1, 6),
          ),
          makeSpan(0, 7),
        );
        const result = interpreter.visitGroupingExpr(expr);
        expect(result).toBe(10);
      });
    });

    describe("variables", () => {
      it("evaluates a variable expression", () => {
        const interpreter = new Interpreter();
        (interpreter as any).environment.define("x", 42);
        const name = tok(TokenType.Identifier, "x");
        const expr = new VarExpr(name, makeSpan(0, 1));
        const result = interpreter.visitVarExpr(expr);
        expect(result).toBe(42);
      });
    });

    describe("assignment expressions", () => {
      it("evaluates an assignment expression", () => {
        const interpreter = new Interpreter();
        (interpreter as any).environment.define("x", null);
        const name = tok(TokenType.Identifier, "x");
        const operator = tok(TokenType.Eq, "=", null, 3);
        const value = new LiteralExpr(42, makeSpan(5, 7));
        const expr = new AssignExpr(name, operator, value, makeSpan(0, 7));
        const result = interpreter.visitAssignExpr(expr);
        expect(result).toBe(42);
      });

      it("evaluates an add assignment expression", () => {
        const interpreter = new Interpreter();
        (interpreter as any).environment.define("x", 5);
        const name = tok(TokenType.Identifier, "x");
        const operator = tok(TokenType.PlusEq, "+=", null, 3);
        const value = new LiteralExpr(5, makeSpan(6, 7));
        const expr = new AssignExpr(name, operator, value, makeSpan(0, 7));
        const result = interpreter.visitAssignExpr(expr);
        expect(result).toBe(10);
      });

      it("evaluates a subtract assignment expression", () => {
        const interpreter = new Interpreter();
        (interpreter as any).environment.define("x", 10);
        const name = tok(TokenType.Identifier, "x");
        const operator = tok(TokenType.MinusEq, "-=", null, 3);
        const value = new LiteralExpr(5, makeSpan(6, 7));
        const expr = new AssignExpr(name, operator, value, makeSpan(0, 7));
        const result = interpreter.visitAssignExpr(expr);
        expect(result).toBe(5);
      });

      it("evaluates a multiply assignment expression", () => {
        const interpreter = new Interpreter();
        (interpreter as any).environment.define("x", 5);
        const name = tok(TokenType.Identifier, "x");
        const operator = tok(TokenType.StarEq, "*=", null, 3);
        const value = new LiteralExpr(5, makeSpan(6, 7));
        const expr = new AssignExpr(name, operator, value, makeSpan(0, 7));
        const result = interpreter.visitAssignExpr(expr);
        expect(result).toBe(25);
      });

      it("evaluates a divide assignment expression", () => {
        const interpreter = new Interpreter();
        (interpreter as any).environment.define("x", 10);
        const name = tok(TokenType.Identifier, "x");
        const operator = tok(TokenType.SlashEq, "/=", null, 3);
        const value = new LiteralExpr(5, makeSpan(6, 7));
        const expr = new AssignExpr(name, operator, value, makeSpan(0, 7));
        const result = interpreter.visitAssignExpr(expr);
        expect(result).toBe(2);
      });

      it("evaluates a modulo assignment expression", () => {
        const interpreter = new Interpreter();
        (interpreter as any).environment.define("x", 5);
        const name = tok(TokenType.Identifier, "x");
        const operator = tok(TokenType.PercentEq, "%=", null, 3);
        const value = new LiteralExpr(2, makeSpan(6, 7));
        const expr = new AssignExpr(name, operator, value, makeSpan(0, 7));
        const result = interpreter.visitAssignExpr(expr);
        expect(result).toBe(1);
      });
    });

    describe("block expressions", () => {
      it("evaluates a block expression", () => {
        const interpreter = new Interpreter();
        const name = tok(TokenType.Identifier, "x", null, 7);
        const initializer = new LiteralExpr(5, makeSpan(11, 12));
        const letDecl = new LetStmt(name, initializer, makeSpan(2, 13));
        const value = new BinaryExpr(
          new VarExpr(name, makeSpan(15, 16)),
          tok(TokenType.Plus, "+", null, 18),
          new LiteralExpr(5, makeSpan(20, 21)),
          makeSpan(15, 21),
        );
        const expr = new BlockExpr([letDecl], value, makeSpan(0, 23));
        const result = interpreter.visitBlockExpr(expr);
        expect(result).toBe(10);
      });
    });
  });

  describe("statements", () => {
    describe("let declarations", () => {
      it("declares a global variable", () => {
        const interpreter = new Interpreter();
        const name = tok(TokenType.Identifier, "x", null, 5);
        const stmt = new LetStmt(name, null, makeSpan(0, 7));
        const letStmtSpy = vi.spyOn(interpreter, "visitLetStmt");
        interpreter.interpret([stmt]);
        expect(letStmtSpy).toHaveBeenCalled();
        expect((interpreter as any).environment.get(name)).toBeNull();
      });

      it("declares a global variable with a value", () => {
        const interpreter = new Interpreter();
        const name = tok(TokenType.Identifier, "x", null, 5);
        const value = new LiteralExpr(42, makeSpan(7, 9));
        const stmt = new LetStmt(name, value, makeSpan(0, 10));
        const letStmtSpy = vi.spyOn(interpreter, "visitLetStmt");
        interpreter.interpret([stmt]);
        expect(letStmtSpy).toHaveBeenCalled();
        expect((interpreter as any).environment.get(name)).toBe(42);
      });
    });

    describe("expression statements", () => {
      it("executes an expression statement", () => {
        const interpreter = new Interpreter();
        const stmt = new ExprStmt(
          new BinaryExpr(
            new LiteralExpr(5, makeSpan(0, 1)),
            tok(TokenType.Plus, "+", null, 2),
            new LiteralExpr(5, makeSpan(4, 5)),
            makeSpan(0, 5),
          ),
          makeSpan(0, 6),
        );
        const exprStmtSpy = vi.spyOn(interpreter, "visitExprStmt");
        const binaryExprSpy = vi.spyOn(interpreter, "visitBinaryExpr");
        interpreter.interpret([stmt]);
        expect(exprStmtSpy).toHaveBeenCalled();
        expect(binaryExprSpy).toHaveBeenCalled();
      });
    });

    describe("block statements", () => {
      it("executes a block statement", () => {
        const interpreter = new Interpreter();
        const name = tok(TokenType.Identifier, "x", null, 7);
        const initializer = new LiteralExpr(5, makeSpan(11, 12));
        const letDecl = new LetStmt(name, initializer, makeSpan(2, 13));
        const stmt = new BlockStmt([letDecl], makeSpan(0, 23));
        const blockStmtSpy = vi.spyOn(interpreter, "visitBlockStmt");
        const letStmtSpy = vi.spyOn(interpreter, "visitLetStmt");
        interpreter.interpret([stmt]);
        expect(blockStmtSpy).toHaveBeenCalled();
        expect(letStmtSpy).toHaveBeenCalled();
      });
    });
  });
});
