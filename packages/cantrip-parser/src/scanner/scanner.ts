import type { Position } from "@cantrip/types";
import { Token, TokenType } from "./token.js";

// Utility character checks
function isDigit(char: string): boolean {
  return char >= "0" && char <= "9";
}

function isAlpha(char: string): boolean {
  return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z") || char === "_";
}

function isAlphaNumeric(char: string): boolean {
  return isAlpha(char) || isDigit(char);
}

// Keyword map
const keywords = new Map<string, TokenType>();
keywords.set("and", TokenType.And);
keywords.set("else", TokenType.Else);
keywords.set("false", TokenType.False);
keywords.set("fn", TokenType.Fn);
keywords.set("if", TokenType.If);
keywords.set("let", TokenType.Let);
keywords.set("loop", TokenType.Loop);
keywords.set("nil", TokenType.Nil);
keywords.set("or", TokenType.Or);
keywords.set("return", TokenType.Return);
keywords.set("true", TokenType.True);
keywords.set("while", TokenType.While);

export class ScannerError extends Error {
  public readonly position: Position;

  constructor(position: Position, message: string) {
    super(message);
    this.name = "ScannerError";
    this.position = position;
  }
}

export class Scanner {
  private source: string;
  private tokens: Token[] = [];
  private errors: Error[] = [];
  private line = 0;
  private column = 0;
  private offset = 0;

  constructor(source: string) {
    this.source = source;
  }

  scanTokens(): { tokens: Token[]; errors: Error[] } {
    while (!this.isAtEnd()) {
      this.scanToken();
    }

    this.tokens.push({
      type: TokenType.Eof,
      lexeme: "",
      literal: null,
      span: {
        start: {
          line: this.line,
          column: this.column++,
          offset: this.offset++,
        },
        end: {
          line: this.line,
          column: this.column,
          offset: this.offset,
        },
      },
    });
    return { tokens: this.tokens, errors: this.errors };
  }

  private scanToken() {
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
      case "[":
        this.addToken(TokenType.LeftBracket, start);
        break;
      case "]":
        this.addToken(TokenType.RightBracket, start);
        break;
      case ";":
        this.addToken(TokenType.Semicolon, start);
        break;
      case ":":
        this.addToken(TokenType.Colon, start);
        break;
      case ",":
        this.addToken(TokenType.Comma, start);
        break;
      case "+":
        this.addToken(this.match("=") ? TokenType.PlusEq : TokenType.Plus, start);
        break;
      case "-":
        if (this.match("=")) {
          this.addToken(TokenType.MinusEq, start);
        } else if (this.match(">")) {
          this.addToken(TokenType.Arrow, start);
        } else {
          this.addToken(TokenType.Minus, start);
        }
        break;
      case "*":
        this.addToken(this.match("=") ? TokenType.StarEq : TokenType.Star, start);
        break;
      case "/":
        if (this.match("=")) {
          this.addToken(TokenType.SlashEq, start);
        } else if (this.match("/")) {
          while (this.peek() != "\n" && !this.isAtEnd()) this.advance();
        } else {
          this.addToken(TokenType.Slash, start);
        }
        break;
      case "%":
        this.addToken(this.match("=") ? TokenType.PercentEq : TokenType.Percent, start);
        break;
      case "!":
        this.addToken(this.match("=") ? TokenType.BangEq : TokenType.Bang, start);
        break;
      case "=":
        if (this.match("=")) {
          this.addToken(TokenType.EqEq, start);
        } else if (this.match(">")) {
          this.addToken(TokenType.FatArrow, start);
        } else {
          this.addToken(TokenType.Eq, start);
        }
        break;
      case "<":
        this.addToken(this.match("=") ? TokenType.LessEq : TokenType.Less, start);
        break;
      case ">":
        this.addToken(this.match("=") ? TokenType.GreaterEq : TokenType.Greater, start);
        break;
      case '"':
        this.addString(start);
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
          this.addNumber(start);
        } else if (isAlpha(char)) {
          this.addIdentifier(start);
        } else {
          this.errors.push(new ScannerError(start, `Unexpected character '${char}'.`));
        }
    }
  }

  // Generic tokens
  private addToken(type: TokenType, start: Position, literal?: number | string) {
    const end: Position = {
      line: this.line,
      column: this.column,
      offset: this.offset,
    };
    const text = this.source.substring(start.offset, end.offset);
    this.tokens.push(new Token(type, text, literal ?? null, { start, end }));
  }

  // Literal tokens
  private addNumber(start: Position) {
    while (isDigit(this.peek())) this.advance();

    // Look for decimal point
    if (this.peek() === "." && isDigit(this.peekNext())) {
      // Consume the decimal point
      this.advance();

      // Advance through the rest of the number
      while (isDigit(this.peek())) this.advance();
    }

    // Record end position to determine number value
    const end: Position = {
      line: this.line,
      column: this.column,
      offset: this.offset,
    };
    this.addToken(
      TokenType.Number,
      start,
      parseFloat(this.source.substring(start.offset, end.offset)),
    );
  }

  private addString(start: Position) {
    while (this.peek() != '"' && !this.isAtEnd()) {
      if (this.peek() == "\n") {
        this.line++;
        this.column = 1;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      this.errors.push(new ScannerError(start, "Unterminated string."));
    }

    // Consume closing quote
    this.advance();

    // Record ending position to determine string value
    const end: Position = {
      line: this.line,
      column: this.column,
      offset: this.offset,
    };

    // Trim surrounding quotes
    const value = this.source.substring(start.offset + 1, end.offset - 1);
    this.addToken(TokenType.String, start, value);
  }

  private addIdentifier(start: Position) {
    // Continue to consume characters until a non alphanumeric character is encountered
    while (isAlphaNumeric(this.peek())) this.advance();

    const end: Position = {
      line: this.line,
      column: this.column,
      offset: this.offset,
    };
    const text = this.source.substring(start.offset, end.offset);
    let type = keywords.get(text);
    type ??= TokenType.Identifier;
    this.addToken(type, start);
  }

  // Check if offset is at source length
  private isAtEnd(): boolean {
    return this.offset >= this.source.length;
  }

  // Consume and return current character
  private advance(): string {
    this.column++;
    return this.source.charAt(this.offset++);
  }

  // Consume current character if and only if it matches expected
  private match(expected: string) {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.offset) != expected) return false;

    this.column++;
    this.offset++;
    return true;
  }

  // Lookahead methods (up to 2 characters)
  private peek(): string {
    if (this.isAtEnd()) return "";
    return this.source.charAt(this.offset);
  }

  private peekNext(): string {
    if (this.offset + 1 >= this.source.length) return "";
    return this.source.charAt(this.offset + 1);
  }
}
