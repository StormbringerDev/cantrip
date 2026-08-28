# Apply consistent warning flags to a Cantrip target.
# Usage: cantrip_set_warnings(<target> [WERROR])

function(cantrip_set_warnings target)
  if(NOT TARGET ${target})
    message(FATAL_ERROR "cantrip_set_warnings: '${target}' is not a CMake target")
  endif()

  cmake_parse_arguments(PARSE_ARGV 1 ARG "WERROR" "" "")

  if(MSVC)
    target_compile_options(${target} PRIVATE
      /W4
      /permissive-
      /w14242 # conversion; possible loss of data
      /w14254 # operator conversion; possible loss of data
      /w14263 # member function does not override
      /w14265 # class has virtual functions, but destructor is not virtual
      /w14287 # unsigned/negative constant mismatch
      /we4289 # loop control variable declared in the for-loop is used outside
      /w14296 # expression is always false/true
      /w14311 # pointer truncation
      /w14545 # expression before comma evaluates to a function missing an argument list
      /w14546 # function call before comma has no effect
      /w14547 # operator before comma has no effect
      /w14549 # operator before comma has no effect; did you intend 'operator'?
      /w14555 # expression has no effect; expected expression with side-effect
      /w14619 # pragma warning: there is no warning number
      /w14640 # thread-safe static int
      /w14826 # conversion is sign-extended
      /w14905 # wide string used by regular string
      /w14906 # string used by wide string
      /w14928 # illegal copy-initialization
    )
    if(ARG_WERROR OR CANTRIP_WARNINGS_AS_ERRORS)
      target_compile_options(${target} PRIVATE /WX)
    endif()
  else()
    target_compile_options(${target} PRIVATE
      -Wall
      -Wextra
      -Wpedantic
      -Wshadow
      -Wconversion
      -Wsign-conversion
      -Wcast-align
      -Wcast-qual
      -Wdouble-promotion
      -Wformat=2
      -Wimplicit-fallthrough
      -Wmissing-prototypes
      -Wstrict-prototypes
      -Wold-style-definition
      -Wpointer-arith
      -Wredundant-decls
      -Wundef
      -Wunused
      -Wwrite-strings
      -Wno-unused-parameter
    )

    if(CMAKE_C_COMPILER_ID MATCHES "Clang")
      target_compile_options(${target} PRIVATE
        -Wcomma
        -Wdocumentation
        -Wno-gnu-zero-variadic-macro-arguments
      )
    elseif(CMAKE_C_COMPILER_ID STREQUAL "GNU")
      target_compile_options(${target} PRIVATE
        -Wduplicated-cond
        -Wduplicated-branches
        -Wlogical-op
      )
    endif()

    if(ARG_WERROR OR CANTRIP_WARNINGS_AS_ERRORS)
      target_compile_options(${target} PRIVATE -Werror)
    endif()
  endif()
endfunction()