#include <nlohmann/json.hpp>
#include <iostream>

#include "server.hpp"
#include "discord.hpp"
#include "web_socket_mgr.hpp"

using json = nlohmann::json;
using namespace Discord;

void delete_message(Message message)
{
    json delete_message_cmd = {
        {"test", "test frame for cpp server"},
        {"subcommand", DISCORD_COMMAND_DELETE_MSG},
        {"id", std::to_string(message.id)},
        {"channelId", std::to_string(message.channelId)},
        {"guildId", std::to_string(message.guildId)}
    };
    std::string delete_message_cmd_str = delete_message_cmd.dump();

    ServerData *server_data = get_server_data();

    for(size_t i = 0; i < server_data->clients_size; i++)
        if(server_data->clients[i].type == TYPE_WS)
            send_ws_frame(delete_message_cmd_str, server_data->clients[i].sockfd);
}

void execute_discord_command(discord_subcommand subcommand, const char *datas_str)
{
    json datas_json;

    try
    {
        datas_json = json::parse(datas_str);
    }
    catch(const std::exception&)
    {
        return;
    }

    if(subcommand == DISCORD_COMMAND_STD)
    {
        std::string type = datas_json["type"], command = datas_json["command"];
        std::vector<std::string> args = datas_json["args"].get<std::vector<std::string>>();
        std::vector<const char*> args_c_str;
        for(auto element : args)
            args_c_str.push_back(element.c_str());
        
        std::string message_str = datas_json["info"].dump();
        Discord::Message message(message_str.c_str());

        if(type == "a" || type == "audio")
            audio_cmd(command.c_str(), args_c_str.data(), &message);
        else
        {
            // global commands
        }

        delete_message(message);
    }
}