#include "lexer.h"

#include <string.h>

void init_lexer(Lexer *lexer, const char *source) {
  lexer->start = source;
  lexer->current = source;
  lexer->pos.line = 1;
  lexer->pos.column = 1;
  lexer->pos.offset = 0;
}

// --- Character helpers -------------------------------------------------------

static bool is_alpha(char c) {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_';
}

static bool is_digit(char c) { return c >= '0' && c <= '9'; }

// --- Source traversal --------------------------------------------------------

static bool is_at_end(Lexer *lexer) { return *lexer->current == '\0'; }

static char advance(Lexer *lexer) {
  lexer->current++;
  lexer->pos.column++;
  lexer->pos.offset++;
  return lexer->current[-1];
}

static char peek(Lexer *lexer) { return *lexer->current; }

static char peek_next(Lexer *lexer) {
  if (is_at_end(lexer))
    return '\0';
  return lexer->current[1];
}

static bool match(Lexer *lexer, char expected) {
  if (is_at_end(lexer))
    return false;
  if (*lexer->current != expected)
    return false;
  lexer->current++;
  lexer->pos.column++;
  lexer->pos.offset++;
  return true;
}

// --- Keyword lookup ----------------------------------------------------------

static TokenType check_keyword(Lexer *lexer, int start, int length,
                               const char *rest, TokenType type) {
  if (lexer->current - lexer->start == start + length &&
      memcmp(lexer->start + start, rest, length) == 0) {
    return type;
  }

  return TOKEN_IDENTIFIER;
}

static TokenType identifier_type(Lexer *lexer) {
  switch (lexer->start[0]) {
  case 'a':
    return check_keyword(lexer, 1, 2, "nd", TOKEN_AND);
  case 'b':
    return check_keyword(lexer, 1, 4, "reak", TOKEN_BREAK);
  case 'c':
    if (lexer->current - lexer->start > 3 &&
        memcmp(lexer->start + 1, "on", 2) == 0) {
      switch (lexer->start[3]) {
      case 's':
        return check_keyword(lexer, 4, 1, "t", TOKEN_CONST);
      case 't':
        return check_keyword(lexer, 4, 4, "inue", TOKEN_CONTINUE);
      }
    }
    break;
  case 'e':
    return check_keyword(lexer, 1, 3, "lse", TOKEN_ELSE);
  case 'f':
    if (lexer->current - lexer->start > 1) {
      switch (lexer->start[1]) {
      case 'a':
        return check_keyword(lexer, 2, 3, "lse", TOKEN_FALSE);
      case 'n':
        return check_keyword(lexer, 2, 0, "", TOKEN_FN);
      }
    }
    break;
  case 'i':
    return check_keyword(lexer, 1, 1, "f", TOKEN_IF);
  case 'l':
    return check_keyword(lexer, 1, 2, "et", TOKEN_LET);
  case 'n':
    return check_keyword(lexer, 1, 2, "il", TOKEN_NIL);
  case 'o':
    return check_keyword(lexer, 1, 1, "r", TOKEN_OR);
  case 'r':
    return check_keyword(lexer, 1, 5, "eturn", TOKEN_RETURN);
  case 't':
    return check_keyword(lexer, 1, 3, "rue", TOKEN_TRUE);
  case 'w':
    return check_keyword(lexer, 1, 4, "hile", TOKEN_WHILE);
  }

  return TOKEN_IDENTIFIER;
}

// --- Token constructors ------------------------------------------------------

static Token make_token(Lexer *lexer, TokenType type, Position start) {
  Token token;
  token.type = type;
  token.start = lexer->start;
  token.length = (int)(lexer->current - lexer->start);
  token.span.start = start;
  token.span.end = lexer->pos;
  return token;
}

static Token error_token(Lexer *lexer, const char *message, Position start) {
  Token token;
  token.type = TOKEN_ERROR;
  token.start = lexer->start;
  token.length = (int)strlen(message);
  token.span.start = start;
  token.span.end = lexer->pos;
  return token;
}

static Token identifier(Lexer *lexer, Position start) {
  while (is_alpha(peek(lexer)) || is_digit(peek(lexer)))
    advance(lexer);
  return make_token(lexer, identifier_type(lexer), start);
}

