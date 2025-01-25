#include <nlohmann/json.hpp>
#include <algorithm>

#include "discord.hpp"
#include "web_socket_mgr.hpp"
#include "server.hpp"

using json = nlohmann::json;
using namespace Discord;

std::vector<User> users;
std::vector<Guild> guilds;
std::vector<Channel> channels;
std::vector<Message> messages;
std::vector<DiscordServer> servers;
std::vector<Track> tracks;

Guild::Guild(const char *json_data)
{
    try
    {
        json guild_json = json::parse(json_data);

        id = std::stoull(guild_json["id"].get<std::string>());
        ownerId = std::stoull(guild_json["ownerId"].get<std::string>());
        memberCount = (int)guild_json["memberCount"];
        name = guild_json["name"];

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

GuildMember::GuildMember(const char *json_data) : guild(nullptr), user(nullptr)
{
    try
    {
        json member_json = json::parse(json_data);

        id = member_json["id"];
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
        guildId = std::stoull(channel_json["guildId"].get<std::string>());
        name = channel_json["name"];
        type = (channel_type)channel_json["type"];

        /* std::vector<Guild>::iterator guild_it = std::find(guilds.begin(), guilds.end(), guildId);
        if(guild_it != guilds.end())
            guild = &*guild_it; */

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

        /* To do :
                - Faire rejoindre Theresa dans un channel vocal et la faire partir
                - Il faut synchroniser les objets dès lors construction. Lors du 1er boot la construction est imparfaite et c'est pour ça que le relink tous après
                - Quand Message est entièrement syncroniser à la création, régler le problème à discord_global.cpp:31
         */

        std::vector<Message>::iterator it = std::find(messages.begin(), messages.end(), this);
        if(it != messages.end())
            *it = *this;
        else
            messages.push_back(*this);
    }
    catch(const std::exception&)
    { }
}

DiscordServer::DiscordServer() :
                guild(nullptr), last_text_channel(nullptr),
                last_voice_channel(nullptr), last_queue_channel(nullptr)
{ }

Discord::DiscordServer::DiscordServer(std::string guild_id) :
                guild(nullptr), last_text_channel(nullptr),
                last_voice_channel(nullptr), last_queue_channel(nullptr)
{
    std::vector<Guild>::iterator it = std::find(guilds.begin(), guilds.end(), std::stoull(guild_id));
    if(it != guilds.end())
        guild = &*it;
}

Track::Track()
{ }

Track::Track(std::string url)
{
    this->url = url;
}

std::vector<User> *Discord::get_users()
{ return &users; }

std::vector<Guild> *Discord::get_guilds()
{ return &guilds; }

std::vector<Channel> *Discord::get_channels()
{ return &channels; }

std::vector<Message> *Discord::get_messages()
{ return &messages; }

std::vector<DiscordServer> *Discord::get_servers()
{ return &servers; }

void Discord::link_all_objects(const char *update_str)
{
    try
    {
        json update_json = json::parse(update_str);

        // guilds and channels
        for(Guild &guild : guilds)
        {
            guild.channels.clear();
            for(Channel &channel : channels)
            {
                if(guild.id == channel.guildId)
                {
                    channel.guild = &guild;
                    guild.channels.push_back(&channel);
                }
            }
        }

        for(json guild_json : update_json["guilds"])
        {
            discord_id guild_id = std::stoull( guild_json["id"].get<std::string>() );
            std::vector<Guild>::iterator guild_it = std::find(guilds.begin(), guilds.end(), guild_id);
            if(guild_it == guilds.end()) continue;
            for(std::string user_id_str : guild_json["members"])
            {
                std::vector<User>::iterator user_it = std::find(users.begin(), users.end(), std::stoull(user_id_str));
                if(user_it == users.end()) continue;

                json member_json = {
                    {"id", user_it->id},
                    {"nickname", nullptr}
                };

                guild_it->members.push_back(GuildMember(member_json.dump().c_str()));
            }
        }

        for(Guild &guild : guilds)
        {
            for(GuildMember &member : guild.members)
            {
                std::vector<User>::iterator user_it = std::find(users.begin(), users.end(), member.id);
                if(user_it == users.end()) continue;
                member.user = &*user_it;
                member.guild = &guild;
            }
        }

    }
    catch(const std::exception&)
    { }
}

void Discord::restore_data(char *backup_json)
{
}
