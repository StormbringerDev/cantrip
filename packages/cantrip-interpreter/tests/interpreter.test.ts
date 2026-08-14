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
  GetExpr,
  GroupingExpr,
  IfExpr,
  IndexExpr,
  IndexSetExpr,
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

    describe("get expressions", () => {
      it("retrieves an object property", () => {
        const interpreter = new Interpreter();
        const objValue = new Map<string, RuntimeValue>([
          ["name", "Reyek"],
          ["level", 3],
        ]);
        (interpreter as any).environment.define("reyek", objValue);
        const object = new VarExpr(tok(TokenType.Identifier, "reyek"), makeSpan(0, 5));
        const name = tok(TokenType.Identifier, "level", null, 6);
        const expr = new GetExpr(object, name, makeSpan(0, 11));
        const result = interpreter.visitGetExpr(expr);
        expect(result).toBe(3);
      });
    });

    describe("set expressions", () => {
      it("sets an object property", () => {
        const interpreter = new Interpreter();
        const objValue = new Map<string, RuntimeValue>([
          ["name", "Reyek"],
          ["level", 3],
        ]);
        (interpreter as any).environment.define("reyek", objValue);
        const varName = tok(TokenType.Identifier, "reyek");
        const object = new VarExpr(varName, makeSpan(0, 5));
        const name = tok(TokenType.Identifier, "level", null, 6);
        const operator = tok(TokenType.Eq, "=", null, 13);
        const value = new LiteralExpr(4, makeSpan(16, 17));
        const expr = new SetExpr(object, name, operator, value, makeSpan(0, 17));
        const result = interpreter.visitSetExpr(expr);
        expect(result).toBe(4);
        const expected = new Map<string, RuntimeValue>([
          ["name", "Reyek"],
          ["level", 4],
        ]);
        expect((interpreter as any).environment.get(varName)).toEqual(expected);
      });
    });

    describe("index expressions", () => {
      it("retrieves a value from an array", () => {
        const interpreter = new Interpreter();
        (interpreter as any).environment.define("numbers", [1, 2, 3]);
        const indexee = new VarExpr(tok(TokenType.Identifier, "numbers"), makeSpan(0, 7));
        const bracket = tok(TokenType.LeftBracket, "[", null, 7);
        const index = new LiteralExpr(1, makeSpan(8, 9));
        const expr = new IndexExpr(indexee, bracket, index, makeSpan(0, 10));
        const result = interpreter.visitIndexExpr(expr);
        expect(result).toBe(2);
      });

      it("retrieves a value from an object", () => {
        const interpreter = new Interpreter();
        const objValue = new Map<string, RuntimeValue>([
          ["name", "Reyek"],
          ["level", 3],
        ]);
        (interpreter as any).environment.define("reyek", objValue);
        const indexee = new VarExpr(tok(TokenType.Identifier, "reyek"), makeSpan(0, 5));
        const bracket = tok(TokenType.LeftBracket, "[", null, 5);
        const index = new LiteralExpr("level", makeSpan(6, 12));
        const expr = new IndexExpr(indexee, bracket, index, makeSpan(0, 13));
        const result = interpreter.visitIndexExpr(expr);
        expect(result).toBe(3);
      });
    });

    describe("index set expressions", () => {
      it("sets a value at array index", () => {
        const interpreter = new Interpreter();
        (interpreter as any).environment.define("numbers", [1, 2, 3]);
        const indexee = new VarExpr(tok(TokenType.Identifier, "numbers"), makeSpan(0, 7));
        const bracket = tok(TokenType.LeftBracket, "[", null, 7);
        const index = new LiteralExpr(3, makeSpan(8, 9));
        const operator = tok(TokenType.Eq, "=", null, 11);
        const value = new LiteralExpr(4, makeSpan(13, 14));
        const expr = new IndexSetExpr(
          indexee,
          bracket,
          index,
          operator,
          value,
          makeSpan(0, 14),
        );
        const result = interpreter.visitIndexSetExpr(expr);
        expect(result).toBe(4);
        const expected = [1, 2, 3, 4];
        expect((interpreter as any).environment.get(indexee.name)).toEqual(expected);
      });

      it("sets an object key", () => {
        const interpreter = new Interpreter();
        const objValue = new Map<string, RuntimeValue>([
          ["name", "Reyek"],
          ["level", 3],
        ]);
        (interpreter as any).environment.define("reyek", objValue);
        const indexee = new VarExpr(tok(TokenType.Identifier, "reyek"), makeSpan(0, 5));
        const bracket = tok(TokenType.LeftBracket, "[", null, 5);
        const index = new LiteralExpr("level", makeSpan(6, 12));
        const operator = tok(TokenType.Eq, "=", null, 14);
        const value = new LiteralExpr(4, makeSpan(16, 17));
        const expr = new IndexSetExpr(
          indexee,
          bracket,
          index,
          operator,
          value,
          makeSpan(0, 17),
        );
        const result = interpreter.visitIndexSetExpr(expr);
        expect(result).toBe(4);
        const expected = new Map<string, RuntimeValue>([
          ["name", "Reyek"],
          ["level", 4],
        ]);
        expect((interpreter as any).environment.get(indexee.name)).toEqual(expected);
      });
    });

    describe("if expressions", () => {
      it("evaluates an if expression", () => {
        const interpreter = new Interpreter();
        const condition = new LiteralExpr(true, makeSpan(4, 7));
        const varName = tok(TokenType.Identifier, "x", null, 15);
        const varInitializer = new LiteralExpr(5, makeSpan(19, 20));
        const varDecl = new LetStmt(varName, varInitializer, makeSpan(11, 21));
        const blockValue = new BinaryExpr(
          new VarExpr(varName, makeSpan(22, 23)),
          tok(TokenType.Plus, "+", null, 24),
          new LiteralExpr(5, makeSpan(26, 27)),
          makeSpan(22, 29),
        );
        const thenBranch = new BlockExpr([varDecl], blockValue, makeSpan(9, 29));
        const expr = new IfExpr(condition, thenBranch, null, makeSpan(0, 29));
        const result = interpreter.visitIfExpr(expr);
        expect(result).toBe(10);
      });

      it("skips evaluation if condition is false", () => {
        const interpreter = new Interpreter();
        const condition = new LiteralExpr(false, makeSpan(4, 8));
        const varName = tok(TokenType.Identifier, "x", null, 16);
        const varInitializer = new LiteralExpr(5, makeSpan(20, 21));
        const varDecl = new LetStmt(varName, varInitializer, makeSpan(12, 22));
        const blockValue = new BinaryExpr(
          new VarExpr(varName, makeSpan(23, 24)),
          tok(TokenType.Plus, "+", null, 25),
          new LiteralExpr(5, makeSpan(27, 28)),
          makeSpan(23, 30),
        );
        const thenBranch = new BlockExpr([varDecl], blockValue, makeSpan(10, 30));
        const expr = new IfExpr(condition, thenBranch, null, makeSpan(0, 30));
        const result = interpreter.visitIfExpr(expr);
        expect(result).toBe(null);
      });

      it("evaluates an if-else expression", () => {
        const interpreter = new Interpreter();
        const condition = new LiteralExpr(false, makeSpan(4, 8));
        const varName = tok(TokenType.Identifier, "x", null, 16);
        const varInitializer = new LiteralExpr(5, makeSpan(20, 21));
        const varDecl = new LetStmt(varName, varInitializer, makeSpan(12, 22));
        const thenValue = new BinaryExpr(
          new VarExpr(varName, makeSpan(23, 24)),
          tok(TokenType.Plus, "+", null, 25),
          new LiteralExpr(5, makeSpan(27, 28)),
          makeSpan(23, 30),
        );
        const thenBranch = new BlockExpr([varDecl], thenValue, makeSpan(10, 30));
        const elseValue = new LiteralExpr(5, makeSpan(38, 55));
        const elseBranch = new BlockExpr([], elseValue, makeSpan(36, 57));
        const expr = new IfExpr(condition, thenBranch, elseBranch, makeSpan(0, 57));
        const result = interpreter.visitIfExpr(expr);
        expect(result).toBe(5);
      });

      it("evaluates an if-else-if expression", () => {
        const interpreter = new Interpreter();
        const condition = new LiteralExpr(false, makeSpan(4, 8));
        const varName = tok(TokenType.Identifier, "x", null, 16);
        const varInitializer = new LiteralExpr(5, makeSpan(20, 21));
        const varDecl = new LetStmt(varName, varInitializer, makeSpan(12, 22));
        const thenValue = new BinaryExpr(
          new VarExpr(varName, makeSpan(23, 24)),
          tok(TokenType.Plus, "+", null, 25),
          new LiteralExpr(5, makeSpan(27, 28)),
          makeSpan(23, 30),
        );
        const thenBranch = new BlockExpr([varDecl], thenValue, makeSpan(10, 30));
        const elseCondition = new LiteralExpr(true, makeSpan(39, 42));
        const elseValue = new LiteralExpr(5, makeSpan(38, 55));
        const elseBlock = new BlockExpr([], elseValue, makeSpan(46, 63));
        const elseBranch = new IfExpr(elseCondition, elseBlock, null, makeSpan(36, 64));
        const expr = new IfExpr(condition, thenBranch, elseBranch, makeSpan(0, 64));
        const result = interpreter.visitIfExpr(expr);
        expect(result).toBe(5);
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
