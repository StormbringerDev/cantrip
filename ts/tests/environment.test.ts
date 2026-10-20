import { describe, expect, it } from "vitest";

import { Environment } from "../src/interpreter/environment.js";
import { TokenType } from "../src/parser/token.js";

import { tok } from "./test-helpers.js";

describe("environment", () => {
  it("defines a variable", () => {
    const environment = new Environment();
    environment.define("answer", 42);
    expect((environment as any).values.get("answer")).toBe(42);
  });

  it("retrieves a variable value", () => {
    const environment = new Environment();
    environment.define("answer", 42);
    const name = tok(TokenType.Identifier, "answer");
    expect(environment.get(name)).toBe(42);
  });

  it("retrieves a variable value from enclosing scope", () => {
    const outer = new Environment();
    outer.define("answer", 42);
    const inner = new Environment(outer);
    const name = tok(TokenType.Identifier, "answer");
    expect(inner.get(name)).toBe(42);
  });

  it("throws an error when getting a variable that isn't defined", () => {
    const environment = new Environment();
    const name = tok(TokenType.Identifier, "notHere");
    expect(() => environment.get(name)).toThrow(
      `undefined variable '${name.lexeme}'`,
    );
  });

  it("assigns an existing variable", () => {
    const environment = new Environment();
    environment.define("answer", null);
    const name = tok(TokenType.Identifier, "answer");
    environment.assign(name, 42);
    expect(environment.get(name)).toBe(42);
  });

  it("assigns an existing variable in enclosing scope", () => {
    const outer = new Environment();
    outer.define("answer", null);
    const inner = new Environment(outer);
    const name = tok(TokenType.Identifier, "answer");
    inner.assign(name, 42);
    expect(inner.get(name)).toBe(42);
  });

  it("throws an error when assigning a variable that isn't defined", () => {
    const environment = new Environment();
    const name = tok(TokenType.Identifier, "notHere");
    expect(() => environment.assign(name, 69)).toThrow(
      `undefined variable '${name.lexeme}'`,
    );
  });
});
