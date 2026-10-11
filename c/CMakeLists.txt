cmake_minimum_required(VERSION 3.16)
project(Cantrip VERSION 0.1.0 LANGUAGES C)

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)
set(CMAKE_C_EXTENSIONS OFF)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# add_library(cantrip_embed STATIC src/lexer.c)
# target_include_directories(cantrip_embed PUBLIC include PRIVATE src)
# add_library(Cantrip::cantrip ALIAS cantrip_embed)

add_executable(cantrip src/main.c)
# target_link_libraries(cantrip PRIVATE Cantrip::cantrip)
