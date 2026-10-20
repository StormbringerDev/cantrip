import { Span } from "../types/location.js";

export enum TokenType {
  // Punctuation
  LeftParen = "LeftParen",
  RightParen = "RightParen",
  LeftBrace = "LeftBrace",
  RightBrace = "RightBrace",
  Comma = "Comma",
  Dot = "Dot",
  Semicolon = "Semicolon",
  // Operators
  Plus = "Plus",
  Minus = "Minus",
  Star = "Star",
  Slash = "Slash",
  Percent = "Percent",
  Bang = "Bang",
  BangEq = "BangEq",
  Eq = "Eq",
  EqEq = "EqEq",
  Greater = "Greater",
  GreaterEq = "GreaterEq",
  Less = "Less",
  LessEq = "LessEq",
  // Literals
  Identifier = "Identifier",
  String = "String",
  Number = "Number",
  // Keywords
  And = "And",
  Break = "Break",
  Const = "Const",
  Continue = "Continue",
  Else = "Else",
  False = "False",
  Fn = "Fn",
  If = "If",
  Let = "Let",
  Nil = "Nil",
  Or = "Or",
  Return = "Return",
  True = "True",
  While = "While",
  // Misc
  Eof = "Eof",
}

export interface Token {
  readonly type: TokenType;
  readonly lexeme: string;
  readonly literal: string | number | null;
  readonly span: Span;
}
