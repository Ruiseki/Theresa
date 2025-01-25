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
        {"task", cmd}
    };
    switch(cmd)
    {
        case JOIN_VOICE:
        {
            order["user_id"] = msg->author->id;
            order["guild_id"] = msg->guildId;
            // send_to_js(order.dump().c_str());
            break;
        }

        case LEAVE_VOICE:
            break;
        default:
            break;
    }
}