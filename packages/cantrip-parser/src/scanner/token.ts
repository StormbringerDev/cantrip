export type Literal = string | number | null;

export class Token {
  readonly type: TokenType;
  readonly lexeme: string;
  readonly literal: Literal;

  constructor(type: TokenType, lexeme: string, literal: Literal) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
  }

  toString(): string {
    return `${this.type} ${this.lexeme} ${this.literal as string}`;
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
  Else,
  False,
  Fn,
  If,
  Let,
  Loop,
  Nil,
  Return,
  True,
  While,

  Eof,
}
