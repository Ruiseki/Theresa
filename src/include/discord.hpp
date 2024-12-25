#ifndef DISCORD_HANDLER_HPP_INCLUDED
#define DISCORD_HANDLER_HPP_INCLUDED

#include "socket_mgr.hpp"
#include "string"

typedef int discord_subcommand;
#define DISCORD_COMMAND_STD             (discord_subcommand)0
#define DISCORD_COMMAND_GUILD_UPDATE    (discord_subcommand)1
#define DISCORD_COMMAND_DELETE_MSG      (discord_subcommand)2

namespace Discord
{
    typedef unsigned long long discord_id;
    class Guild
    {
        public:
            Guild(const char *json_data);
            discord_id id;

            bool operator==(const Guild &x) const
            { return id == x.id; }
            bool operator==(const Guild *x) const
            { return id == x->id; }
    };

    class User
    {
        public:
            User(const char *json_data);
            discord_id id;
            std::string globalName;

            bool operator==(const User &x) const
            { return id == x.id; }
            bool operator==(const User *x) const
            { return id == x->id; }
    };

    class Member
    {
        public:
            Guild *guild;
            User *user;
            Member(const char *json_data);
            std::string nickname;

            bool operator==(const Member &x) const
            { return user->id == x.user->id && guild->id == x.guild->id; }
            bool operator==(const Member *x) const
            { return user->id == x->user->id && guild->id == x->guild->id; }
    };

    class Message
    {
        public:
            Message(const char *json_data);
            discord_id id;
            Guild *guild;
            User *author;
            discord_id guildId, channelId;
            std::string content;

            bool operator==(const Message &x) const
            { return id == x.id && guild->id == x.guild->id; }
            bool operator==(const Message *x) const
            { return id == x->id && guild->id == x->guild->id; }
    };

    class Channel
    {
        public:
            Channel(const char *json_data);
            discord_id id;
            Guild *guild;

            bool operator==(const Channel &x) const
            { return id == x.id; }
            bool operator==(const Channel *x) const
            { return id == x->id; }
    };
}


// Handler
void execute_discord_command(discord_subcommand subcommand, const char *command);

// tool function
void delete_message(Discord::discord_id msg_id);

// Audio
void audio_cmd(const char *command, const char **args, Discord::Message *msg);

#endif // DISCORD_HANDLER_HPP_INCLUDED