cmake_minimum_required(VERSION 3.25)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
project(theresa)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

set(CORE
        ${CMAKE_CURRENT_SOURCE_DIR}/src/common.cpp
	    ${CMAKE_CURRENT_SOURCE_DIR}/src/gui_handler.cpp
	    ${CMAKE_CURRENT_SOURCE_DIR}/src/http_mgr.cpp
	    ${CMAKE_CURRENT_SOURCE_DIR}/src/main.cpp
	    ${CMAKE_CURRENT_SOURCE_DIR}/src/main_handler.cpp
	    ${CMAKE_CURRENT_SOURCE_DIR}/src/server.cpp
	    ${CMAKE_CURRENT_SOURCE_DIR}/src/socket_mgr.cpp
	    ${CMAKE_CURRENT_SOURCE_DIR}/src/tool.cpp
	    ${CMAKE_CURRENT_SOURCE_DIR}/src/web_handler.cpp
	    ${CMAKE_CURRENT_SOURCE_DIR}/src/web_socket_mgr.cpp
	    ${CMAKE_CURRENT_SOURCE_DIR}/src/tctp.cpp
    )
set(DISCORD_EXT
	    ${CMAKE_CURRENT_SOURCE_DIR}/src/discord/discord_audio.cpp
	    ${CMAKE_CURRENT_SOURCE_DIR}/src/discord/discord_event.cpp
	    ${CMAKE_CURRENT_SOURCE_DIR}/src/discord/discord_global.cpp
	    ${CMAKE_CURRENT_SOURCE_DIR}/src/discord/discord_handler.cpp
	    ${CMAKE_CURRENT_SOURCE_DIR}/src/discord/discord_tool.cpp
    )

include_directories(include deps)
add_compile_options(-g -Wall -Wextra)
add_executable(${PROJECT_NAME} ${CORE} ${DISCORD_EXT})
target_link_libraries(${PROJECT_NAME} ssl crypto)
