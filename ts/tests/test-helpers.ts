import type { Token, TokenType } from "../src/parser/token.js";
import type { Span } from "../src/types/location.js";

export function makeSpan(start: number, end: number): Span {
  return {
    start: {
      line: 1,
      column: start + 1,
      offset: start,
    },
    end: {
      line: 1,
      column: start + 1,
      offset: start,
    },
  };
}

export function tok(
  type: TokenType,
  lexeme: string,
  literal: string | number | null = null,
  start = 0,
  end = lexeme.length,
): Token {
  return {
    type,
    lexeme,
    literal: literal,
    span: makeSpan(start, end),
  };
}
