#ifndef DISCORD_HANDLER_HPP_INCLUDED
#define DISCORD_HANDLER_HPP_INCLUDED

#include "socket_mgr.hpp"
#include "string"

typedef int discord_subcommand;
#define DISCORD_COMMAND_STD             (discord_subcommand)0
#define DISCORD_COMMAND_GUILD_UPDATE    (discord_subcommand)1
#define DISCORD_COMMAND_DELETE_MSG      (discord_subcommand)2

struct DiscordInfo {
    std::string username, nickname, user_id;
    std::string guild_id, channel_id, message_id;
};

// Handler
void execute_discord_command(discord_subcommand subcommand, const char *command);

// tool function
void delete_message(const char *msg_id);

// Audio
void audio_cmd(const char *command, const char **args, DiscordInfo *msg_info);

#endif // DISCORD_HANDLER_HPP_INCLUDED