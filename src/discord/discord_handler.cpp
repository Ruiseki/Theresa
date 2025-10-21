#include <nlohmann/json.hpp>

#include "discord.hpp"
#include "web_socket_mgr.hpp"

using json = nlohmann::json;
using namespace Discord;

discord_datas datas;

std::vector<User> *Discord::get_users()
{ return &datas.users; }

std::vector<Guild> *Discord::get_guilds()
{ return &datas.guilds; }

std::vector<Channel> *Discord::get_channels()
{ return &datas.channels; }

std::vector<Message> *Discord::get_messages()
{ return &datas.messages; }

std::vector<GuildMember> *Discord::get_guild_members()
{ return &datas.guild_members; }

std::vector<DiscordServer> *Discord::get_servers()
{ return &datas.servers; }

void standard(json *datas_json)
{
    std::string type =      datas_json->at("type").is_null()    ? "" : datas_json->at("type").get<std::string>().c_str();
    std::string command =   datas_json->at("command").is_null() ? "" : datas_json->at("command").get<std::string>().c_str();

    std::vector<std::string> args = datas_json->at("args").get<std::vector<std::string>>();
    std::vector<const char*> args_c_str;
    for(auto element : args)
        args_c_str.push_back(element.c_str());

    std::string message_str = datas_json->at("info").dump();
    Message message;
    message.id = std::stoull(datas_json->at("info")["id"].get<std::string>());
    message.authorId = std::stoull(datas_json->at("info")["authorId"].get<std::string>());
    message.channelId = std::stoull(datas_json->at("info")["channelId"].get<std::string>());
    message.guildId = std::stoull(datas_json->at("info")["guildId"].get<std::string>());
    message.content = datas_json->at("info")["content"];
    message.set_ptrs(&datas.guilds, &datas.users, &datas.channels);
    message.save(&datas.messages);

    delete_message(&message);

    if(type == "a" || type == "audio")
        audio_cmd(command.c_str(), args_c_str.data(), args_c_str.size(), &message);
    else
        global_cmd(&message);
}

void update(json* /* datas_json */)
{ }

void update_all(json *datas_json)
{
    datas.users.clear();
    datas.guilds.clear();
    datas.channels.clear();
    datas.guild_members.clear();
    datas.messages.clear();

    for(json guild_json : datas_json->at("guilds"))
    {
        Guild guild;
        guild.id = std::stoull(guild_json["id"].get<std::string>());
        guild.ownerId = std::stoull(guild_json["ownerId"].get<std::string>());
        guild.name = guild_json["name"];
        guild.memberCount = (int)guild_json["memberCount"];

        guild.save(&datas.guilds);
    }
    for(json channel_json : datas_json->at("channels"))
    {
        Channel channel;
        channel.id = std::stoull(channel_json["id"].get<std::string>());
        channel.guildId = std::stoull(channel_json["guildId"].get<std::string>());
        channel.name = channel_json["name"];
        channel.type = (channel_t)channel_json["type"];
        channel.save(&datas.channels);
    }
    for(json user_json : datas_json->at("users"))
    {
        User user;
        user.id = std::stoull(user_json["id"].get<std::string>());
        user.username = user_json["username"];
        user.globalName = user_json["globalName"].is_null() ? "" : user_json["globalName"];
        user.save(&datas.users);
    }
    for(json member_json : datas_json->at("guild_members"))
    {
        GuildMember member;
        member.displayName = member_json["displayName"];
        member.nickname = member_json["nickname"].is_null() ? "" : member_json["nickname"];
        member.guildId = std::stoull(member_json["guildId"].get<std::string>());
        member.userId = std::stoull(member_json["userId"].get<std::string>());

        member.voice.channelId = member_json["voice"]["channel"].is_null() ? 0 : std::stoull(member_json["voice"]["channel"].get<std::string>());
        member.voice.selfMute = member_json["voice"]["selfMute"].is_null() ? false : (bool)member_json["voice"]["selfMute"];
        member.voice.selfDeaf = member_json["voice"]["selfDeaf"].is_null() ? false : (bool)member_json["voice"]["selfDeaf"];
        member.voice.selfVideo = member_json["voice"]["selfVideo"].is_null() ? false : (bool)member_json["voice"]["selfVideo"];
        member.voice.serverMute = member_json["voice"]["serverMute"].is_null() ? false : (bool)member_json["voice"]["serverMute"];
        member.voice.serverDeaf = member_json["voice"]["serverDeaf"].is_null() ? false : (bool)member_json["voice"]["serverDeaf"];
        member.voice.streaming = member_json["voice"]["streaming"].is_null() ? false : (bool)member_json["voice"]["streaming"];
        member.voice.sessionId = member_json["voice"]["sessionId"].is_null() ? "" : member_json["voice"]["sessionId"];
        member.voice.suppress = member_json["voice"]["suppress"].is_null() ? false : (bool)member_json["voice"]["suppress"];

        member.save(&datas.guild_members);
    }

    for(auto &guild : datas.guilds)
        guild.set_ptrs(&datas.users);
    for(auto &channel : datas.channels)
        channel.set_ptrs(&datas.guilds);
    for(auto &guild_member : datas.guild_members)
        guild_member.set_ptrs(&datas.guilds, &datas.users, &datas.channels);

    bool creator_founded = false;
    for(auto &guild : datas.guilds)
    {
        for(auto &member : guild.members)
        {
            if( member->userId == 606684737611759628
                && member->voice.channel)
                join_voice(member->voice.channel);

            if(creator_founded)
                break;
        }

        if(creator_founded)
            break;
    }
}

void event_mgr(json *datas_json)
{
    event_t event = (event_t)datas_json->at("event");

    switch (event)
    {
        case MSG_SENDED:
            message_event(datas_json->dump().c_str());
            break;
        case VOICE_STATE:
            voice_event(datas_json->dump().c_str());
            break;

        default:
            break;
    }
}

void execute_discord_command(main_command main_command, const char *datas_str)
{
    json datas_json;

    if(json::accept(datas_str))
        datas_json = json::parse(datas_str);
    else
        return;

    switch(main_command)
    {
        case UPDATE:
            update(&datas_json);
            break;
        case UPDATE_ALL:
            update_all(&datas_json);
            break;
        case EVENT:
            event_mgr(&datas_json);
            break;
        default:
            standard(&datas_json);
            break;
    }
}
