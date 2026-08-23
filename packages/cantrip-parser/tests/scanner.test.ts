import { describe, expect, it } from "vitest";
import { Scanner } from "../src/scanner.js";
import { TokenType } from "@cantrip/ast";
import { DiagnosticCollector } from "@cantrip/diagnostics";

describe("Scanner", () => {
  it("emits an Eof token when scanning is complete", () => {
    const diagnostics = new DiagnosticCollector();
    const scanner = new Scanner("", diagnostics, "<test>");
    const tokens = scanner.scanTokens();
    expect(diagnostics.hasErrors()).toBe(false);
    expect(tokens).toHaveLength(1);
    expect(tokens.at(-1)!.type).toBe(TokenType.Eof);
  });

  it("scans arithmetic, comparison, assignment, and grouping operators", () => {
    const diagnostics = new DiagnosticCollector();
    const scanner = new Scanner(
      "((4 + 2) * 3.14 / 3) != 0 <= 1 >= 2 == 3 % 4 -> 5 => 6 += 7 -= 8 *= 9 /= 10 %= 11",
      diagnostics,
      "<test>",
    );
    const tokens = scanner.scanTokens();

    expect(diagnostics.hasErrors()).toBe(false);
    const expected = [
      TokenType.LeftParen,
      TokenType.LeftParen,
      TokenType.Number,
      TokenType.Plus,
      TokenType.Number,
      TokenType.RightParen,
      TokenType.Star,
      TokenType.Number,
      TokenType.Slash,
      TokenType.Number,
      TokenType.RightParen,
      TokenType.BangEq,
      TokenType.Number,
      TokenType.LessEq,
      TokenType.Number,
      TokenType.GreaterEq,
      TokenType.Number,
      TokenType.EqEq,
      TokenType.Number,
      TokenType.Percent,
      TokenType.Number,
      TokenType.Arrow,
      TokenType.Number,
      TokenType.FatArrow,
      TokenType.Number,
      TokenType.PlusEq,
      TokenType.Number,
      TokenType.MinusEq,
      TokenType.Number,
      TokenType.StarEq,
      TokenType.Number,
      TokenType.SlashEq,
      TokenType.Number,
      TokenType.PercentEq,
      TokenType.Number,
      TokenType.Eof,
    ];

    expect(tokens.map((t) => t.type)).toEqual(expected);
  });

  it("scans keywords, identifiers, strings, brackets, and remaining punctuation", () => {
    const diagnostics = new DiagnosticCollector();
    const scanner = new Scanner(
      `
      fn main() {
        let answer: number = 42;
        if true or false {
          return "hello";
        } else {
          loop {
            while false and true {
              print(answer.abs())
              continue;
            }
            break;
          }
        }
        [1, 2, nil];
        match answer {
          42 => print("I understand everything"),
          _ => print("Still searching"),
        }
      }
    `,
      diagnostics,
      "<test>",
    );

    const tokens = scanner.scanTokens();
    expect(diagnostics.hasErrors()).toBe(false);
    const types = tokens.map((t) => t.type);

    expect(types).toContain(TokenType.Fn);
    expect(types).toContain(TokenType.Let);
    expect(types).toContain(TokenType.If);
    expect(types).toContain(TokenType.True);
    expect(types).toContain(TokenType.Return);
    expect(types).toContain(TokenType.String);
    expect(types).toContain(TokenType.Else);
    expect(types).toContain(TokenType.And);
    expect(types).toContain(TokenType.Or);
    expect(types).toContain(TokenType.Loop);
    expect(types).toContain(TokenType.While);
    expect(types).toContain(TokenType.Continue);
    expect(types).toContain(TokenType.Dot);
    expect(types).toContain(TokenType.Break);
    expect(types).toContain(TokenType.False);
    expect(types).toContain(TokenType.Nil);
    expect(types).toContain(TokenType.LeftBrace);
    expect(types).toContain(TokenType.RightBrace);
    expect(types).toContain(TokenType.Match);
    expect(types).toContain(TokenType.LeftBracket);
    expect(types).toContain(TokenType.RightBracket);
    expect(types).toContain(TokenType.Colon);
    expect(types).toContain(TokenType.Comma);
    expect(types).toContain(TokenType.Semicolon);
    expect(types).toContain(TokenType.Identifier);
    expect(types.at(-1)).toBe(TokenType.Eof);
  });

  it("handles bang and other single-character leftovers", () => {
    const diagnostics = new DiagnosticCollector();
    // I know the source string is illogical, but the scanner only emits tokens and I'm
    // testing that the correct tokens are emitted
    const scanner = new Scanner("!x -y", diagnostics, "<test>");
    const tokens = scanner.scanTokens();
    expect(diagnostics.hasErrors()).toBe(false);
    expect(tokens.map((t) => t.type)).toEqual([
      TokenType.Bang,
      TokenType.Identifier,
      TokenType.Minus,
      TokenType.Identifier,
      TokenType.Eof,
    ]);
  });

  it("ignores comments", () => {
    const diagnostics = new DiagnosticCollector();
    const scanner = new Scanner("// Very important comment", diagnostics, "<test>");
    const tokens = scanner.scanTokens();
    expect(diagnostics.hasErrors()).toBe(false);
    expect(tokens).toHaveLength(1);
  });

  it("handles escape sequences in string literals", () => {
    const diagnostics = new DiagnosticCollector();
    const scanner = new Scanner(
      String.raw`
      "This string has a \"substring\"."
      "\tThis string starts with a tab."
      "\nThis string starts with a newline."
      "Escape sequences are written with \\."
    `,
      diagnostics,
      "<test>",
    );
    const tokens = scanner.scanTokens();

    expect(diagnostics.hasErrors()).toBe(false);

    const expected = [
      'This string has a "substring".',
      "\tThis string starts with a tab.",
      "\nThis string starts with a newline.",
      "Escape sequences are written with \\.",
    ];

    const values = tokens.map((t) => t.literal);
    expect(values.slice(0, 4)).toEqual(expected);
  });
});
