#ifndef COMMON_HPP_INCLUDED
#define COMMON_HPP_INCLUDED

#include "web_socket_mgr.hpp"

#define LOG_FILE_PATH (char*)"/home/ruiseki/.theresa/"
#define LOG_FILE (std::string)LOG_FILE_PATH + "theresa_main_server.log"

void init_save_folder(char *backup_path);

void wlog(bool time, const char *content);
void wlog_server_ws_data(bool time, bool is_data_sended, int sockfd, OPCODE_T data_type, ssize_t msg_size, const char *msg);

#endif // COMMON_HPP_INCLUDED
