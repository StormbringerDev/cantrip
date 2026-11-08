#include "unity.h"

#include "lexer.h"
#include "token.h"

void setUp(void) {}
void tearDown(void) {}

void test_Lexer_should_EmitEofTokenOnEmptyString(void) {
  Lexer lexer;
  init_lexer(&lexer, "");
  Token token = scan_token(&lexer);
  TEST_ASSERT_EQUAL_INT(TOKEN_EOF, token.type);
}

void test_Lexer_should_EmitErrorTokenOnUnknownChar(void) {
  Lexer lexer;
  init_lexer(&lexer, "@");
  Token token = scan_token(&lexer);
  TEST_ASSERT_EQUAL_INT(TOKEN_ERROR, token.type);
}

void test_Lexer_should_EmitCorrectPunctuationTokens(void) {
  Lexer lexer;
  init_lexer(&lexer, "(){},.;");
  TokenType tokens[8];
  for (int i = 0; i < 8; i++) {
    tokens[i] = scan_token(&lexer).type;
  }
  TokenType expected[] = {
      TOKEN_LEFT_PAREN, TOKEN_RIGHT_PAREN, TOKEN_LEFT_BRACE, TOKEN_RIGHT_BRACE,
      TOKEN_COMMA,      TOKEN_DOT,         TOKEN_SEMICOLON,  TOKEN_EOF,
  };
  TEST_ASSERT_EQUAL_INT_ARRAY(expected, tokens, 8);
}

void test_Lexer_should_EmitCorrectOperatorTokens(void) {
  Lexer lexer;
  init_lexer(&lexer, "+-*/%!!====>>=<<=");
  TokenType tokens[14];
  for (int i = 0; i < 14; i++) {
    tokens[i] = scan_token(&lexer).type;
  }
  TokenType expected[] = {TOKEN_PLUS,    TOKEN_MINUS,      TOKEN_STAR,
                          TOKEN_SLASH,   TOKEN_PERCENT,    TOKEN_BANG,
                          TOKEN_BANG_EQ, TOKEN_EQ_EQ,      TOKEN_EQ,
                          TOKEN_GREATER, TOKEN_GREATER_EQ, TOKEN_LESS,
                          TOKEN_LESS_EQ, TOKEN_EOF};
  TEST_ASSERT_EQUAL_INT_ARRAY(expected, tokens, 14);
}

void test_Lexer_should_IgnoreWhitespace(void) {
  Lexer lexer;
  init_lexer(&lexer, " \r\t\n");
  Token token = scan_token(&lexer);
  TEST_ASSERT_EQUAL_INT(TOKEN_EOF, token.type);
}

void test_Lexer_should_IgnoreComments(void) {
  Lexer lexer;
  init_lexer(&lexer, "// This is a comment.\n/*\nThis is also a comment.\n*/");
  Token token = scan_token(&lexer);
  TEST_ASSERT_EQUAL_INT(TOKEN_EOF, token.type);
}

void test_Lexer_should_EmitCorrectLiteralTokens(void) {
  Lexer lexer;
  init_lexer(&lexer, "total total_2 Location \"Hello!\" 'Hi!' 42 3.14");
  TokenType tokens[8];
  for (int i = 0; i < 8; i++) {
    tokens[i] = scan_token(&lexer).type;
  }
  TokenType expected[] = {
      TOKEN_IDENTIFIER, TOKEN_IDENTIFIER, TOKEN_IDENTIFIER, TOKEN_STRING,
      TOKEN_STRING,     TOKEN_NUMBER,     TOKEN_NUMBER,     TOKEN_EOF,
  };
  TEST_ASSERT_EQUAL_INT_ARRAY(expected, tokens, 8);
}

void test_Lexer_should_EmitCorrectKeywordTokens(void) {
  Lexer lexer;
  init_lexer(
      &lexer,
      "and break const continue else false fn if let nil or return true while");
  TokenType tokens[15];
  for (int i = 0; i < 15; i++) {
    tokens[i] = scan_token(&lexer).type;
  }
  TokenType expected[] = {
      TOKEN_AND,   TOKEN_BREAK,  TOKEN_CONST, TOKEN_CONTINUE, TOKEN_ELSE,
      TOKEN_FALSE, TOKEN_FN,     TOKEN_IF,    TOKEN_LET,      TOKEN_NIL,
      TOKEN_OR,    TOKEN_RETURN, TOKEN_TRUE,  TOKEN_WHILE,    TOKEN_EOF,
  };
  TEST_ASSERT_EQUAL_INT_ARRAY(expected, tokens, 15);
}

int main(void) {
  UNITY_BEGIN();
  RUN_TEST(test_Lexer_should_EmitEofTokenOnEmptyString);
  RUN_TEST(test_Lexer_should_EmitErrorTokenOnUnknownChar);
  RUN_TEST(test_Lexer_should_EmitCorrectPunctuationTokens);
  RUN_TEST(test_Lexer_should_EmitCorrectOperatorTokens);
  RUN_TEST(test_Lexer_should_IgnoreWhitespace);
  RUN_TEST(test_Lexer_should_IgnoreComments);
  RUN_TEST(test_Lexer_should_EmitCorrectLiteralTokens);
  RUN_TEST(test_Lexer_should_EmitCorrectKeywordTokens);
  return UNITY_END();
}
