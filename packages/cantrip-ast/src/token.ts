import { assertNever, type Span } from "@cantrip/types";

/** Possible literal values attached to a token. */
type TokenLiteral = number | string | null;

/**
 * A single lexical token produced by the Cantrip scanner.
 *
 * Tokens carry their type, the original source text (lexeme),
 * an optional literal value, and the source span they occupy.
 */
export class Token {
  /** Discriminated token kind. */
  readonly type: TokenType;
  /** Exact text from the source that produced this token. */
  readonly lexeme: string;
  /**
   * Parsed literal value for number / string tokens.
   * `null` for all other token kinds.
   */
  readonly literal: TokenLiteral;
  /** Source location of this token. */
  readonly span: Span;

  /**
   * @param type - Token kind.
   * @param lexeme - Raw source text.
   * @param literal - Parsed value (numbers & strings only).
   * @param span - Source span.
   */
  constructor(type: TokenType, lexeme: string, literal: TokenLiteral, span: Span) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.span = span;
  }

  /**
   * Human-readable representation useful for debugging.
   *
   * Includes token type, lexeme, literal, and 1-based line/column
   * information derived from the span.
   */
  toString(): string {
    return `${tokenTypeToString(this.type)} ${this.lexeme} ${this.literal as string}
    start: line ${this.span.start.line + 1}, column ${this.span.start.column + 1}
    end: line ${this.span.end.line + 1}, column ${this.span.end.column + 1}`;
  }
}

/**
 * Enumeration of every token kind recognized by the Cantrip lexer.
 *
 * Grouped into:
 * - Single-character punctuation
 * - One- or two-character operators
 * - Literals
 * - Keywords
 * - End-of-file
 */
export enum TokenType {
  // Single character
  LeftParen,
  RightParen,
  LeftBrace, // {
  RightBrace, // }
  LeftBracket, // [
  RightBracket, // ]
  Colon,
  Comma,
  Dot,
  Semicolon,

  // One or two characters
  Arrow, // ->
  Bang, // !
  BangEq, // !=
  Eq,
  EqEq,
  FatArrow, // =>
  Greater,
  GreaterEq,
  Less,
  LessEq,
  Minus,
  MinusEq,
  Percent,
  PercentEq,
  Plus,
  PlusEq,
  Slash,
  SlashEq,
  Star,
  StarEq,

  // Literals
  Identifier,
  String,
  Number,

  // Keywords
  And,
  Break,
  Continue,
  Else,
  False,
  Fn,
  If,
  Let,
  Loop,
  Match,
  Nil,
  Or,
  Return,
  True,
  While,

  Eof,
}

/**
 * Converts a {@link TokenType} to its string name.
 *
 * Used by {@link Token.toString} and for diagnostic messages.
 *
 * @param type - The token type to stringify.
 * @returns The corresponding string identifier.
 */
function tokenTypeToString(type: TokenType): string {
  switch (type) {
    case TokenType.LeftParen:
      return "LeftParen";
    case TokenType.RightParen:
      return "RightParen";
    case TokenType.LeftBrace:
      return "LeftBrace";
    case TokenType.RightBrace:
      return "RightBrace";
    case TokenType.LeftBracket:
      return "LeftBracket";
    case TokenType.RightBracket:
      return "RightBracket";
    case TokenType.Colon:
      return "Colon";
    case TokenType.Comma:
      return "Comma";
    case TokenType.Dot:
      return "Dot";
    case TokenType.Semicolon:
      return "Semicolon";
    case TokenType.Arrow:
      return "Arrow";
    case TokenType.Bang:
      return "Bang";
    case TokenType.BangEq:
      return "BangEq";
    case TokenType.Eq:
      return "Eq";
    case TokenType.EqEq:
      return "EqEq";
    case TokenType.FatArrow:
      return "FatArrow";
    case TokenType.Greater:
      return "Greater";
    case TokenType.GreaterEq:
      return "GreaterEq";
    case TokenType.Less:
      return "Less";
    case TokenType.LessEq:
      return "LessEq";
    case TokenType.Minus:
      return "Minus";
    case TokenType.MinusEq:
      return "MinusEq";
    case TokenType.Percent:
      return "Percent";
    case TokenType.PercentEq:
      return "PercentEq";
    case TokenType.Plus:
      return "Plus";
    case TokenType.PlusEq:
      return "PlusEq";
    case TokenType.Slash:
      return "Slash";
    case TokenType.SlashEq:
      return "SlashEq";
    case TokenType.Star:
      return "Star";
    case TokenType.StarEq:
      return "StarEq";
    case TokenType.Identifier:
      return "Identifier";
    case TokenType.String:
      return "String";
    case TokenType.Number:
      return "Number";
    case TokenType.And:
      return "And";
    case TokenType.Break:
      return "Break";
    case TokenType.Continue:
      return "Continue";
    case TokenType.Else:
      return "Else";
    case TokenType.False:
      return "False";
    case TokenType.Fn:
      return "Fn";
    case TokenType.If:
      return "If";
    case TokenType.Let:
      return "Let";
    case TokenType.Loop:
      return "Loop";
    case TokenType.Match:
      return "Match";
    case TokenType.Nil:
      return "Nil";
    case TokenType.Or:
      return "Or";
    case TokenType.Return:
      return "Return";
    case TokenType.True:
      return "True";
    case TokenType.While:
      return "While";
    case TokenType.Eof:
      return "Eof";
    default:
      assertNever(type);
  }
}
