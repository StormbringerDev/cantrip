add_library(cantrip_runtime OBJECT)
target_include_directories(cantrip_runtime
  PUBLIC
    $<BUILD_INTERFACE:${CMAKE_SOURCE_DIR}/include>
  PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
)
cantrip_set_warnings(cantrip_runtime)
set_target_properties(cantrip_runtime PROPERTIES C_VISIBILITY_PRESET hidden)