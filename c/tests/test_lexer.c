#include "unity.h"
#include "lexer.h"

void setUp(void) {}
void tearDown(void) {}

void test_Lexer_should_EmitEofTokenOnEmptyString(void) {
}

int main(void) {
  UNITY_BEGIN();
  RUN_TEST(test_Lexer_should_EmitEofTokenOnEmptyString);
  return UNITY_END();
}
