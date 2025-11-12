#ifndef DISCORD_HPP_INCLUDED
#define DISCORD_HPP_INCLUDED

#include <vector>
#include <algorithm>

#include "common.hpp"
#include "string"

namespace Discord
{
    typedef unsigned long long discord_id;
    typedef int main_command;
    typedef int event_t;
    typedef int channel_t;
    typedef unsigned long command;

    #define PREFIX (char*)"t!"
    #define PREFIX_LENGTH 2
    #define BOT_ID 762501363086524416
    #define DISCORD_BACKUP_DIR (std::string)(STORAGE_DIR + "/discord_guilds")

    #define STD                 (Discord::main_command)0
    #define EVENT               (Discord::main_command)1
    #define UPDATE              (Discord::main_command)2
    #define UPDATE_ALL          (Discord::main_command)3
    #define SEND_MSG            (Discord::main_command)4
    #define DELETE_MSG          (Discord::main_command)5
    #define GET_CHANNEL         (Discord::main_command)6
    #define GET_CHANNELS        (Discord::main_command)7
    #define GET_USER            (Discord::main_command)8
    #define GET_USERS           (Discord::main_command)9
    #define GET_GUILD           (Discord::main_command)10
    #define GET_GUILDS          (Discord::main_command)11
    #define LOAD_DATA           (Discord::main_command)12

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

    // event
    #define MSG_SENDED          (Discord::event_t)0
    #define VOICE_STATE         (Discord::event_t)1

    // Global cmd
    #define JOIN_VOICE          (Discord::command)0x00000000
    #define LEAVE_VOICE         (Discord::command)0x00000001
    #define AUDIO_PLAY          (Discord::command)0x00000002
    #define AUDIO_PAUSE         (Discord::command)0x00000003
    #define AUDIO_RESUME        (Discord::command)0x00000004
    #define AUDIO_STOP          (Discord::command)0x00000005
    #define UNKNOWN             (Discord::command)0xffffffff

    enum CMD_ERROR {
        INVALID_SYNTAXE,
        INVALID_ARG,
        MISSING_ARG,
        INCOMPLETE_CMD,
        CMD_FAILED
    };

    enum AUDIO_PLAYER_STATE {
        IDLE,
        PAUSED,
        PLAYING
    };

    enum QUEUE_STATE {
        NORMAL,
        TRACK_LOOP,
        LOOP
    };

    struct User;
    struct Guild;
    struct GuildMember;
    struct Message;
    struct Channel;
    struct VoiceState;

    struct Track;
    struct DiscordServer;

    struct discord_datas
    {
        std::vector<User> users;
        std::vector<Guild> guilds;
        std::vector<GuildMember> guild_members;
        std::vector<Channel> channels;
        std::vector<Message> messages;
        std::vector<DiscordServer> servers;
    };

    User* find_user(std::vector<User> *array, discord_id id);
    GuildMember* find_guildMember(std::vector<GuildMember> *array, discord_id id, discord_id guildId);
    Guild* find_guild(std::vector<Guild> *array, discord_id id);
    Channel* find_channel(std::vector<Channel> *array, discord_id id);
    Message* find_message(std::vector<Message> *array, discord_id id);

    struct Guild
    {
        discord_id id, ownerId;
        User* owner = nullptr;
        int memberCount;
        std::string name;
        std::vector<GuildMember*> members;
        std::vector<Channel*> channels;

        void save(std::vector<Guild> *guilds)
        {
            auto it = std::find(guilds->begin(), guilds->end(), id);
            if(it == guilds->end())
                guilds->push_back(*this);
            else
                *it = *this;
        }
        void set_ptrs(std::vector<User> *users)
        {
            owner = find_user(users, ownerId);
            members.clear();
            this->channels.clear();
        }

        bool operator==(const discord_id x) const
        { return id == x; }
        bool operator==(const Guild &x) const
        { return id == x.id; }
        bool operator==(const Guild *x) const
        { return id == x->id; }
    };

    struct VoiceState
    {
        Channel *channel = nullptr;
        discord_id channelId;
        std::string sessionId;
        bool selfMute, serverMute, selfDeaf, serverDeaf, selfVideo;
        bool streaming, suppress;
    };

    struct GuildMember
    {
        Guild *guild = nullptr;
        User *user = nullptr;
        VoiceState voice;
        discord_id userId, guildId;
        std::string nickname, displayName;

        void save(std::vector<GuildMember> *guild_members)
        {
            auto it = std::find(guild_members->begin(), guild_members->end(), this);
                if(it == guild_members->end())
                    guild_members->push_back(*this);
                else
                    *it = *this;
        }
        void set_ptrs(std::vector<Guild> *guilds, std::vector<User> *users, std::vector<Channel> *channels)
        {
            guild = find_guild(guilds, guildId);
            guild->members.push_back(this);

            user = find_user(users, userId);
            voice.channel = find_channel(channels, voice.channelId);
        }

