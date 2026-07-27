import { describe, expect, it } from "vitest";
import { Token, TokenType } from "../src/scanner/index.js";

describe("Token", () => {
  it("instantiates a token of type LeftParen", () => {
    const token = new Token(TokenType.LeftParen, "(", null);
    expect(token.type).toBe(TokenType.LeftParen);
    expect(token.lexeme).toBe("(");
    expect(token.literal).toBeNull();
  });

  it("instantiates a token of type Number with literal 42", () => {
    const token = new Token(TokenType.Number, "42", 42);
    expect(token.type).toBe(TokenType.Number);
    expect(token.lexeme).toBe("42");
    expect(token.literal).toBe(42);
  });

  it("instantiates a token of type String with literal 'Hello, world!'", () => {
    const token = new Token(TokenType.String, '"Hello, world!"', "Hello, world!");
    expect(token.type).toBe(TokenType.String);
    expect(token.lexeme).toBe('"Hello, world!"');
    expect(token.literal).toBe("Hello, world!");
  });

  it("instantiates a token of type Identifier with lexeme 'name'", () => {
    const token = new Token(TokenType.Identifier, "name", null);
    expect(token.type).toBe(TokenType.Identifier);
    expect(token.lexeme).toBe("name");
    expect(token.literal).toBeNull();
  });
});
