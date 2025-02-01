#include <nlohmann/json.hpp>

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

std::vector<GuildMember> *get_guild_members()
{ return &datas.guild_members; }

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

    send_to_js(delete_message_cmd_str.c_str(), delete_message_cmd_str.size());
}

void standard(json *datas_json)
{
    const char  *type =      datas_json->at("type").is_null() ? nullptr : datas_json->at("type").get<std::string>().c_str(),
                *command =   datas_json->at("command").is_null() ? nullptr : datas_json->at("command").get<std::string>().c_str();

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

    if((strcmp(type, "a") == 0) || (strcmp(type, "audio") == 0))
        audio_cmd(command, args_c_str.data(), &message);
    else
        global_cmd(&message);
}

void update(json *datas_json)
{
    // voice event
    if(datas_json->contains("old_state") && datas_json->contains("new_state"))
    {
        GuildMember member;
        json new_state = datas_json->at("new_state");
        member.guildId = std::stoull(new_state["guild"].get<std::string>());
        member.userId = std::stoull(new_state["id"].get<std::string>());

        auto member_it = std::find(datas.guild_members.begin(), datas.guild_members.end(), member);
        member_it->voice.channelId = new_state["channel"].is_null() ? 0 : std::stoull(new_state["channel"].get<std::string>());
        member_it->voice.sessionId = new_state["sessionId"];
        member_it->set_ptrs(&datas.guilds, &datas.users, &datas.channels);

        // connection event
        if(member_it->voice.channel != nullptr)
        {
            // auto join her creator
            if(member_it->user->username == "ruisekisama")
                join_voice(member_it->voice.channel);
        }
        // disconnection event
        else
        {
            // leave with her creator
            if(member_it->user->username == "ruisekisama")
                leave_voice(member_it->guild);

            GuildMember **members;
            int members_size;
            Channel *channel = find_channel(&datas.channels, std::stoull(datas_json->at("old_state")["channel"].get<std::string>()));
            get_members_in_voice_channel(channel, &members, &members_size);

            if(members_size == 1 && members[0]->userId == BOT_ID)
                leave_voice(member_it->guild);

            delete [] members;
        }
    }
}

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

    switch(subcommand)
    {
    case UPDATE:
        update(&datas_json);
        break;
    case UPDATE_ALL:
        update_all(&datas_json);
        break;
    default:
        standard(&datas_json);
        break;
    }
}
