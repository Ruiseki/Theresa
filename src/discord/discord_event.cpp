#include <nlohmann/json.hpp>
#include <thread>

#include "discord.hpp"

using namespace Discord;
using json = nlohmann::json;

void Discord::voice_event(const char *datas_str)
{
    json datas_json = json::parse(datas_str);

    if(datas_json.contains("old_state") && datas_json.contains("new_state"))
    {
        GuildMember member;
        json new_state = datas_json.at("new_state");
        member.guildId = std::stoull(new_state["guild"].get<std::string>());
        member.userId = std::stoull(new_state["id"].get<std::string>());

        auto member_it = std::find(get_guild_members()->begin(), get_guild_members()->end(), member);
        member_it->voice.channelId = new_state["channel"].is_null() ? 0 : std::stoull(new_state["channel"].get<std::string>());
        member_it->voice.sessionId = new_state["sessionId"];
        member_it->set_ptrs(get_guilds(), get_users(), get_channels());

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
            Channel *channel = find_channel(get_channels(), std::stoull(datas_json.at("old_state")["channel"].get<std::string>()));
            get_members_in_voice_channel(channel, &members, &members_size);

            if(members_size == 1 && members[0]->userId == BOT_ID)
                leave_voice(member_it->guild);

            delete [] members;
        }
    }
}

void Discord::message_event(const char *datas_str)
{
    json datas_json = json::parse(datas_str);
    
    Message message;
    message.id = std::stoull( datas_json.at("message")["id"].get<std::string>() );
    message.authorId = std::stoull( datas_json.at("message")["authorId"].get<std::string>() );
    message.channelId = std::stoull( datas_json.at("message")["channelId"].get<std::string>() );
    message.guildId = std::stoull( datas_json.at("message")["guildId"].get<std::string>() );
    message.set_ptrs(get_guilds(), get_users(), get_channels());
    message.save(get_messages());

    int ms = datas_json.at("lifetime").is_null() ? -1 : (int)datas_json.at("lifetime");

    if(ms != 0)
    {

        auto delete_after_ms = [&](Message message, int ms) -> void
        {
            std::this_thread::sleep_for(std::chrono::milliseconds(ms));

            auto it = std::find(get_messages()->begin(), get_messages()->end(), message);
            delete_message(&*it);
        };

        std::thread(delete_after_ms, message, ms).detach();
    }
}
