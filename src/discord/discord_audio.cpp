#include <cstddef>
#include <cstdio>
#include <dirent.h>
#include <string>
#include <sys/stat.h>
#include <cstring>
#include <opus/opus.h>
#include <nlohmann/json.hpp>
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
        json data = {
            {"main_command", LOAD_DATA},
            {"info", {
                {"guild", std::to_string(message->guildId)},
                {"buffer", json::array()}
            }}
        };
        json &buffer_json = data["info"]["buffer"];
        std::string stringify;

        const std::string file_path = (std::string)(audio_dir_path) + "/" + files[0];
        std::string ffmpeg_cmd = "ffmpeg -i \"" + file_path + "\" -f opus -ar 48000 -ac 2 -acodec libopus -loglevel quiet pipe:1";
        FILE* pipe = popen(ffmpeg_cmd.c_str(), "r");
        if(!pipe)
            return;

        const int buffer_size = 1024;
        std::vector<unsigned char> converted_data;
        unsigned char buffer[buffer_size];

        while(!feof(pipe))
        {
            size_t bytes_read = fread(buffer, sizeof(unsigned char), buffer_size, pipe);
            if(bytes_read > 0)
            {
                converted_data.insert(converted_data.end(), buffer, buffer + bytes_read);
                buffer_json = std::vector<unsigned char>(buffer, buffer + bytes_read);
                stringify = data.dump();
                send_to_js(stringify.c_str(), stringify.size());
            }
        }

        pclose(pipe);
    }

    closedir(music_dir);
    delete [] params;
}

void Discord::play(Discord::Guild *guild, int buffer_id)
{
    json order = {
        {"main_command", STD},
        {"info", {
            {"task", AUDIO_PLAY},
            {"guild", std::to_string(guild->id)},
            {"buffer_id", buffer_id}
        }}
    };
    send_to_js(order.dump().c_str(), order.dump().size());
}
