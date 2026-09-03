add_executable(cantrip main.c)

configure_file(
  "${PROJECT_SOURCE_DIR}/version.h.in"
  "${PROJECT_BINARY_DIR}/generated/version.h"
)
target_include_directories(cantrip PRIVATE "${PROJECT_BINARY_DIR}/generated")

target_link_libraries(cantrip PRIVATE Cantrip::cantrip)
