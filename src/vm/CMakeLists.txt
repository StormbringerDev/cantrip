add_library(cantrip_vm OBJECT)
target_include_directories(cantrip_vm
  PUBLIC
    $<BUILD_INTERFACE:${CMAKE_SOURCE_DIR}/include>
  PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
)
cantrip_set_warnings(cantrip_vm)
set_target_properties(cantrip_vm PROPERTIES C_VISIBILITY_PRESET hidden)