static Token string(Lexer *lexer, char quote, Position start) {
  while (peek(lexer) != quote && !is_at_end(lexer)) {
    if (peek(lexer) == '\n') {
      lexer->pos.line++;
      lexer->pos.column = 0;
    }
    advance(lexer);
  }

  if (is_at_end(lexer))
    return error_token(lexer, "unterminated string", start);

  // The closing quote
  advance(lexer);
  return make_token(lexer, TOKEN_STRING, start);
}

static Token number(Lexer *lexer, Position start) {
  while (is_digit(peek(lexer)))
    advance(lexer);

  // Look for decimal point
  if (peek(lexer) == '.' && is_digit(peek_next(lexer))) {
    // Consume the '.'
    advance(lexer);

    while (is_digit(peek(lexer)))
      advance(lexer);
  }

  return make_token(lexer, TOKEN_NUMBER, start);
}

static void skip_ws_and_comments(Lexer *lexer) {
  while (true) {
    char c = peek(lexer);
    switch (c) {
    case ' ':
    case '\r':
    case '\t':
      advance(lexer);
      break;
    case '\n':
      lexer->pos.line++;
      lexer->pos.column = 0;
      advance(lexer);
      break;
    case '/':
      if (peek_next(lexer) == '/') {
        // Line comment goes until newline
        while (peek(lexer) != '\n' && !is_at_end(lexer))
          advance(lexer);
      } else if (peek_next(lexer) == '*') {
        // Block comment goes until '*/'
        while (!is_at_end(lexer)) {
          if (peek(lexer) == '\n') {
            lexer->pos.line++;
            lexer->pos.column = 0;
          }
          advance(lexer);
          // Check for '*/'
          if (peek(lexer) == '*' && peek_next(lexer) == '/') {
            advance(lexer);
            advance(lexer);
            break;
          }
        }
      } else {
        return;
      }
      break;
    default:
      return;
    }
  }
}

Token scan_token(Lexer *lexer) {
  skip_ws_and_comments(lexer);
  lexer->start = lexer->current;
  Position token_start = lexer->pos;

  if (is_at_end(lexer))
    return make_token(lexer, TOKEN_EOF, token_start);

  char c = advance(lexer);
  if (is_alpha(c))
    return identifier(lexer, token_start);
  if (is_digit(c))
    return number(lexer, token_start);

  switch (c) {
  case '(':
    return make_token(lexer, TOKEN_LEFT_PAREN, token_start);
  case ')':
    return make_token(lexer, TOKEN_RIGHT_PAREN, token_start);
  case '{':
    return make_token(lexer, TOKEN_LEFT_BRACE, token_start);
  case '}':
    return make_token(lexer, TOKEN_RIGHT_BRACE, token_start);
  case ',':
    return make_token(lexer, TOKEN_COMMA, token_start);
  case '.':
    return make_token(lexer, TOKEN_DOT, token_start);
  case ';':
    return make_token(lexer, TOKEN_SEMICOLON, token_start);
  case '+':
    return make_token(lexer, TOKEN_PLUS, token_start);
  case '-':
    return make_token(lexer, TOKEN_MINUS, token_start);
  case '*':
    return make_token(lexer, TOKEN_STAR, token_start);
  case '/':
    return make_token(lexer, TOKEN_SLASH, token_start);
  case '%':
    return make_token(lexer, TOKEN_PERCENT, token_start);
  case '!':
    return make_token(lexer, match(lexer, '=') ? TOKEN_BANG_EQ : TOKEN_BANG,
                      token_start);
  case '=':
    return make_token(lexer, match(lexer, '=') ? TOKEN_EQ_EQ : TOKEN_EQ,
                      token_start);
  case '>':
    return make_token(lexer,
                      match(lexer, '=') ? TOKEN_GREATER_EQ : TOKEN_GREATER,
                      token_start);
  case '<':
    return make_token(lexer, match(lexer, '=') ? TOKEN_LESS_EQ : TOKEN_LESS,
                      token_start);
  case '"':
    return string(lexer, '"', token_start);
  case '\'':
    return string(lexer, '\'', token_start);
  }

  return error_token(lexer, "unexpected character", token_start);
}
