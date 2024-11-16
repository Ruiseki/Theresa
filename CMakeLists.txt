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

FetchContent_MakeAvailable(json)
find_package(OpenSSL)

set(CORE_FILES
	${CMAKE_CURRENT_SOURCE_DIR}/src/main.cpp
	${CMAKE_CURRENT_SOURCE_DIR}/src/web_socket.cpp)

include_directories(${json_SOURCE_DIR}/single_include)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/src/include)

add_executable(${PROJECT_NAME} ${CORE_FILES})

target_link_libraries(${PROJECT_NAME} ssl crypto)
