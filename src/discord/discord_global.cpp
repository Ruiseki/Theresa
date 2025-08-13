#include <nlohmann/json.hpp>

#include "discord.hpp"
#include "tool.hpp"

using json = nlohmann::json;
using namespace Discord;

void Discord::send_message(Discord::Channel *channel, std::string message, int delete_after_ms)
{
    json order = {
        {"main_command", SEND_MSG},
        {"info", {
            {"guild", std::to_string(channel->guild->id)},
            {"channel", std::to_string(channel->id)},
            {"message", message},
            {"lifetime", delete_after_ms}
        }}
    };

    send_to_js(order.dump().c_str(), order.dump().size());
}

void Discord::send_message(Discord::Channel *channel, std::string message)
{
    send_message(channel, message, -1);
}

void Discord::join_voice(Channel *channel)
{
    json order = {
        {"main_command", STD},
        {"info", {
            {"task", JOIN_VOICE},
            {"guild", std::to_string(channel->guild->id)},
            {"channel", std::to_string(channel->id)}
        }}
    };
    send_to_js(order.dump().c_str(), order.dump().size());
}

void Discord::leave_voice(Guild *guild)
{
    json order = {
        {"main_command", STD},
        {"info", {
            {"task", LEAVE_VOICE},
            {"guild", std::to_string(guild->id)},
        }}
    };
    send_to_js(order.dump().c_str(), order.dump().size());
}

void Discord::global_cmd(Discord::Message *msg)
{
    std::vector<std::string> args = split(msg->content, ' ');
    switch(str_to_command(args[0].c_str()))
    {
        case JOIN_VOICE:
        {
            auto members = get_guild_members();
            GuildMember member_cmp;
            member_cmp.userId = msg->authorId;
            member_cmp.guildId = msg->guildId;

            auto it = std::find(members->begin(), members->end(), member_cmp);
            if(it->voice.channel == nullptr)
            {
                /* send a message for the error */
                return;
            }

            join_voice(it->voice.channel);
            break;
        }
        case LEAVE_VOICE:
            leave_voice(msg->guild);
            break;
        default:
            send_message(msg->channel, build_embed_message("**❌ Unknown command**"), 3000);
            break;
    }
}

/*
    To do :
        - Upscaler la methode de production des commandes (et améliorer la mainteance ! je suis sur qu'il y a mieux)
*/