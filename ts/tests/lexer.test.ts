import { describe, expect, it } from "vitest";

import { DiagnosticCollector } from "../src/diagnostic/collector.js";
import { Lexer } from "../src/parser/lexer.js";
import { TokenType } from "../src/parser/token.js";

describe("lexer", () => {
  it("emits Eof token on empty string", () => {
    const diagnostics = new DiagnosticCollector();
    const lexer = new Lexer("", diagnostics);
    const tokens = lexer.scan();

    expect(tokens.map((t) => t.type)).toEqual([TokenType.Eof]);
  });

  it("scans punctuation", () => {
    const diagnostics = new DiagnosticCollector();
    const lexer = new Lexer("(){},.;", diagnostics);
    const tokens = lexer.scan();

    expect(diagnostics.hasErrors()).toBe(false);
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
    const lexer = new Lexer(source, diagnostics);
    const tokens = lexer.scan();

    expect(diagnostics.hasErrors()).toBe(false);
    expect(tokens.map((t) => t.type)).toEqual([TokenType.Eof]);
  });

  it("scans arithmetic and comparison operators", () => {
    const diagnostics = new DiagnosticCollector();
    const source = "+-*/% ! != = == > >= < <=";
    const lexer = new Lexer(source, diagnostics);
    const tokens = lexer.scan();

    expect(diagnostics.hasErrors()).toBe(false);
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
    const lexer = new Lexer(source, diagnostics);
    const tokens = lexer.scan();

    expect(diagnostics.hasErrors()).toBe(false);
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
      "continue",
      "false",
      "fn",
      "if",
      "let",
      "nil",
      "or",
      "return",
      "true",
      "while",
    ];
    const lexer = new Lexer(source.join(" "), diagnostics);
    const tokens = lexer.scan();

    expect(diagnostics.hasErrors()).toBe(false);
    const expected = [
      TokenType.And,
      TokenType.Break,
      TokenType.Continue,
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
    const lexer = new Lexer(source, diagnostics);
    const tokens = lexer.scan();

    expect(diagnostics.hasErrors()).toBe(false);
    expect(tokens.map((t) => t.type)).toEqual([TokenType.Eof]);
  });
});
