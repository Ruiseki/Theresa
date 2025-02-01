#include <nlohmann/json.hpp>
#include "discord.hpp"

using json = nlohmann::json;
using namespace Discord;

void join_voice(Channel *channel)
{
    json order = {
        {"subcommand", STD},
        {"info", {
            {"task", JOIN_VOICE},
            {"guild", std::to_string(channel->guild->id)},
            {"channel", std::to_string(channel->id)}
        }}
    };
    send_to_js(order.dump().c_str(), order.dump().size());
}

void leave_voice(Guild *guild)
{
    json order = {
        {"subcommand", STD},
        {"info", {
            {"task", LEAVE_VOICE},
            {"guild", std::to_string(guild->id)},
        }}
    };
    send_to_js(order.dump().c_str(), order.dump().size());
}

void global_cmd(Discord::Message *msg)
{
    std::vector<std::string> args;
    std::string buffer = "";
    for(size_t i = PREFIX_LENGTH; i < msg->content.size(); i++)
    {
        if(msg->content[i] == ' ')
        {
            args.push_back(buffer);
            buffer = "";
        }
        else buffer += msg->content[i];
    }
    if(buffer != "") args.push_back(buffer);

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
            break;
    }
}

/*
    To do :
        - Update les states de tous les vectors
        - Upscaler la methode de production des commandes (et améliorer la mainteance ! je suis sur qu'il y a mieux)
        - Voir pour l'audio
*/