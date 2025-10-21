#include <cstdint>
#include <dirent.h>
#include <sys/stat.h>
#include <cstring>
#include <fstream>
#include <opus/opus.h>

#include "discord.hpp"
#include "tool.hpp"

using namespace Discord;

void audio_stream(const char *file_path)
{
    std::ifstream file(file_path);

    // expecting ID3v2 tags
    const int header_size = 10;
    uint8_t header[header_size];
    file.read((char*)header, header_size);

    int32_t file_size = 0;
    file_size = (header[6] << 21) | (header[7] << 14) | (header[8] << 7) | header[9];

    file.seekg(10 + file_size + 1, std::ios::beg);
    char c;
    uint8_t test[4];
    while(file.get(c))
    {
        if((unsigned char)c != 0xFF) continue;

        file.read((char*)test + 1, 3);
        test[0] = c;
    }
}

void Discord::audio_cmd(const char* /* command */, const char** /* argv */, int /* argc */, Discord::Message *message)
{
    // get parameters and query
    Cli_parameter *params;
    int params_size;

    std::vector<std::string> splited = split(message->content, ' ');
    splited.erase(splited.begin());
    const char *splited_cchar[splited.size()];
    for(size_t i = 0; i < splited.size(); i++)
        splited_cchar[i] = splited[i].c_str();

    int first_param_at = get_parameters(splited_cchar, splited.size(), &params, &params_size);

    std::string query = join(splited_cchar, first_param_at, ' ');

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
        audio_stream( ((std::string)(audio_dir_path + "/" + files[0])).c_str() );
    }

    closedir(music_dir);
    delete [] params;
}

/*
    To do :
        - Les fichiers audio ont été filtrer, maintenant il faut faire le system de queue. Mais avant pourquoi pas tester d'envoyer l'audio au JS et de lire sur discord
*/
