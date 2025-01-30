#include <nlohmann/json.hpp>
#include "discord.hpp"

using json = nlohmann::json;
using namespace Discord;

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

    command cmd = str_to_command(args[0].c_str());

    json order = {
        {"subcommand", STD},
        {"info", {
            {"task", cmd}
        }}
    };
    switch(cmd)
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

            order["info"]["guild"] = std::to_string(msg->guild->id);
            order["info"]["channel"] = std::to_string(it->voice.channelId);
            send_to_js(order.dump().c_str());
            break;
        }
        case LEAVE_VOICE:
            order["info"]["guild"] = std::to_string(msg->guild->id);
            send_to_js(order.dump().c_str());
            break;
        default:
            break;
    }
}

/*
    To do :
        - Faire join voice et leave voice
        - Tester et vérifier la méthode
        - Upscaler
*/