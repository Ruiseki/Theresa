#include <fstream>
#include <dirent.h>
#include <sys/stat.h>
#include <chrono>

#include "tool.hpp"
#include "common.hpp"
#include "discord.hpp"
#include "web_socket_mgr.hpp"

void init_save_folder()
{
    std::string backup_path = DISCORD_BACKUP_DIR;
    DIR *dir = opendir(backup_path.c_str());

    if(dir == nullptr)
    {
        if(mkdir(backup_path.c_str(), 755) == 0)
            dir = opendir(backup_path.c_str());
        else
        {
            return;
        }
    }

    struct dirent *entry;
    while((entry = readdir(dir)) != nullptr)
    {
        std::string guild_dir_path = backup_path + entry->d_name + "/";
        DIR *guild_dir = opendir(guild_dir_path.c_str());
        struct dirent *guild_dir_entry;
        while((guild_dir_entry = readdir(guild_dir)) != nullptr)
        {
            auto splited = split(guild_dir_entry->d_name, '.');
            if(splited.size() > 0 && splited[splited.size() - 1] == "json")
            {
                std::string backup_path = guild_dir_path + guild_dir_entry->d_name;
                std::string line, file_content = "";
                std::ifstream backup_file(backup_path);
                while(std::getline(backup_file, line))
                    file_content += line;

                // Discord::get_saves(file_content.c_str());
            }
        }
        closedir(guild_dir);
    }
    closedir(dir);
}

void wlog(bool time, const char *content)
{
    std::string content_str = "";
    if(time)
    {
        std::time_t t = std::chrono::system_clock::to_time_t( std::chrono::system_clock::now() );
        std::tm *date = std::localtime(&t);
        auto ms = std::chrono::duration_cast<std::chrono::milliseconds>( std::chrono::system_clock::now().time_since_epoch() ) % 1000;
        std::string ms_str = std::to_string( ms.count() );
        while(ms_str.size() < 3) ms_str = '0' + ms_str;
        content_str += "[" + std::to_string(date->tm_hour) + ":" + std::to_string(date->tm_min) + ":" + std::to_string(date->tm_sec) + ":" + ms_str + "]\t";
    }

    content_str += content;
    std::ofstream(LOG_FILE, std::ios::app) << content_str << std::endl;
}

void wlog_server_ws_data(bool time, bool is_data_sended, int sockfd, OPCODE_T data_type, ssize_t msg_size, const char *msg)
{
    std::string content = std::to_string(sockfd);
    content += is_data_sended ? " <- " : " -> ";

    std::string msg_size_str = std::to_string((double)((double)msg_size / 1000));
    for(int i = msg_size_str.size() - 1; i >= 0; i--)
    {
        if(msg_size_str[i] == '0') msg_size_str.pop_back();
        else break;
    }

    if(data_type == OPCODE_TEXT && msg_size < 200)
        content += msg;
    else
        content +=  data_type == OPCODE_TEXT 
                        ? "text[" + msg_size_str + "ko]"
                    : data_type == OPCODE_BINARY
                        ? "binary[" + msg_size_str + "ko]" : "error";

    wlog(time, content.c_str());
}
