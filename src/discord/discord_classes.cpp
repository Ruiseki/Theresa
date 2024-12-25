#include <vector>
#include <nlohmann/json.hpp>
#include <algorithm>

#include "discord.hpp"

using json = nlohmann::json;
using namespace Discord;

std::vector<User> users;
std::vector<Guild> guilds;
std::vector<Channel> channels;
std::vector<Message> messages;

Guild::Guild(const char *json_data)
{
    try
    {
        json guild_json = json::parse(json_data);

        id = std::stoull(guild_json["id"].get<std::string>());

        std::vector<Guild>::iterator it = std::find(guilds.begin(), guilds.end(), this);
        if(it != guilds.end())
            *it = *this;
        else
            guilds.push_back(*this);
    }
    catch(const std::exception&)
    { }
}

User::User(const char *json_data)
{
    try
    {
        json user_json = json::parse(json_data);

        id = std::stoull(user_json["id"].get<std::string>());
        globalName = user_json["globalName"];

        std::vector<User>::iterator it = std::find(users.begin(), users.end(), this);
        if(it != users.end())
            *it = *this;
        else
            users.push_back(*this);
    }
    catch(const std::exception&)
    { }
    
}

Member::Member(const char *json_data) : guild(nullptr), user(nullptr)
{
    try
    {
        json member_json = json::parse(json_data);

        nickname = member_json["nickname"];
    }
    catch(const std::exception&)
    { }
}

Channel::Channel(const char *json_data) : guild(nullptr)
{
    try
    {
        json channel_json = json::parse(json_data);

        id = std::stoull(channel_json["id"].get<std::string>());

        std::vector<Channel>::iterator it = std::find(channels.begin(), channels.end(), this);
        if(it != channels.end())
            *it = *this;
        else
            channels.push_back(*this);
    }
    catch(const std::exception&)
    { }
}

Message::Message(const char *json_data) : guild(nullptr), author(nullptr)
{
    try
    {
        json message_json = json::parse(json_data);

        id = std::stoull(message_json["id"].get<std::string>());
        guildId = std::stoull(message_json["guildId"].get<std::string>());
        channelId = std::stoull(message_json["channelId"].get<std::string>());
        content = message_json["content"];

        std::vector<Message>::iterator it = std::find(messages.begin(), messages.end(), this);
        if(it != messages.end())
            *it = *this;
        else
            messages.push_back(*this);
    }
    catch(const std::exception&)
    { }
}
