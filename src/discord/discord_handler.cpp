#include <nlohmann/json.hpp>
#include <iostream>

#include "discord.hpp"
#include "web_socket_mgr.hpp"

using json = nlohmann::json;
using namespace Discord;

void delete_message(Message message)
{
    json delete_message_cmd = {
        {"subcommand", DELETE_MSG},
        {"info", {
            {"id", std::to_string(message.id)},
            {"channelId", std::to_string(message.channelId)},
            {"guildId", std::to_string(message.guildId)}
        }}
    };
    std::string delete_message_cmd_str = delete_message_cmd.dump();

    send_to_js(delete_message_cmd_str.c_str());
}

void execute_discord_command(subcommand subcommand, const char *datas_str)
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

    if(subcommand == COMMAND_STD)
    {
        const char  *type =      datas_json["type"].is_null() ? nullptr : datas_json["type"].get<std::string>().c_str(),
                    *command =   datas_json["command"].is_null() ? nullptr : datas_json["command"].get<std::string>().c_str();

        std::vector<std::string> args = datas_json["args"].get<std::vector<std::string>>();
        std::vector<const char*> args_c_str;
        for(auto element : args)
            args_c_str.push_back(element.c_str());
        
        std::string message_str = datas_json["info"].dump();
        Discord::Message message(message_str.c_str());

        delete_message(message);

        if((strcmp(type, "a") == 0) || (strcmp(type, "audio") == 0))
            audio_cmd(command, args_c_str.data(), &message);
        else
            global_cmd(&message);
    }
    if(subcommand == UPDATE)
    {
        get_guilds()->clear();
        get_channels()->clear();
        get_users()->clear();

        for(json guild_json : datas_json["guilds"])
            Guild guild(guild_json.dump().c_str());
            
        for(json channel_json : datas_json["channels"])
            Channel channel(channel_json.dump().c_str());

        for(json user_json : datas_json["users"])
            User user(user_json.dump().c_str());

        link_all_objects(datas_json.dump().c_str());
    }
}
