import { describe, expect, it, vi } from "vitest";
import type { Span } from "@cantrip/types";
import { Token, TokenType } from "../src/token.js";
import {
  BlockStmt,
  BreakStmt,
  ContinueStmt,
  ExprStmt,
  FunctionStmt,
  LetStmt,
  ReturnStmt,
  StmtVisitor,
  WhileStmt,
} from "../src/stmt.js";
import { BlockExpr, CallExpr, LiteralExpr, VarExpr } from "../src/expr.js";

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

describe("statement classes", () => {
  it("instantiates a BlockStmt", () => {
    const stmt = new BlockStmt([], makeSpan(0, 2));
    expect(stmt).toBeInstanceOf(BlockStmt);
    expect(stmt.statements).toHaveLength(0);
    const expectedSpan = makeSpan(0, 2);
    expect(stmt.span).toEqual(expectedSpan);
  });

  it("instantiates a BreakStmt", () => {
    const stmt = new BreakStmt(tok(TokenType.Break, "break"), null, makeSpan(0, 6));
    expect(stmt).toBeInstanceOf(BreakStmt);
    expect(stmt.keyword.type).toBe(TokenType.Break);
    expect(stmt.value).toBeNull();
    const expectedSpan = makeSpan(0, 6);
    expect(stmt.span).toEqual(expectedSpan);
  });

  it("instantiates a ContinueStmt", () => {
    const stmt = new ContinueStmt(tok(TokenType.Continue, "continue"), makeSpan(0, 9));
    expect(stmt).toBeInstanceOf(ContinueStmt);
    expect(stmt.keyword.type).toBe(TokenType.Continue);
    const expectedSpan = makeSpan(0, 9);
    expect(stmt.span).toEqual(expectedSpan);
  });

  it("instantiates an ExprStmt", () => {
    const stmt = new ExprStmt(
      new CallExpr(
        new VarExpr(tok(TokenType.Identifier, "time"), makeSpan(0, 4)),
        tok(TokenType.RightParen, ")", null, 5),
        [],
        makeSpan(0, 6),
      ),
      makeSpan(0, 7),
    );
    expect(stmt).toBeInstanceOf(ExprStmt);
    expect(stmt.expr).toBeInstanceOf(CallExpr);
    const expectedSpan = makeSpan(0, 7);
    expect(stmt.span).toEqual(expectedSpan);
  });

  it("instantiates a FunctionStmt", () => {
    const stmt = new FunctionStmt(
      tok(TokenType.Identifier, "time", null, 3),
      [],
      new BlockExpr([], null, makeSpan(10, 12)),
      makeSpan(0, 12),
    );
    expect(stmt).toBeInstanceOf(FunctionStmt);
    expect(stmt.name.lexeme).toBe("time");
    expect(stmt.params).toHaveLength(0);
    expect(stmt.body).toBeInstanceOf(BlockExpr);
    const expectedSpan = makeSpan(0, 12);
    expect(stmt.span).toEqual(expectedSpan);
  });

  it("instantiates a LetStmt", () => {
    const stmt = new LetStmt(
      tok(TokenType.Identifier, "x", null, 4),
      null,
      makeSpan(0, 6),
    );
    expect(stmt).toBeInstanceOf(LetStmt);
    expect(stmt.name.lexeme).toBe("x");
    expect(stmt.initializer).toBeNull();
    const expectedSpan = makeSpan(0, 6);
    expect(stmt.span).toEqual(expectedSpan);
  });

  it("instantiates a ReturnStmt", () => {
    const stmt = new ReturnStmt(tok(TokenType.Return, "return"), null, makeSpan(0, 7));
    expect(stmt).toBeInstanceOf(ReturnStmt);
    expect(stmt.keyword.type).toBe(TokenType.Return);
    expect(stmt.value).toBeNull();
    const expectedSpan = makeSpan(0, 7);
    expect(stmt.span).toEqual(expectedSpan);
  });

  it("instantiates a WhileStmt", () => {
    const stmt = new WhileStmt(
      new LiteralExpr(true, makeSpan(5, 9)),
      new BlockStmt([], makeSpan(10, 12)),
      makeSpan(0, 12),
    );
    expect(stmt).toBeInstanceOf(WhileStmt);
    expect(stmt.condition).toBeInstanceOf(LiteralExpr);
    expect(stmt.body).toBeInstanceOf(BlockStmt);
    const expectedSpan = makeSpan(0, 12);
    expect(stmt.span).toEqual(expectedSpan);
  });
});

