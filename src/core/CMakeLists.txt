add_library(cantrip_core OBJECT)
target_include_directories(cantrip_core
  PUBLIC
    $<BUILD_INTERFACE:${CMAKE_SOURCE_DIR}/include>
  PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
)
cantrip_set_warnings(cantrip_core)
set_target_properties(cantrip_core PROPERTIES C_VISIBILITY_PRESET hidden)