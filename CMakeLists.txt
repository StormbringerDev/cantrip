cmake_minimum_required(VERSION 3.21)
project(Cantrip VERSION 0.2.0 LANGUAGES C)

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)
set(CMAKE_C_EXTENSIONS OFF)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

option(CANTRIP_BUILD_SHARED "Build libcantrip as shared" OFF)
option(CANTRIP_BUILD_CLI "Build the C cantrip executable" ON)
option(CANTRIP_BUILD_TESTS "Build C tests" ON)
option(CANTRIP_INSTALL "Generate install/export rules" ON)
option(CANTRIP_JIT "Build LLVM JIT backend" OFF)
option(CANTRIP_WARNINGS_AS_ERRORS "Treat warnings as errors" OFF)

include(GNUInstallDirs)
include(cmake/warnings.cmake)

add_subdirectory(src/core)
add_subdirectory(src/compiler)
add_subdirectory(src/vm)
add_subdirectory(src/runtime)
add_subdirectory(src/jit)

# umbrella
add_library(cantrip_lib)
target_link_libraries(cantrip_lib PUBLIC
  cantrip_core cantrip_compiler cantrip_vm cantrip_runtime
)
target_include_directories(cantrip_lib PUBLIC
  $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
  $<INSTALL_INTERFACE:${CMAKE_INSTALL_INCLUDEDIR}>
)
if(CANTRIP_JIT)
  enable_language(CXX)
  find_package(LLVM REQUIRED CONFIG)
  add_subdirectory(src/jit)
  target_link_libraries(cantrip_lib PUBLIC cantrip_jit)
endif()
add_library(Cantrip::cantrip ALIAS cantrip_lib)

if(CANTRIP_BUILD_CLI)
  add_subdirectory(apps/cantrip)
endif()

if(CANTRIP_BUILD_TESTS)
  enable_testing()
  add_subdirectory(tests/c)
endif()