        bool operator==(const GuildMember &x) const
        { return userId == x.userId && guildId == x.guildId; }
        bool operator==(const GuildMember *x) const
        { return userId == x->userId && guildId == x->guildId; }
    };

    struct User
    {
        discord_id id;
        std::string username, globalName;

        void save(std::vector<User> *users)
        {
            auto it = std::find(users->begin(), users->end(), id);
            if(it == users->end())
                users->push_back(*this);
            else
                *it = *this;
        }

        bool operator==(const discord_id x) const
        { return id == x; }
        bool operator==(const User &x) const
        { return id == x.id; }
        bool operator==(const User *x) const
        { return id == x->id; }
    };

    struct Channel
    {
        discord_id id, guildId;
        std::string name;
        Guild *guild = nullptr;
        channel_t type;

        void save(std::vector<Channel> *channels)
        {
            auto it = std::find(channels->begin(), channels->end(), id);
            if(it == channels->end())
                channels->push_back(*this);
            else
                *it = *this;
        }
        void set_ptrs(std::vector<Guild> *guilds)
        {
            guild = find_guild(guilds, guildId);
            guild->channels.push_back(this);
        }

        bool operator==(const discord_id x) const
        { return id == x; }
        bool operator==(const Channel &x) const
        { return id == x.id; }
        bool operator==(const Channel *x) const
        { return id == x->id; }
    };

    struct Message
    {
        discord_id id, guildId, channelId, authorId;
        Guild *guild = nullptr;
        User *author = nullptr;
        GuildMember *member = nullptr;
        Channel *channel = nullptr;
        std::string content;

        void save(std::vector<Message> *messages)
        {
            auto it = std::find(messages->begin(), messages->end(), id);
            if(it == messages->end())
                messages->push_back(*this);
            else
                *it = *this;
        }
        void unsave(std::vector<Message> *messages)
        {
            auto it = std::find(messages->begin(), messages->end(), id);
            if(it != messages->end()) messages->erase(it);
        }
        void set_ptrs(std::vector<Guild> *guilds, std::vector<User> *users, std::vector<Channel> *channels, std::vector<GuildMember> *members)
        {
            guild = find_guild(guilds, guildId);
            author = find_user(users, authorId);
            channel = find_channel(channels, channelId);
            member = find_guildMember(members, authorId, guildId);
        }

        bool operator==(const discord_id x) const
        { return id == x; }
        bool operator==(const Message &x) const
        { return id == x.id && guild->id == x.guild->id; }
        bool operator==(const Message *x) const
        { return id == x->id && guild->id == x->guild->id; }
    };

    struct Track {
        std::string path, title, author;
    };

    struct TrackBuffer {
        std::vector<unsigned char> buffer;
        std::vector<Track>::iterator track;
    };

    struct DiscordServer {
        Guild *guild = nullptr;
        Channel *last_text_channel = nullptr,
                *last_voice_channel = nullptr,
                *last_queue_channel = nullptr;

        std::vector<Message*> temp_messages;
        std::vector<User*> admins;
        std::vector<Track> queue;
        std::vector<TrackBuffer> buffers;
        std::vector<Track>::iterator current_track, next_track;

        AUDIO_PLAYER_STATE audio_engine_state;
        bool next_track_leave;
    };

    // data and saves
    // std::vector<> get_saves();
    void get_save(discord_id guild_id);
    void set_save(const char *save_str);

    // tools
    void get_members_in_voice_channel(Channel *channel, GuildMember ***members, int *members_size);
    Discord::command str_to_command(const char *command);
    void send_to_js(const char *msg, size_t msg_size);
    std::string build_embed_message(const char *content, const char *title = nullptr, const char *url = nullptr, unsigned char *buffer = nullptr, size_t buffer_size = -1);
    void send_error_msg(CMD_ERROR error_id, Channel &channel, const char *error_detail);
    std::vector<Discord::User> *get_users();
    std::vector<Discord::Guild> *get_guilds();
    std::vector<Discord::Channel> *get_channels();
    std::vector<Discord::Message> *get_messages();
    std::vector<Discord::GuildMember> *get_guild_members();
    std::vector<Discord::DiscordServer> *get_servers();

    // event handlers
    void voice_event(const char *datas_str);
    void message_event(const char *datas_str);


    // global
    void delete_message(Discord::Message *message);
    void global_cmd(Discord::Message *msg);
    void send_message(Discord::Channel *channel, std::string message, int delete_after_ms);
    void send_message(Discord::Channel *channel, std::string message);
    void join_voice(Discord::Channel *channel);
    void leave_voice(Discord::Guild *guild);

    // audio
    void audio_cmd(const char *cmd_str, const char **argv, int argc, Discord::Message *msg);
}

// main handlers
void execute_discord_command(Discord::main_command main_command, const char *command);

#endif // DISCORD_HPP_INCLUDED