import { describe, expect, it } from "vitest";

import { DiagnosticCollector } from "../src/diagnostic/collector.js";
import { Lexer } from "../src/parser/lexer.js";
import { TokenType } from "../src/parser/token.js";

describe("lexer", () => {
  it("emits Eof token on empty string", () => {
    const diagnostics = new DiagnosticCollector();
    const tokens = new Lexer("", diagnostics).scan();

    expect(tokens.map((t) => t.type)).toEqual([TokenType.Eof]);
  });

  it("scans punctuation", () => {
    const diagnostics = new DiagnosticCollector();
    const tokens = new Lexer("(){},.;", diagnostics).scan();

    expect(diagnostics.hasError()).toBe(false);
    const expected = [
      TokenType.LeftParen,
      TokenType.RightParen,
      TokenType.LeftBrace,
      TokenType.RightBrace,
      TokenType.Comma,
      TokenType.Dot,
      TokenType.Semicolon,
      TokenType.Eof,
    ];
    expect(tokens.map((t) => t.type)).toEqual(expected);
  });

  it("ignores whitespace", () => {
    const diagnostics = new DiagnosticCollector();
    const source = " \r\t\n";
    const tokens = new Lexer(source, diagnostics).scan();

    expect(diagnostics.hasError()).toBe(false);
    expect(tokens.map((t) => t.type)).toEqual([TokenType.Eof]);
  });

  it("scans arithmetic and comparison operators", () => {
    const diagnostics = new DiagnosticCollector();
    const source = "+-*/% ! != = == > >= < <=";
    const tokens = new Lexer(source, diagnostics).scan();

    expect(diagnostics.hasError()).toBe(false);
    const expected = [
      TokenType.Plus,
      TokenType.Minus,
      TokenType.Star,
      TokenType.Slash,
      TokenType.Percent,
      TokenType.Bang,
      TokenType.BangEq,
      TokenType.Eq,
      TokenType.EqEq,
      TokenType.Greater,
      TokenType.GreaterEq,
      TokenType.Less,
      TokenType.LessEq,
      TokenType.Eof,
    ];
    expect(tokens.map((t) => t.type)).toEqual(expected);
  });

  it("scans identifiers and string & number literals", () => {
    const diagnostics = new DiagnosticCollector();
    const source = `total total_2 Location "Hello!" 'Hi!' 42 3.14`;
    const tokens = new Lexer(source, diagnostics).scan();

    expect(diagnostics.hasError()).toBe(false);
    const expected = [
      TokenType.Identifier,
      TokenType.Identifier,
      TokenType.Identifier,
      TokenType.String,
      TokenType.String,
      TokenType.Number,
      TokenType.Number,
      TokenType.Eof,
    ];
    expect(tokens.map((t) => t.type)).toEqual(expected);
  });

  it("scans keywords", () => {
    const diagnostics = new DiagnosticCollector();
    const source = [
      "and",
      "break",
      "const",
      "continue",
      "else",
      "false",
      "fn",
      "if",
      "let",
      "nil",
      "or",
      "return",
      "true",
      "while",
    ].join(" ");
    const tokens = new Lexer(source, diagnostics).scan();

    expect(diagnostics.hasError()).toBe(false);
    const expected = [
      TokenType.And,
      TokenType.Break,
      TokenType.Const,
      TokenType.Continue,
      TokenType.Else,
      TokenType.False,
      TokenType.Fn,
      TokenType.If,
      TokenType.Let,
      TokenType.Nil,
      TokenType.Or,
      TokenType.Return,
      TokenType.True,
      TokenType.While,
      TokenType.Eof,
    ];
    expect(tokens.map((t) => t.type)).toEqual(expected);
  });

  it("ignores comments", () => {
    const diagnostics = new DiagnosticCollector();
    const source = "// This is a comment.\n/*\nThis is also a comment.\n*/";
    const tokens = new Lexer(source, diagnostics).scan();

    expect(diagnostics.hasError()).toBe(false);
    expect(tokens.map((t) => t.type)).toEqual([TokenType.Eof]);
  });
});
