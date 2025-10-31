import { BaseGuildTextChannel, Client, GatewayIntentBits, Guild, GuildMember, Message, User, VoiceState } from "discord.js";
import { send_data, sleep } from "./websocket.js";
import dotenv from 'dotenv';
import {
    COMMAND_TYPE_DISCORD,
    DISCORD_COMMAND_JOIN_VOICE,
    DISCORD_COMMAND_LEAVE_VOICE,
    DISCORD_EVENT_MSG_SENDED,
    DISCORD_EVENT_VOICE_STATE,
    DISCORD_MAIN_COMMAND_DELETE_MSG,
    DISCORD_MAIN_COMMAND_EVENT,
    DISCORD_MAIN_COMMAND_GET_CHANNELS,
    DISCORD_MAIN_COMMAND_GET_GUILDS,
    DISCORD_MAIN_COMMAND_GET_USERS,
    DISCORD_MAIN_COMMAND_SEND_MSG,
    DISCORD_MAIN_COMMAND_STD,
    DISCORD_MAIN_COMMAND_UPDATE_ALL,
    DISCORD_MAIN_COMMAND_LOAD_DATA,
    DISCORD_COMMAND_PLAY,
    DISCORD_COMMAND_PAUSE,
    DISCORD_COMMAND_RESUME,
    DISCORD_COMMAND_STOP
} from "./main.js";
import { join_voice, leave_voice } from "./discord_global.js";
import { createAudioPlayer, createAudioResource, StreamType } from "@discordjs/voice";
import { Readable } from 'stream'
dotenv.config();

/**
 * @type {Client}
 */
export var client;
export var prefix = 't!';
var discord_client_ready = false;

export var servers = [];

export async function init_discord()
{
    client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildExpressions,
            GatewayIntentBits.GuildInvites,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildPresences,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.DirectMessageReactions,
            GatewayIntentBits.MessageContent
        ]
    });

    await client.login(process.env.key);

    client.once('clientReady', () => {
        console.log('Discord client is ready');
        discord_client_ready = true;
        client.guilds.cache.each(guild => {
            servers[guild.id] = {
                voice: null,
                audio_player: null,
                audio_ressource: null,
                audio_stream: null
            };
        })
    });
    client.on('messageCreate', process_discord_message_event);
    client.on('interactionCreate', () => {});
    client.on('voiceStateUpdate', (old_state, new_state) => process_discord_voice_event(old_state, new_state));
}

export async function wait_for_discord_client()
{
    await wait_for_client_ready();
    send_guild_update();
}

async function wait_for_client_ready()
{
    return new Promise(async (resolve) => {
        while(!discord_client_ready)
            await sleep(100);
        resolve();
    });
}

function send_guild_update()
{
    /** @type {{guilds: Guild[], channels: Channel[], users: User[], guild_members: GuildMember[], voice_states: VoiceState[]}} */
    let data = {
        guilds: [...client.guilds.cache.values()],
        channels: [...client.channels.cache.values()],
        users: [...client.users.cache.values()],
        guild_members: []
    };

    for(let guild of data.guilds)
        for(let member of guild.members.cache.values())
        {
            let member_json = member.toJSON();
            member_json.voice = member.voice.toJSON();
            data.guild_members.push(member_json);
        }

    send_data(data, COMMAND_TYPE_DISCORD, DISCORD_MAIN_COMMAND_UPDATE_ALL);
}

/**
 * @param {Message} message_event
 */
function process_discord_message_event(message_event)
{
    // no guild or no prefix
    if( message_event.guild == null
        || !message_event.content.startsWith(prefix)) return;

    const args = message_event.content.slice(prefix.length).split(/ +/);
    let type = args.shift().toLocaleLowerCase();
    let command = args[0] != undefined ? args.shift() : null;

    send_data({
        args,
        type,
        command,
        info: message_event
    }, COMMAND_TYPE_DISCORD, DISCORD_MAIN_COMMAND_STD);
}

/**
 * @param {VoiceState} old_state
 * @param {VoiceState} new_state
 */
function process_discord_voice_event(old_state, new_state)
{
    send_data({
        event: DISCORD_EVENT_VOICE_STATE,
        old_state: old_state.toJSON(),
        new_state: new_state.toJSON()
    }, COMMAND_TYPE_DISCORD, DISCORD_MAIN_COMMAND_EVENT);
}

/**
 * @param {{main_command: import("./main.js").discord_main_command, info: object}} data
 */
