#ifndef COMMON_HPP_INCLUDED
#define COMMON_HPP_INCLUDED

#define LOG_FILE_PATH (char*)"."

void init_save_folder(char *backup_path);

void wlog(bool time, char *content);

#endif // COMMON_HPP_INCLUDED
