#ifndef CANTRIP_LEXER_H
#define CANTRIP_LEXER_H

#include "location.h"
#include "token.h"

typedef struct {
  const char *start;
  const char *current;
  Position pos;
} Lexer;

void init_lexer(Lexer *lexer, const char *source);
Token scan_token(Lexer *lexer);

#endif /* CANTRIP_LEXER_H */
