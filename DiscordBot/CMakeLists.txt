cmake_minimum_required(VERSION 3.14)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED TRUE)
add_compile_options(-g -Wall -Wextra -fdiagnostics-color=always)

project(Theresa)

include(FetchContent)

FetchContent_Declare(
    json
    DOWNLOAD_EXTRACT_TIMESTAMP TRUE
    URL https://github.com/nlohmann/json/releases/download/v3.11.3/json.tar.xz
)
FetchContent_Declare(
  openssl
  URL https://www.openssl.org/source/openssl-3.3.2.tar.gz
  URL_HASH SHA256=2e8a40b01979afe8be0bbfb3de5dc1c6709fedb46d6c89c10da114ab5fc3d281
)

FetchContent_MakeAvailable(json)
FetchContent_MakeAvailable(openssl)

set(CORE_FILES
${CMAKE_CURRENT_SOURCE_DIR}/src/main.cpp
${CMAKE_CURRENT_SOURCE_DIR}/src/webSocketHandler.cpp)

include_directories(${json_SOURCE_DIR}/single_include)
include_directories(${openssl_SOURCE_DIR}/include/openssl)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)

add_executable(${PROJECT_NAME} ${CORE_FILES})

target_link_libraries(${PROJECT_NAME} ws2_32 ssl crypto)
