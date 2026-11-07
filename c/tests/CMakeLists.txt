add_executable(test_lexer test_lexer.c)

target_link_libraries(test_lexer
  PRIVATE unity Cantrip::cantrip
)
target_include_directories(test_lexer PRIVATE
  ${CMAKE_SOURCE_DIR}/src
)

add_test(NAME lexer_tests COMMAND test_lexer)
