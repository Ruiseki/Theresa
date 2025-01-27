#include <nlohmann/json.hpp>
#include <iostream>

#include "discord.hpp"
#include "web_socket_mgr.hpp"

using json = nlohmann::json;
using namespace Discord;

discord_datas datas;

std::vector<User> *get_users()
{ return &datas.users; }

std::vector<Guild> *get_guilds()
{ return &datas.guilds; }

std::vector<Channel> *get_channels()
{ return &datas.channels; }

std::vector<Message> *get_messages()
{ return &datas.messages; }

std::vector<DiscordServer> *get_servers()
{ return &datas.servers; }

void delete_message(Message *message)
{
    json delete_message_cmd = {
        {"subcommand", DELETE_MSG},
        {"info", {
            {"id", std::to_string(message->id)},
            {"channelId", std::to_string(message->channelId)},
            {"guildId", std::to_string(message->guildId)}
        }}
    };
    std::string delete_message_cmd_str = delete_message_cmd.dump();
    message->unsave(&datas.messages);

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
        Message message;
        message.id = std::stoull(datas_json["info"]["id"].get<std::string>());
        message.authorId = std::stoull(datas_json["info"]["author"].get<std::string>());
        message.channelId = std::stoull(datas_json["info"]["channelId"].get<std::string>());
        message.guildId = std::stoull(datas_json["info"]["guildId"].get<std::string>());
        message.content = datas_json["info"]["content"];
        message.set_ptrs(&datas.guilds, &datas.users, &datas.channels);
        message.save(&datas.messages);

        delete_message(&message);

        if((strcmp(type, "a") == 0) || (strcmp(type, "audio") == 0))
            audio_cmd(command, args_c_str.data(), &message);
        else
            global_cmd(&message);
    }
    if(subcommand == UPDATE)
    {
        datas.users.clear();
        datas.guilds.clear();
        datas.channels.clear();
        datas.guild_members.clear();
        datas.messages.clear();

        for(json guild_json : datas_json["guilds"])
        {
            Guild guild;
            guild.id = std::stoull(guild_json["id"].get<std::string>());
            guild.ownerId = std::stoull(guild_json["ownerId"].get<std::string>());
            guild.name = guild_json["name"];
            guild.memberCount = (int)guild_json["memberCount"];

            for(std::string memberId : guild_json["members"])
            {
                GuildMember guild_member;
                guild_member.guildId = guild.id;
                guild_member.id = std::stoull(memberId);
                guild_member.nickname = "";
                guild_member.save(&datas.guild_members);

                guild.membersIds.push_back(guild_member.id);
            }
            for(std::string channelId : guild_json["channels"])
                guild.channelsIds.push_back(std::stoull(channelId));

            guild.save(&datas.guilds);
        }
        for(json channel_json : datas_json["channels"])
        {
            Channel channel;
            channel.id = std::stoull(channel_json["id"].get<std::string>());
            channel.guildId = std::stoull(channel_json["guildId"].get<std::string>());
            channel.name = channel_json["name"];
            channel.type = (channel_t)channel_json["type"];
            channel.save(&datas.channels);
        }
        for(json user_json : datas_json["users"])
        {
            User user;
            user.id = std::stoull(user_json["id"].get<std::string>());
            user.username = user_json["username"];
            user.save(&datas.users);
        }

        for(auto &guild : datas.guilds)
            guild.set_ptrs(&datas.users, &datas.guild_members, &datas.channels);
        for(auto &channel : datas.channels)
            channel.set_ptrs(&datas.guilds);
        for(auto &guild_member : datas.guild_members)
            guild_member.set_ptrs(&datas.guilds, &datas.users);
    }
}
