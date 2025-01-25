#ifndef DISCORD_HPP_INCLUDED
#define DISCORD_HPP_INCLUDED

#include <vector>

#include "socket_mgr.hpp"
#include "string"

namespace Discord
{
    typedef unsigned long long discord_id;
    typedef int subcommand;
    typedef int channel_type;
    typedef unsigned long command;

    #define PREFIX (char*)"t!"
    #define PREFIX_LENGTH 2

    #define COMMAND_STD     (Discord::subcommand)0
    #define UPDATE          (Discord::subcommand)1
    #define DELETE_MSG      (Discord::subcommand)2
    #define GET_CHANNEL     (Discord::subcommand)3
    #define GET_CHANNELS    (Discord::subcommand)4
    #define GET_USER        (Discord::subcommand)5
    #define GET_USERS       (Discord::subcommand)6
    #define GET_GUILD       (Discord::subcommand)7
    #define GET_GUILDS      (Discord::subcommand)8

    #define GUILDTEXT           (Discord::channel_type)0
    #define DM                  (Discord::channel_type)1
    #define GUILDVOICE          (Discord::channel_type)2
    #define GROUPDM             (Discord::channel_type)3
    #define GUILDCATEGORY       (Discord::channel_type)4
    #define GUILDANNOUNCEMENT   (Discord::channel_type)5
    #define ANNOUNCEMENTTHREAD  (Discord::channel_type)10
    #define PUBLICTHREAD        (Discord::channel_type)11
    #define PRIVATETHREAD       (Discord::channel_type)12
    #define GUILDSTAGEVOICE     (Discord::channel_type)13
    #define GUILDDIRECTORY      (Discord::channel_type)14
    #define GUILDFORUM          (Discord::channel_type)15
    #define GUILDMEDIA          (Discord::channel_type)16

    // Global cmd
    #define JOIN_VOICE          (Discord::command)0x00000000
    #define LEAVE_VOICE         (Discord::command)0x00000001
    #define UNKNOWN             (Discord::command)0xffffffff

    enum AUDIO_ENGINE_STATE {
        IDLE,
        PAUSE,
        PLAYING
    };

    enum QUEUE_STATE {
        TRACK_LOOP,
        LOOP,
        ALL_LOOP
    };

    enum TRACK_TYPE {
        YOUTUBE,
        LOCAL
    };

    class User;
    class Guild;
    class GuildMember;
    class Message;
    class Channel;
    class Track;

    class Guild
    {
        public:
            Guild(const char *json_data);
            discord_id id, ownerId;
            int memberCount;
            std::string name;
            std::vector<GuildMember> members;
            std::vector<Channel*> channels;

            bool operator==(const discord_id x) const
            { return id == x; }
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

            bool operator==(const discord_id x) const
            { return id == x; }
            bool operator==(const User &x) const
            { return id == x.id; }
            bool operator==(const User *x) const
            { return id == x->id; }
    };

    class GuildMember
    {
        public:
            Guild *guild;
            User *user;
            GuildMember(const char *json_data);
            discord_id id;
            std::string nickname;

            bool operator==(const GuildMember &x) const
            { return user->id == x.user->id && guild->id == x.guild->id; }
            bool operator==(const GuildMember *x) const
            { return user->id == x->user->id && guild->id == x->guild->id; }
    };

    class Channel
    {
        public:
            Channel(const char *json_data);
            discord_id id, guildId;
            std::string name;
            Guild *guild;
            channel_type type;

            bool operator==(const discord_id x) const
            { return id == x; }
            bool operator==(const Channel &x) const
            { return id == x.id; }
            bool operator==(const Channel *x) const
            { return id == x->id; }
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

            bool operator==(const discord_id x) const
            { return id == x; }
            bool operator==(const Message &x) const
            { return id == x.id && guild->id == x.guild->id; }
            bool operator==(const Message *x) const
            { return id == x->id && guild->id == x->guild->id; }
    };

    class DiscordServer {
        public:
            DiscordServer();
            DiscordServer(std::string guild_id);

            Guild *guild;
            Channel *last_text_channel, *last_voice_channel, *last_queue_channel;

            std::vector<Message*> temp_messages;
            std::vector<User*> admins;
            std::vector<Track> queue;
            std::vector<Track>::iterator current_track, next_track;

            AUDIO_ENGINE_STATE audio_engine_state;
            bool next_track_leave;
    };

    class Track {
        public:
            Track();
            Track(std::string url);

            TRACK_TYPE type;
            std::string url, title, author;
    };

    std::vector<User> *get_users();
    std::vector<Guild> *get_guilds();
    std::vector<Channel> *get_channels();
    std::vector<Message> *get_messages();
    std::vector<DiscordServer> *get_servers();

    void link_all_objects(const char *update_str);
    void restore_data(char *backup_json);
}

// Tools
Discord::command str_to_command(const char *command);
void send_to_js(const char *msg);

// Handler
void execute_discord_command(Discord::subcommand subcommand, const char *command);

// tool function
void delete_message(Discord::discord_id msg_id);

// Global
void global_cmd(Discord::Message *msg);

// Audio
void audio_cmd(const char *cmd_str, const char **args, Discord::Message *msg);

#endif // DISCORD_HPP_INCLUDED
