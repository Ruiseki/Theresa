#include "discord.hpp"
#include "server.hpp"
#include <cstring>
using namespace Discord;

command str_to_command(const char *command)
{
         if(strcmp(command, "join") == 0) return JOIN_VOICE;
    else if(strcmp(command, "leave") == 0) return LEAVE_VOICE;
    else return UNKNOWN;
}

void send_to_js(const char *msg)
{
    ServerData *server_data = get_server_data();
    for(size_t i = 0; i < server_data->clients_size; i++)
        if(server_data->clients[i].type == TYPE_WS)
            send_ws_frame(msg, server_data->clients[i].sockfd);
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
