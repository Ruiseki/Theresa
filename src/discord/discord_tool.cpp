#include "discord.hpp"
#include "server.hpp"
#include <cstring>

Discord::command str_to_command(const char *command)
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
