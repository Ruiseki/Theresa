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
    std::vector<std::string> splited = split(message->content, ' ');
    splited.erase(splited.begin());

    std::vector<Cli_parameter> params = get_parameters(splited.data(), splited.size());

    for(auto param : params)
    {
        if(param.key == "s")
        {
            json order = {
                {"main_command", STD},
                {"info", {
                    {"guild", std::to_string(message->guildId)},
                    {"task", nullptr}
                }}
            };
            json &task = order["info"]["task"];

            if(param.value == "pause")
                task = AUDIO_PAUSE;
            else if(param.value == "resume")
                task = AUDIO_RESUME;
            // end the track
            else if(param.value == "stop")
                task = AUDIO_STOP;
            // end the track and delete the queue
            else if(param.value == "quit")
                task = AUDIO_STOP;

            std::string stringify = order.dump();
            send_to_js(stringify.c_str(), stringify.size());
        }
    }

    std::string query = join(splited.data(), params.size() > 0 ? params[0].pos_in_query : splited.size(), ' ');
    if(query == "")
        return;

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

    if(files.size() == 1)
    {
        auto file_name_splited = split(files[0], '.');
        file_name_splited.pop_back();
        auto file_name_no_ext = join(file_name_splited.data(), file_name_splited.size(), '.');
        std::string message_content = "**" + file_name_no_ext + "**  :notes:\n*[artist WIP]*\n\n*Position : **[queue position WIP]***\n*requested by " + message->author->globalName + "*";
        send_message(message->channel, build_embed_message(message_content.c_str()), 30000);

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
    else if(files.size() > 1)
    {
        std::string message_content = "**⚠ Warning** : other similar file\n\n";
        for(auto element : files)
            message_content += element + "\n";
        send_message(message->channel, build_embed_message(message_content.c_str()), 10000);
    }
    else
        send_message(message->channel, build_embed_message("No match"), 3000);

    closedir(music_dir);
}