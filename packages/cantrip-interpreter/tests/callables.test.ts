import { describe, expect, it } from "vitest";
import { CantripFunction } from "../src/callables.js";
import {
  BinaryExpr,
  BlockExpr,
  FunctionStmt,
  LiteralExpr,
  Token,
  TokenType,
  VarExpr,
} from "@cantrip/ast";
import { Span } from "@cantrip/types";
import { Environment } from "../src/environment.js";
import { Interpreter } from "../src/interpreter.js";

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

  const constName = tok(TokenType.Identifier, "constNum", null, 4);
  const constReturn = new LiteralExpr(5, makeSpan(16, 17));
  const constBody = new BlockExpr([], constReturn, makeSpan(14, 18));
  const constDecl = new FunctionStmt(constName, [], constBody, makeSpan(0, 18));
  const constFunction = new CantripFunction(constDecl, new Environment());

  describe("toString", () => {
    it("returns '<fn add>'", () => {
      expect(addFunction.toString()).toBe("<fn add>");
    });

    it("returns '<fn constNum>'", () => {
      expect(constFunction.toString()).toBe("<fn constNum>");
    });
  });

  describe("arity", () => {
    it("returns number of parameters", () => {
      expect(addFunction.arity()).toBe(2);
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

    it("returns the result of constNum function", () => {
      const interpreter = new Interpreter();
      expect(constFunction.call(interpreter, [])).toBe(5);
    });
  });
});
