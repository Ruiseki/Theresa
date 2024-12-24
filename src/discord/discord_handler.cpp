#include <nlohmann/json.hpp>
#include <iostream>

#include "discord.hpp"
#include "web_socket_mgr.hpp"

using json = nlohmann::json;

void delete_message(const char *msg_id)
{
    json delete_message_cmd = {
        
    };

    // send_ws_trame(delete_message_cmd.dump(), );
}

void execute_discord_command(discord_subcommand subcommand, const char *command_str)
{
    json command_json;
    try
    {
        command_json = json::parse(command_str);
    }
    catch(const std::exception&)
    {
        return;
    }

    if(subcommand == DISCORD_COMMAND_STD)
    {
        std::string type = command_json["type"], command = command_json["command"];
        std::vector<std::string> args = command_json["args"].get<std::vector<std::string>>();
        std::vector<const char*> args_c_str;
        for(auto element : args)
            args_c_str.push_back(element.c_str());

        DiscordInfo info;
        info.channel_id = command_json["info"].contains("channel_id") && !command_json["info"]["channel_id"].is_null()  ? command_json["info"]["channel_id"]   : "";
        info.guild_id   = command_json["info"].contains("guild_id") && !command_json["info"]["guild_id"].is_null()      ? command_json["info"]["guild_id"]     : "";
        info.nickname   = command_json["info"].contains("nickname") && !command_json["info"]["nickname"].is_null()      ? command_json["info"]["nickname"]     : "";
        info.user_id    = command_json["info"].contains("user_id") && !command_json["info"]["user_id"].is_null()        ? command_json["info"]["user_id"]      : "";
        info.username   = command_json["info"].contains("username") && !command_json["info"]["username"].is_null()      ? command_json["info"]["username"]     : "";

        std::cout << command_str << std::endl;

        if(command == "a" || command == "audio")
            audio_cmd(command.c_str(), args_c_str.data(), &info);
        else
        {
            // global commands
        }
    }
}