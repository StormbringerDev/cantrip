import { describe, expect, it } from "vitest";
import { Token, TokenType } from "../src/token.js";
import type { Span } from "@cantrip/types";

/** Create single-line Span from start/end offsets (column == offset) */
function makeSpan(start: number, end: number): Span {
  return {
    start: { line: 0, column: start, offset: start },
    end: { line: 0, column: end, offset: end },
  };
}

describe("Token", () => {
  it("instantiates a token", () => {
    const token = new Token(TokenType.And, "and", null, makeSpan(0, 3));
    expect(token).toBeInstanceOf(Token);
    expect(token.type).toBe(TokenType.And);
    expect(token.lexeme).toBe("and");
    expect(token.literal).toBeNull();
    const expectedSpan = makeSpan(0, 3);
    expect(token.span).toStrictEqual(expectedSpan);
  });
});
