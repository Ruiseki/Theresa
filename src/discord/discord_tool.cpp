#include <cstring>
#include <nlohmann/json.hpp>

#include "common.hpp"
#include "discord.hpp"
#include "server.hpp"

using json = nlohmann::json;
using namespace Discord;

void Discord::delete_message(Message *message)
{
    json delete_message_cmd = {
        {"main_command", DELETE_MSG},
        {"info", {
            {"id", std::to_string(message->id)},
            {"channelId", std::to_string(message->channelId)},
            {"guildId", std::to_string(message->guildId)}
        }}
    };
    std::string delete_message_cmd_str = delete_message_cmd.dump();
    message->unsave(get_messages());

    send_to_js(delete_message_cmd_str.c_str(), delete_message_cmd_str.size());
}

command Discord::str_to_command(const char *command)
{
    const char *command_splited = command + PREFIX_LENGTH;
         if(strcmp(command_splited, "join") == 0) return JOIN_VOICE;
    else if(strcmp(command_splited, "leave") == 0) return LEAVE_VOICE;
    else return UNKNOWN;
}

void Discord::send_to_js(const char *msg, size_t msg_size)
{
    ServerData *server_data = get_server_data();
    for(size_t i = 0; i < server_data->clients_size; i++)
        if(server_data->clients[i].type == TYPE_WS)
        {
            wlog_server_ws_data(true, true, server_data->clients[i].sockfd, OPCODE_TEXT, msg_size, msg);
            send_ws_frame(msg, server_data->clients[i].sockfd);
        }
}

std::string Discord::build_embed_message(const char *title, const char *content, const char *url, unsigned char *buffer, size_t buffer_size)
{
    json msg = {
        {"embeds", {
                {{"color", "000"}}
            }
        },
    };
    
    if(title != nullptr) msg["embeds"][0]["title"] = title;
    if(content != nullptr) msg["embeds"][0]["description"] = content;

    if(buffer != nullptr || url != nullptr)
    {
        msg["embeds"][0]["thumbnail"] = {"url", nullptr};
        msg["embeds"][0]["thumbnail"]["url"] = url == nullptr ? "attachment://file.jpg" : url;
        if(buffer != nullptr)
            for(size_t i = 0; i < buffer_size; i++)
                msg["files"].push_back(buffer[i]);
    }

    return (char*)msg.dump().c_str();
}

std::string Discord::build_embed_message(const char *content)
{
    return build_embed_message(nullptr, content, nullptr, nullptr, -1);
}

User* Discord::find_user(std::vector<User> *array, discord_id id)
{
    auto it = std::find(array->begin(), array->end(), id);
    if(it == array->end()) return nullptr;
    else return &*it;
}

GuildMember* Discord::find_guildMember(std::vector<GuildMember> *array, discord_id id, discord_id guildId)
{
    GuildMember g;
    g.userId = id;
    g.guildId = guildId;
    auto it = std::find(array->begin(), array->end(), g);
    if(it == array->end()) return nullptr;
    else return &*it;
}

Guild* Discord::find_guild(std::vector<Guild> *array, discord_id id)
{
    auto it = std::find(array->begin(), array->end(), id);
    if(it == array->end()) return nullptr;
    else return &*it;
}

Channel* Discord::find_channel(std::vector<Channel> *array, discord_id id)
{
    auto it = std::find(array->begin(), array->end(), id);
    if(it == array->end()) return nullptr;
    else return &*it;
}

Message* Discord::find_message(std::vector<Message> *array, discord_id id)
{
    auto it = std::find(array->begin(), array->end(), id);
    if(it == array->end()) return nullptr;
    else return &*it;
}

void Discord::get_members_in_voice_channel(Channel *channel, GuildMember ***members, int *members_size)
{
    std::vector<GuildMember*> member_in_voice_channel;
    std::vector<GuildMember> *v_members = get_guild_members();

    for(size_t i = 0; i < v_members->size(); i++)
        if( v_members->at(i).guild == channel->guild
            && v_members->at(i).voice.channel == channel)
            member_in_voice_channel.push_back(&v_members->at(i));

    *members_size = member_in_voice_channel.size();
    *members = new GuildMember*[*members_size];
    for(int i = 0; i < *members_size; i++)
        (*members)[i] = member_in_voice_channel[i];
}
