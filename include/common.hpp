#ifndef COMMON_HPP_INCLUDED
#define COMMON_HPP_INCLUDED

#include "web_socket_mgr.hpp"

#define MAIN_DIR (std::string) std::getenv("HOME") + "/.theresa/"
#define LOG_FILE_DIR (std::string)(MAIN_DIR + "logs/")
#define LOG_FILE (std::string)(LOG_FILE_DIR + "theresa_main_server.log")
#define STORAGE_DIR (std::string)(MAIN_DIR + "storage/")

void init_save_folder();

void wlog(bool time, const char *content);
void wlog_server_ws_data(bool time, bool is_data_sended, int sockfd, OPCODE_T data_type, ssize_t msg_size, const char *msg);

#endif // COMMON_HPP_INCLUDED
