import { describe, expect, it } from "vitest";
import { CantripFunction, CantripNative, isCantripCallable } from "../src/callables.js";
import {
  BinaryExpr,
  BlockExpr,
  FunctionStmt,
  LiteralExpr,
  ReturnStmt,
  Token,
  TokenType,
  VarExpr,
} from "@cantrip/ast";
import { Span } from "@cantrip/types";
import { Environment } from "../src/environment.js";
import { Interpreter, RuntimeError, Unit } from "../src/interpreter.js";

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

describe("type check function", () => {
  it("returns false when value is null", () => {
    expect(isCantripCallable(null)).toBe(false);
  });

  it("returns false when value is a string, number, boolean, or unit type", () => {
    expect(isCantripCallable("not a function")).toBe(false);
    expect(isCantripCallable(42)).toBe(false);
    expect(isCantripCallable(true)).toBe(false);
    expect(isCantripCallable(false)).toBe(false);
    expect(isCantripCallable(Unit)).toBe(false);
  });

  it("returns false when value is an array or map", () => {
    expect(isCantripCallable([])).toBe(false);
    expect(isCantripCallable(new Map())).toBe(false);
  });

  it("returns true when value is a CantripFunction", () => {
    const constName = tok(TokenType.Identifier, "constNum", null, 4);
    const constReturn = new LiteralExpr(5, makeSpan(16, 17));
    const constBody = new BlockExpr([], constReturn, makeSpan(14, 18));
    const constDecl = new FunctionStmt(constName, [], constBody, makeSpan(0, 18));
    const constFunction = new CantripFunction(constDecl, new Environment());
    expect(isCantripCallable(constFunction)).toBe(true);
  });

  it("returns true when value is a CantripNative", () => {
    const native = new CantripNative((_args) => Date.now(), 0);
    expect(isCantripCallable(native)).toBe(true);
  });
});

describe("functions", () => {
  const addName = tok(TokenType.Identifier, "add", null, 4);
  const addParams = [
    tok(TokenType.Identifier, "a", null, 8),
    tok(TokenType.Identifier, "b", null, 11),
  ];
  const addReturn = new BinaryExpr(
    new VarExpr(tok(TokenType.Identifier, "a", null, 16), makeSpan(16, 17)),
    tok(TokenType.Plus, "+", null, 18),
    new VarExpr(tok(TokenType.Identifier, "b", null, 20), makeSpan(20, 21)),
    makeSpan(16, 21),
  );
  const addBody = new BlockExpr([], addReturn, makeSpan(14, 23));
  const addDecl = new FunctionStmt(addName, addParams, addBody, makeSpan(0, 23));
  const addFunction = new CantripFunction(addDecl, new Environment());

  const subName = tok(TokenType.Identifier, "sub", null, 4);
  const subParams = [
    tok(TokenType.Identifier, "a", null, 8),
    tok(TokenType.Identifier, "b", null, 11),
  ];
  const subValue = new BinaryExpr(
    new VarExpr(tok(TokenType.Identifier, "a"), makeSpan(16, 17)),
    tok(TokenType.Minus, "-"),
    new VarExpr(tok(TokenType.Identifier, "b"), makeSpan(16, 17)),
    makeSpan(0, 17),
  );
  const subReturn = new ReturnStmt(
    tok(TokenType.Return, "return"),
    subValue,
    makeSpan(13, 15),
  );
  const subBody = new BlockExpr([subReturn], null, makeSpan(14, 23));
  const subDecl = new FunctionStmt(subName, subParams, subBody, makeSpan(0, 23));
  const subFunction = new CantripFunction(subDecl, new Environment());

  const constName = tok(TokenType.Identifier, "constNum", null, 4);
  const constReturn = new LiteralExpr(5, makeSpan(16, 17));
  const constBody = new BlockExpr([], constReturn, makeSpan(14, 18));
  const constDecl = new FunctionStmt(constName, [], constBody, makeSpan(0, 18));
  const constFunction = new CantripFunction(constDecl, new Environment());

  describe("toString", () => {
    it("returns '<fn add>'", () => {
      expect(addFunction.toString()).toBe("<fn add>");
    });

    it("returns '<fn sub>'", () => {
      expect(subFunction.toString()).toBe("<fn sub>");
    });

    it("returns '<fn constNum>'", () => {
      expect(constFunction.toString()).toBe("<fn constNum>");
    });
  });

  describe("arity", () => {
    it("returns number of parameters", () => {
      expect(addFunction.arity()).toBe(2);
    });

    it("returns number of parameters", () => {
      expect(subFunction.arity()).toBe(2);
    });

    it("returns 0 when given function with no parameters", () => {
      expect(constFunction.arity()).toBe(0);
    });
  });

  describe("call", () => {
    it("returns the result of add function", () => {
      const interpreter = new Interpreter();
      expect(addFunction.call(interpreter, [1, 2])).toBe(3);
    });

    it("returns the result of add function", () => {
      const interpreter = new Interpreter();
      expect(subFunction.call(interpreter, [5, 2])).toBe(3);
    });

    it("returns the result of constNum function", () => {
      const interpreter = new Interpreter();
      expect(constFunction.call(interpreter, [])).toBe(5);
    });
  });

  describe("error", () => {
    it("throws an error", () => {
      const interpreter = new Interpreter();
      expect(() => addFunction.call(interpreter, [10, false])).toThrow(RuntimeError);
    });
  });
});

describe("native functions", () => {
  const time = new CantripNative((_args) => Date.now(), 0);
  const print = new CantripNative((args) => {
    console.log(args[0]);
    return Unit;
  }, 1);

  it("returns '<native fn>'", () => {
    expect(time.toString()).toBe("<native fn>");
    expect(print.toString()).toBe("<native fn>");
  });

  it("returns the arity", () => {
    expect(time.arity()).toBe(0);
    expect(print.arity()).toBe(1);
  });

  it("returns the result of the ts function or unit", () => {
    const interpreter = new Interpreter();
    const expected = Date.now();
    expect(time.call(interpreter, [])).toBe(expected);
    expect(print.call(interpreter, ["Hello"])).toBe(Unit);
  });
});
