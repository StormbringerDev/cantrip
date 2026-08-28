# add_library(cantrip_jit STATIC)
# target_compile_features(cantrip_jit PRIVATE cxx_std_20)
# target_include_directories(cantrip_jit PRIVATE
#   ${CMAKE_SOURCE_DIR}/include
#   ${LLVM_INCLUDE_DIRS}
# )
# target_compile_definitions(cantrip_jit PRIVATE ${LLVM_DEFINITIONS})
# llvm_map_components_to_libnames(llvm_libs
#   core orcjit native support irreader
# )
# target_link_libraries(cantrip_jit PRIVATE ${llvm_libs} cantrip_core cantrip_vm)
# set_target_properties(cantrip_jit PROPERTIES CXX_VISIBILITY_PRESET hidden)