export async function process_ws_message(data)
{
    switch(data.main_command)
    {
        case DISCORD_MAIN_COMMAND_STD:
            switch(data.info.task)
            {
                case DISCORD_COMMAND_JOIN_VOICE:
                    data.info.guild = get_guild(data.info.guild);
                    data.info.channel = get_channel(data.info.guild, data.info.channel);
                    join_voice(data.info.guild, data.info.channel);
                    break;
                case DISCORD_COMMAND_LEAVE_VOICE:
                    data.info.guild = get_guild(data.info.guild);
                    leave_voice(data.info.guild);
                    break;
                case DISCORD_COMMAND_PLAY:
                {
                    let buffer_object = buffers.find(value => {
                        if(value.id == data.info.buffer_id)
                            return value;
                    });
                    data.info.guild = get_guild(data.info.guild);
                    let server = servers[data.info.guild.id];
                    server.audio_player = createAudioPlayer();
                    server.audio_ressource = null;

                    server.audio_player.on("stateChange", (old_state, new_state) => {
                        if(new_state.status == "idle")
                            buffer_object.buffer = [];
                    });

                    server.voice.subscribe(server.audio_player);
                    server.audio_ressource = createAudioResource(
                        Readable.from(buffer_object.buffer)
                    );
                    server.audio_player.play(audio_ressource);

                    break;
                }
                case DISCORD_COMMAND_PAUSE:
                    data.info.guild = get_guild(data.info.guild);
                    servers[data.info.guild.id].audio_player.pause();
                    break;
                case DISCORD_COMMAND_RESUME:
                    data.info.guild = get_guild(data.info.guild);
                    servers[data.info.guild.id].audio_player.unpause();
                    break;
                case DISCORD_COMMAND_STOP:
                    data.info.guild = get_guild(data.info.guild);
                    // il faudrais clean le stream avant de fermer, ça cause un rebuffering qui casse tous
                    servers[data.info.guild.id].audio_player.stop();
                    break;
            }
            break;
        case DISCORD_MAIN_COMMAND_SEND_MSG:
        {
            let channel = get_channel(get_guild(data.info.guild), data.info.channel);
            let msg = JSON.parse(data.info.message)
            channel.send(msg).then(msg => {
                send_data({
                    event: DISCORD_EVENT_MSG_SENDED,
                    message: msg,
                    lifetime: data.info.lifetime
                }, COMMAND_TYPE_DISCORD, DISCORD_MAIN_COMMAND_EVENT);
            });
            break;
        }
        case DISCORD_MAIN_COMMAND_DELETE_MSG:
        {
            let guild = get_guild(data.info.guildId);
            let channel = get_channel(guild, data.info.channelId);
            let message = get_message(channel, data.info.id);
            if(message?.deletable)
                message.delete();
            break;
        }
        case DISCORD_MAIN_COMMAND_GET_GUILDS:
            send_data({
                guilds: [...client.guilds.cache.values()]
            }, COMMAND_TYPE_DISCORD, DISCORD_MAIN_COMMAND_GET_GUILDS);
        case DISCORD_MAIN_COMMAND_GET_CHANNELS:
        {
            let guild = get_guild(data.info?.guildId);
            let channels;
            if(guild)
                channels = get_channels(guild);
                else
                channels = get_all_channel();

            send_data({
                channels
            }, COMMAND_TYPE_DISCORD, DISCORD_MAIN_COMMAND_GET_CHANNELS);
            break;
        }
        case DISCORD_MAIN_COMMAND_GET_USERS:
            send_data({
                users: [...client.users.cache.values()]
            }, COMMAND_TYPE_DISCORD, DISCORD_MAIN_COMMAND_GET_GUILDS);
            break;
        case DISCORD_MAIN_COMMAND_LOAD_DATA:
        {
            data.info.guild = get_guild(data.info.guild);
            let server = servers[data.info.guild.id];

            if(!server.audio_stream)
                server.audio_stream = new Readable({ read() {} });

            if(!server.audio_player)
            {
                server.audio_player = createAudioPlayer();
                server.voice.subscribe(server.audio_player);

                server.audio_player.on('stateChange', (old_state, newState) => {
                    console.log(newState.status);
                    if(newState.status == 'idle')
                    {
                        server.audio_ressource = null;
                        server.audio_stream = null;
                    }
                });
            }

            if(!server.audio_ressource)
            {
                server.audio_ressource = createAudioResource(server.audio_stream);
                server.audio_player.play(server.audio_ressource);
            }

            server.audio_stream.push(Buffer.from(data.info.buffer));

            break;
        }
    };
}

/**
 *
 * @param {number} guildId 
 * @returns {Guild | null}
 */
function get_guild(guildId)
{
    return client.guilds.cache.each(() => {}).get(guildId);
}

/**
 *
 * @param {number} userId 
 * @returns {User | null}
 */
function get_user(userId)
{
    return client.users.cache.each(() => {}).get(userId);
}

/**
 *
 * @return {Array<import("discord.js").Channel> | null}
 */
function get_all_channel()
{
    let channels = [];
    client.channels.cache.each(channel => {
        channels.push(channel)
    });
    return channels;
}

/**
 *
 * @param {Guild} guild 
 * @param {number} channelId 
 * @returns {Channel | null}
 */
function get_channel(guild, channelId)
{
    return guild.channels.cache.each(() => {}).get(channelId);
}

/**
 *
 * @param {Guild} guild 
 * @returns {Array<import("discord.js").Channel> | null}
 */
function get_channels(guild)
{
    return [...guild.channels.cache.values()];
}

/**
 *
 * @param {BaseGuildTextChannel} channel 
 * @param {number} messageId 
 * @returns {Message | null}
 */
function get_message(channel, messageId)
{
    return channel.messages.cache.each(() => {}).get(messageId);
}

