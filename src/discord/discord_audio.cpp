#include <chrono>
#include <dirent.h>
#include <filesystem>
#include <fstream>
#include <string>
#include <sys/stat.h>
#include <cstring>
#include <opus/opus.h>
#include <nlohmann/json.hpp>
#include <thread>
#include <vector>

#include "discord.hpp"
#include "tool.hpp"

using namespace Discord;
using nlohmann::json;

void Discord::audio_cmd(const char* /* command */, const char** /* argv */, int /* argc */, Discord::Message *message)
{
    if(!message->member->voice.channel)
        return;

    // get parameters and query
    Cli_parameter *params;
    int params_size;

    std::vector<std::string> splited = split(message->content, ' ');
    splited.erase(splited.begin());

    int first_param_at = get_parameters(splited.data(), splited.size(), &params, &params_size);

    std::string query = join(splited.data(), first_param_at, ' ');

    // get file(s) starting by query
    std::string audio_dir_path = AUDIO_DIR + "/" + std::to_string(message->authorId);
    DIR *music_dir = opendir(audio_dir_path.c_str());

    if(music_dir == nullptr)
    {
        mkdir(audio_dir_path.c_str(), 755);
        music_dir = opendir(audio_dir_path.c_str());
    }

    std::vector<std::string> files;
    struct dirent *entry;
    while((entry = readdir(music_dir)) != nullptr)
        if( strcmp(entry->d_name, ".") != 0
            && strcmp(entry->d_name, "..") != 0) files.push_back(entry->d_name);

    for(size_t i = 0; i < files.size(); i++)
    {
        if(!str_start_with(files[i].c_str(), query.c_str(), false))
        {
            files.erase(files.begin() + i);
            i--;
        }
    }

    if(files.size() >= 1)
    {
        const std::string file_path = (std::string)(audio_dir_path) + "/" + files[0];
        std::ifstream file(file_path);
        long file_size = std::filesystem::file_size(file_path);
        std::vector<unsigned char> buffer(file_size);
        file.read((char*)buffer.data(), file_size);

        json data = {
            {"main_command", LOAD_DATA},
            {"info", {
                {"id", 1},
                {"buffer", json::array()}
            }}
        };
        json &buffer_json = data["info"]["buffer"];
        long bytes_sended = 0;
        const int buffer_size = 1024;
        std::string stringify;
        while(bytes_sended < file_size)
        {
            int x = file_size - bytes_sended;
            if(x > buffer_size)
                x = buffer_size;

            buffer_json = std::vector<unsigned char>(buffer.begin() + bytes_sended, buffer.begin() + bytes_sended + x);
            stringify = data.dump();
            send_to_js(stringify.c_str(), stringify.size());
            bytes_sended += x;
            std::this_thread::sleep_for(std::chrono::nanoseconds(10));
        }

        buffer_json.clear();
        send_to_js(data.dump().c_str(), data.dump().size());
    }

    closedir(music_dir);
    delete [] params;
}