describe("visitor", () => {
  class TestVisitor implements StmtVisitor<void> {
    visitBlockStmt(_stmt: BlockStmt): void {}
    visitBreakStmt(_stmt: BreakStmt): void {}
    visitContinueStmt(_stmt: ContinueStmt): void {}
    visitExprStmt(_stmt: ExprStmt): void {}
    visitFunctionStmt(_stmt: FunctionStmt): void {}
    visitLetStmt(_stmt: LetStmt): void {}
    visitReturnStmt(_stmt: ReturnStmt): void {}
    visitWhileStmt(_stmt: WhileStmt): void {}
  }

  const testVisitor = new TestVisitor();

  it("calls visitBlockStmt", () => {
    const visitorSpy = vi.spyOn(testVisitor, "visitBlockStmt");
    const stmt = new BlockStmt([], makeSpan(0, 2));
    stmt.accept(testVisitor);
    expect(visitorSpy).toHaveBeenCalled();
  });

  it("calls visitBreakStmt", () => {
    const visitorSpy = vi.spyOn(testVisitor, "visitBreakStmt");
    const stmt = new BreakStmt(tok(TokenType.Break, "break"), null, makeSpan(0, 6));
    stmt.accept(testVisitor);
    expect(visitorSpy).toHaveBeenCalled();
  });

  it("calls visitContinueStmt", () => {
    const visitorSpy = vi.spyOn(testVisitor, "visitContinueStmt");
    const stmt = new ContinueStmt(tok(TokenType.Continue, "continue"), makeSpan(0, 9));
    stmt.accept(testVisitor);
    expect(visitorSpy).toHaveBeenCalled();
  });

  it("calls visitExprStmt", () => {
    const visitorSpy = vi.spyOn(testVisitor, "visitExprStmt");
    const stmt = new ExprStmt(new LiteralExpr(5, makeSpan(0, 1)), makeSpan(0, 2));
    stmt.accept(testVisitor);
    expect(visitorSpy).toHaveBeenCalled();
  });

  it("calls visitFunctionStmt", () => {
    const visitorSpy = vi.spyOn(testVisitor, "visitFunctionStmt");
    const stmt = new FunctionStmt(
      tok(TokenType.Identifier, "time", null, 4),
      [],
      new BlockExpr([], null, makeSpan(11, 13)),
      makeSpan(0, 13),
    );
    stmt.accept(testVisitor);
    expect(visitorSpy).toHaveBeenCalled();
  });

  it("calls visitLetStmt", () => {
    const visitorSpy = vi.spyOn(testVisitor, "visitLetStmt");
    const stmt = new LetStmt(
      tok(TokenType.Identifier, "x", null, 5),
      null,
      makeSpan(0, 7),
    );
    stmt.accept(testVisitor);
    expect(visitorSpy).toHaveBeenCalled();
  });

  it("calls visitReturnStmt", () => {
    const visitorSpy = vi.spyOn(testVisitor, "visitReturnStmt");
    const stmt = new ReturnStmt(tok(TokenType.Return, "return"), null, makeSpan(0, 7));
    stmt.accept(testVisitor);
    expect(visitorSpy).toHaveBeenCalled();
  });

  it("calls visitWhileStmt", () => {
    const visitorSpy = vi.spyOn(testVisitor, "visitWhileStmt");
    const stmt = new WhileStmt(
      new LiteralExpr(true, makeSpan(6, 10)),
      new BlockStmt([], makeSpan(12, 14)),
      makeSpan(0, 14),
    );
    stmt.accept(testVisitor);
    expect(visitorSpy).toHaveBeenCalled();
  });
});
