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

describe("to string", () => {
  it("converts tokens to strings", () => {
    const tokens = [
      tok(TokenType.LeftParen, "("),
      tok(TokenType.RightParen, ")"),
      tok(TokenType.LeftBrace, "{"),
      tok(TokenType.RightBrace, "}"),
      tok(TokenType.LeftBracket, "["),
      tok(TokenType.RightBracket, "]"),
      tok(TokenType.Colon, ":"),
      tok(TokenType.Comma, ","),
      tok(TokenType.Dot, "."),
      tok(TokenType.Semicolon, ";"),
      tok(TokenType.Arrow, "->"),
      tok(TokenType.FatArrow, "=>"),
      tok(TokenType.Bang, "!"),
      tok(TokenType.BangEq, "!="),
      tok(TokenType.Eq, "="),
      tok(TokenType.EqEq, "=="),
      tok(TokenType.Greater, ">"),
      tok(TokenType.GreaterEq, ">="),
      tok(TokenType.Less, "<"),
      tok(TokenType.LessEq, "<="),
      tok(TokenType.Minus, "-"),
      tok(TokenType.MinusEq, "-="),
      tok(TokenType.Percent, "%"),
      tok(TokenType.PercentEq, "%="),
      tok(TokenType.Plus, "+"),
      tok(TokenType.PlusEq, "+="),
      tok(TokenType.Slash, "/"),
      tok(TokenType.SlashEq, "/="),
      tok(TokenType.Star, "*"),
      tok(TokenType.StarEq, "*="),
      tok(TokenType.Identifier, "x"),
      tok(TokenType.String, '"Hello"', "Hello"),
      tok(TokenType.Number, "42", 42),
      tok(TokenType.And, "and"),
      tok(TokenType.Break, "break"),
      tok(TokenType.Continue, "continue"),
      tok(TokenType.Else, "else"),
      tok(TokenType.False, "false"),
      tok(TokenType.Fn, "fn"),
      tok(TokenType.If, "if"),
      tok(TokenType.Let, "let"),
      tok(TokenType.Loop, "loop"),
      tok(TokenType.Match, "match"),
      tok(TokenType.Nil, "nil"),
      tok(TokenType.Or, "or"),
      tok(TokenType.Return, "return"),
      tok(TokenType.True, "true"),
      tok(TokenType.While, "while"),
      tok(TokenType.Eof, ""),
    ];
    const result: string[] = [];
    for (const token of tokens) {
      result.push(token.toString());
    }
    const expected = [
      "LeftParen ( null\n    start: line 1, column 1\n    end: line 1, column 2",
      "RightParen ) null\n    start: line 1, column 1\n    end: line 1, column 2",
      "LeftBrace { null\n    start: line 1, column 1\n    end: line 1, column 2",
      "RightBrace } null\n    start: line 1, column 1\n    end: line 1, column 2",
      "LeftBracket [ null\n    start: line 1, column 1\n    end: line 1, column 2",
      "RightBracket ] null\n    start: line 1, column 1\n    end: line 1, column 2",
      "Colon : null\n    start: line 1, column 1\n    end: line 1, column 2",
      "Comma , null\n    start: line 1, column 1\n    end: line 1, column 2",
      "Dot . null\n    start: line 1, column 1\n    end: line 1, column 2",
      "Semicolon ; null\n    start: line 1, column 1\n    end: line 1, column 2",
      "Arrow -> null\n    start: line 1, column 1\n    end: line 1, column 3",
      "FatArrow => null\n    start: line 1, column 1\n    end: line 1, column 3",
      "Bang ! null\n    start: line 1, column 1\n    end: line 1, column 2",
      "BangEq != null\n    start: line 1, column 1\n    end: line 1, column 3",
      "Eq = null\n    start: line 1, column 1\n    end: line 1, column 2",
      "EqEq == null\n    start: line 1, column 1\n    end: line 1, column 3",
      "Greater > null\n    start: line 1, column 1\n    end: line 1, column 2",
      "GreaterEq >= null\n    start: line 1, column 1\n    end: line 1, column 3",
      "Less < null\n    start: line 1, column 1\n    end: line 1, column 2",
      "LessEq <= null\n    start: line 1, column 1\n    end: line 1, column 3",
      "Minus - null\n    start: line 1, column 1\n    end: line 1, column 2",
      "MinusEq -= null\n    start: line 1, column 1\n    end: line 1, column 3",
      "Percent % null\n    start: line 1, column 1\n    end: line 1, column 2",
      "PercentEq %= null\n    start: line 1, column 1\n    end: line 1, column 3",
      "Plus + null\n    start: line 1, column 1\n    end: line 1, column 2",
      "PlusEq += null\n    start: line 1, column 1\n    end: line 1, column 3",
      "Slash / null\n    start: line 1, column 1\n    end: line 1, column 2",
      "SlashEq /= null\n    start: line 1, column 1\n    end: line 1, column 3",
      "Star * null\n    start: line 1, column 1\n    end: line 1, column 2",
      "StarEq *= null\n    start: line 1, column 1\n    end: line 1, column 3",
      "Identifier x null\n    start: line 1, column 1\n    end: line 1, column 2",
      'String "Hello" Hello\n    start: line 1, column 1\n    end: line 1, column 8',
      "Number 42 42\n    start: line 1, column 1\n    end: line 1, column 3",
      "And and null\n    start: line 1, column 1\n    end: line 1, column 4",
      "Break break null\n    start: line 1, column 1\n    end: line 1, column 6",
      "Continue continue null\n    start: line 1, column 1\n    end: line 1, column 9",
      "Else else null\n    start: line 1, column 1\n    end: line 1, column 5",
      "False false null\n    start: line 1, column 1\n    end: line 1, column 6",
      "Fn fn null\n    start: line 1, column 1\n    end: line 1, column 3",
      "If if null\n    start: line 1, column 1\n    end: line 1, column 3",
      "Let let null\n    start: line 1, column 1\n    end: line 1, column 4",
      "Loop loop null\n    start: line 1, column 1\n    end: line 1, column 5",
      "Match match null\n    start: line 1, column 1\n    end: line 1, column 6",
      "Nil nil null\n    start: line 1, column 1\n    end: line 1, column 4",
      "Or or null\n    start: line 1, column 1\n    end: line 1, column 3",
      "Return return null\n    start: line 1, column 1\n    end: line 1, column 7",
      "True true null\n    start: line 1, column 1\n    end: line 1, column 5",
      "While while null\n    start: line 1, column 1\n    end: line 1, column 6",
      "Eof  null\n    start: line 1, column 1\n    end: line 1, column 1",
    ];
    expect(result).toEqual(expected);
  });
});
