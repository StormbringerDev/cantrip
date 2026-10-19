import { DiagnosticCollector } from "../diagnostic/collector.js";
import { error } from "../diagnostic/create.js";
import { type Position, spanAt } from "../types/location.js";
import { TokenType, type Token } from "./token.js";

// --- Character helpers -------------------------------------------------------

function isDigit(char: string): boolean {
  return char >= "0" && char <= "9";
}

function isAlpha(char: string): boolean {
  return (
    (char >= "a" && char <= "z") || (char >= "A" && char <= "Z") || char === "_"
  );
}

// --- Keyword lookup ----------------------------------------------------------

const keywords = new Map<string, TokenType>([
  ["and", TokenType.And],
  ["break", TokenType.Break],
  ["continue", TokenType.Continue],
  ["false", TokenType.False],
  ["fn", TokenType.Fn],
  ["if", TokenType.If],
  ["let", TokenType.Let],
  ["nil", TokenType.Nil],
  ["or", TokenType.Or],
  ["return", TokenType.Return],
  ["true", TokenType.True],
  ["while", TokenType.While],
]);

export class Lexer {
  private readonly source: string;
  private readonly diagnostics: DiagnosticCollector;
  private readonly tokens: Token[] = [];

  private line = 1;
  private column = 1;
  private offset = 0;

  constructor(source: string, diagnostics: DiagnosticCollector) {
    this.source = source;
    this.diagnostics = diagnostics;
  }

  scan(): Token[] {
    while (!this.isAtEnd()) {
      this.scanToken();
    }

    this.tokens.push({
      type: TokenType.Eof,
      lexeme: "",
      literal: null,
      span: spanAt({
        line: this.line,
        column: this.column,
        offset: this.offset,
      }),
    });
    return this.tokens;
  }

  private scanToken(): void {
    const start: Position = {
      line: this.line,
      column: this.column,
      offset: this.offset,
    };
    const char = this.advance();
    switch (char) {
      case "(":
        this.addToken(TokenType.LeftParen, start);
        break;
      case ")":
        this.addToken(TokenType.RightParen, start);
        break;
      case "{":
        this.addToken(TokenType.LeftBrace, start);
        break;
      case "}":
        this.addToken(TokenType.RightBrace, start);
        break;
      case ",":
        this.addToken(TokenType.Comma, start);
        break;
      case ".":
        this.addToken(TokenType.Dot, start);
        break;
      case ";":
        this.addToken(TokenType.Semicolon, start);
        break;
      case "+":
        this.addToken(TokenType.Plus, start);
        break;
      case "-":
        this.addToken(TokenType.Minus, start);
        break;
      case "*":
        this.addToken(TokenType.Star, start);
        break;
      case "/":
        if (this.match("/")) {
          while (this.peek() != "\n" && !this.isAtEnd()) this.advance();
        } else if (this.match("*")) {
          this.blockComment();
        } else {
          this.addToken(TokenType.Slash, start);
        }
        break;
      case "%":
        this.addToken(TokenType.Percent, start);
        break;
      case "!":
        this.addToken(
          this.match("=") ? TokenType.BangEq : TokenType.Bang,
          start,
        );
        break;
      case "=":
        this.addToken(this.match("=") ? TokenType.EqEq : TokenType.Eq, start);
        break;
      case ">":
        this.addToken(
          this.match("=") ? TokenType.GreaterEq : TokenType.Greater,
          start,
        );
        break;
      case "<":
        this.addToken(
          this.match("=") ? TokenType.LessEq : TokenType.Less,
          start,
        );
        break;
      case '"':
        this.string('"', start);
        break;
      case "'":
        this.string("'", start);
        break;
      // Ignore whitespace
      case " ":
      case "\r":
      case "\t":
        break;
      case "\n":
        this.line++;
        this.column = 1;
        break;
      default:
        if (isDigit(char)) {
          this.number(start);
        } else if (isAlpha(char)) {
          this.identifier(start);
        } else {
          this.diagnostics.emit(
            error("unexpected character", {
              start,
              end: {
                line: this.line,
                column: this.column,
                offset: this.offset,
              },
            }),
          );
        }
        break;
    }
  }

  // --- Token helpers ---------------------------------------------------------

  private addToken(
    type: TokenType,
    start: Position,
    literal: number | string | null = null,
  ): void {
    const end: Position = {
      line: this.line,
      column: this.column,
      offset: this.offset,
    };
    const text = this.source.substring(start.offset, this.offset);
    this.tokens.push({ type, lexeme: text, literal, span: { start, end } });
  }

  private identifier(start: Position): void {
    while (isAlpha(this.peek()) || isDigit(this.peek())) this.advance();

    const text = this.source.substring(start.offset, this.offset);
    const type = keywords.get(text) ?? TokenType.Identifier;
    this.addToken(type, start);
  }

  private string(quote: '"' | "'", start: Position): void {
    while (this.peek() !== quote && !this.isAtEnd()) {
      if (this.peek() === "\n") {
        this.line++;
        this.column = 1;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      const end: Position = {
        line: start.line + 1,
        column: start.column + 1,
        offset: start.offset + 1,
      };
      this.diagnostics.emit(error("unterminated string", { start, end }));
    }

    // Closing quote
    this.advance();

    // Trim surrounding quotes
    const value = this.source.substring(start.offset + 1, this.offset - 1);
    this.addToken(TokenType.String, start, value);
  }

  private number(start: Position): void {
    while (isDigit(this.peek())) this.advance();

    // Look for decimal point
    if (this.peek() === "." && isDigit(this.peekNext())) {
      // Consume '.'
      this.advance();

      while (isDigit(this.peek())) this.advance();
    }

    this.addToken(
      TokenType.Number,
      start,
      Number(this.source.substring(start.offset, this.offset)),
    );
  }

  private blockComment(): void {
    while (this.peek() !== "*" && this.peekNext() !== "/" && !this.isAtEnd()) {
      if (this.peek() === "\n") {
        this.line++;
        this.column = 1;
      }
      this.advance();
    }

    // The closing '*/'
    this.advance();
    this.advance();
  }

  // --- Low-level source traversal methods ------------------------------------

  private advance(): string {
    return this.source.charAt(this.offset++);
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.offset) !== expected) return false;

    this.offset++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.source.charAt(this.offset);
  }

  private peekNext(): string {
    if (this.offset + 1 >= this.source.length) return "\0";
    return this.source.charAt(this.offset + 1);
  }

  private isAtEnd(): boolean {
    return this.offset >= this.source.length;
  }
}
