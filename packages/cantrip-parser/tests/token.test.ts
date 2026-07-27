import { describe, expect, it } from "vitest";
import { Token, TokenType } from "../src/scanner/index.js";
import type { Span } from "@cantrip/types";

describe("Token", () => {
  it("instantiates a token of type LeftParen", () => {
    const span: Span = {
      start: {
        line: 0,
        column: 0,
        offset: 0,
      },
      end: {
        line: 0,
        column: 1,
        offset: 1,
      },
    };
    const token = new Token(TokenType.LeftParen, "(", null, span);
    expect(token.type).toBe(TokenType.LeftParen);
    expect(token.lexeme).toBe("(");
    expect(token.literal).toBeNull();
  });

  it("instantiates a token of type Number with literal 42", () => {
    const span: Span = {
      start: {
        line: 0,
        column: 0,
        offset: 0,
      },
      end: {
        line: 0,
        column: 2,
        offset: 2,
      },
    };
    const token = new Token(TokenType.Number, "42", 42, span);
    expect(token.type).toBe(TokenType.Number);
    expect(token.lexeme).toBe("42");
    expect(token.literal).toBe(42);
  });

  it("instantiates a token of type String with literal 'Hello, world!'", () => {
    const span: Span = {
      start: {
        line: 0,
        column: 0,
        offset: 0,
      },
      end: {
        line: 0,
        column: 14,
        offset: 14,
      },
    };
    const token = new Token(TokenType.String, '"Hello, world!"', "Hello, world!", span);
    expect(token.type).toBe(TokenType.String);
    expect(token.lexeme).toBe('"Hello, world!"');
    expect(token.literal).toBe("Hello, world!");
  });

  it("instantiates a token of type Identifier with lexeme 'name'", () => {
    const span: Span = {
      start: {
        line: 0,
        column: 0,
        offset: 0,
      },
      end: {
        line: 0,
        column: 4,
        offset: 4,
      },
    };
    const token = new Token(TokenType.Identifier, "name", null, span);
    expect(token.type).toBe(TokenType.Identifier);
    expect(token.lexeme).toBe("name");
    expect(token.literal).toBeNull();
  });
});
