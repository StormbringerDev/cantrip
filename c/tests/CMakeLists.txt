add_executable(test_lexer test_lexer.c)

target_link_libraries(test_lexer
  PRIVATE Cantrip::cantrip
)

add_test(NAME LexerTest COMMAND test_lexer)
