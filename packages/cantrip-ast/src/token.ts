import { assertNever, type Span } from "@cantrip/types";

type TokenLiteral = number | string | null;

export class Token {
  readonly type: TokenType;
  readonly lexeme: string;
  readonly literal: TokenLiteral;
  readonly span: Span;

  constructor(type: TokenType, lexeme: string, literal: TokenLiteral, span: Span) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.span = span;
  }

  toString(): string {
    return `${tokenTypeToString(this.type)} ${this.lexeme} ${this.literal as string}
    start: line ${this.span.start.line + 1}, column ${this.span.start.column + 1}
    end: line ${this.span.end.line + 1}, column ${this.span.end.column + 1}`;
  }
}

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
