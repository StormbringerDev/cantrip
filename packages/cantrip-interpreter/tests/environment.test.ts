import { describe, expect, it } from "vitest";
import { Token, TokenType } from "@cantrip/ast";
import type { Span } from "@cantrip/types";
import { Environment } from "../src/environment.js";
import { RuntimeError } from "../src/interpreter.js";

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

describe("environment", () => {
  it("defines a variable with a value", () => {
    const environment = new Environment();
    environment.define("x", 42);
    expect((environment as any).values.size).toBe(1);
    expect((environment as any).values.has("x")).toBe(true);
    expect((environment as any).values.get("x")).toBe(42);
  });

  it("defines a variable with no value", () => {
    const environment = new Environment();
    environment.define("x", null);
    expect((environment as any).values.size).toBe(1);
    expect((environment as any).values.has("x")).toBe(true);
    expect((environment as any).values.get("x")).toBe(null);
  });

  it("gets a variable's value", () => {
    const environment = new Environment();
    environment.define("name", "StormbringerDev");
    expect(environment.get(tok(TokenType.Identifier, "name"))).toBe("StormbringerDev");
  });

  it("throws a RuntimeError on get if variable is not found", () => {
    const environment = new Environment();
    expect(() => environment.get(tok(TokenType.Identifier, "name"))).toThrow(
      RuntimeError,
    );
  });

  it("assigns a value to an existing variable", () => {
    const environment = new Environment();
    environment.define("x", 42);
    const name = tok(TokenType.Identifier, "x");
    environment.assign(name, 42);
    expect(environment.get(name)).toBe(42);
  });

  it("throws a RuntimeError on assign if variable is not found", () => {
    const environment = new Environment();
    const name = tok(TokenType.Identifier, "x");
    expect(() => environment.assign(name, 42)).toThrow(RuntimeError);
  });
});
