#ifndef CANTRIP_TOKEN_H
#define CANTRIP_TOKEN_H

#include "common.h"
#include "location.h"

typedef enum {
  // Punctuation
  TOKEN_LEFT_PAREN,
  TOKEN_RIGHT_PAREN,
  TOKEN_LEFT_BRACE,
  TOKEN_RIGHT_BRACE,
  TOKEN_COMMA,
  TOKEN_DOT,
  TOKEN_SEMICOLON,
  // Operators
  TOKEN_PLUS,
  TOKEN_MINUS,
  TOKEN_STAR,
  TOKEN_SLASH,
  TOKEN_PERCENT,
  TOKEN_BANG,
  TOKEN_BANG_EQ,
  TOKEN_EQ,
  TOKEN_EQ_EQ,
  TOKEN_GREATER,
  TOKEN_GREATER_EQ,
  TOKEN_LESS,
  TOKEN_LESS_EQ,
  // Literals
  TOKEN_IDENTIFIER,
  TOKEN_STRING,
  TOKEN_NUMBER,
  // Keywords
  TOKEN_AND,
  TOKEN_BREAK,
  TOKEN_CONST,
  TOKEN_CONTINUE,
  TOKEN_ELSE,
  TOKEN_FALSE,
  TOKEN_FN,
  TOKEN_IF,
  TOKEN_LET,
  TOKEN_NIL,
  TOKEN_OR,
  TOKEN_RETURN,
  TOKEN_TRUE,
  TOKEN_WHILE,
  // Misc
  TOKEN_ERROR,
  TOKEN_EOF
} TokenType;

typedef struct {
  TokenType type;
  const char *start;
  int length;
  Span span;
} Token;

#endif