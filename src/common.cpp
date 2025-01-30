#include <fstream>
#include <dirent.h>
#include <sys/stat.h>
#include <chrono>

#include "common.hpp"
#include "discord.hpp"

void init_save_folder(char *save_folder_path)
{
    if(save_folder_path == nullptr) return;

    DIR *dir = opendir(save_folder_path);
    
    if(dir == nullptr)
    {
        if(mkdir(save_folder_path, 755) == 0) ;
        else ;
    }
    else ;

}

void wlog(bool time, char *content)
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

    std::ofstream(LOG_FILE_PATH, std::ios::app) << content;
}
