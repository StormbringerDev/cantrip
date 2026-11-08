add_library(unity STATIC ${CMAKE_SOURCE_DIR}/external/unity/src/unity.c)
target_include_directories(unity PUBLIC ${CMAKE_SOURCE_DIR}/external/unity/src)
add_library(cmock STATIC ${CMAKE_SOURCE_DIR}/external/cmock/src/cmock.c)
target_include_directories(cmock PUBLIC ${CMAKE_SOURCE_DIR}/external/cmock/src)
target_link_libraries(cmock unity)

add_executable(test_lexer test_lexer.c)

target_link_libraries(test_lexer
  PRIVATE unity Cantrip::cantrip
)
target_include_directories(test_lexer PRIVATE
  ${CMAKE_SOURCE_DIR}/src
)

add_test(NAME lexer_tests COMMAND test_lexer)
