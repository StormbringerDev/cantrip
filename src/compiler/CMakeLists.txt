add_library(cantrip_compiler OBJECT)
target_include_directories(cantrip_compiler
  PUBLIC
    $<BUILD_INTERFACE:${CMAKE_SOURCE_DIR}/include>
  PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
)
cantrip_set_warnings(cantrip_compiler)
set_target_properties(cantrip_compiler PROPERTIES C_VISIBILITY_PRESET hidden)