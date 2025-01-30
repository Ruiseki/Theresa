import { BaseGuildTextChannel, Client, GatewayIntentBits, Guild, GuildMember, Message, User, VoiceState } from "discord.js";
import { send_data, sleep } from "./websocket.js";
import dotenv from 'dotenv';
import { COMMAND_TYPE_DISCORD, DISCORD_COMMAND_JOIN_VOICE, DISCORD_COMMAND_LEAVE_VOICE, DISCORD_SUBCOMMAND_DELETE_MSG, DISCORD_SUBCOMMAND_GET_CHANNELS, DISCORD_SUBCOMMAND_GET_GUILDS, DISCORD_SUBCOMMAND_GET_USERS, DISCORD_SUBCOMMAND_STD, DISCORD_SUBCOMMAND_UPDATE } from "./main.js";
import { join_voice, leave_voice } from "./discord_global.js";
dotenv.config();

/**
 * @type {Client}
 */
export var client;
export var prefix = 't!';
var client_ready = false;

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

    client.once('ready', () => {
        console.log('Discord client is ready');
        client_ready = true;
        client.guilds.cache.each(guild => {
            servers[guild.id] = {
                voice: null,
                audio_engine: null
            };
        })
    });
    client.on('messageCreate', process_discord_message);
}

export async function theresa_connected()
{
    await wait_for_client_ready();
    send_guild_update();
}

async function wait_for_client_ready()
{
    return new Promise(async (resolve) => {
        while(!client_ready)
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

    send_data(data, COMMAND_TYPE_DISCORD, DISCORD_SUBCOMMAND_UPDATE);
}

/**
 * @param {Message} message_event
 */
function process_discord_message(message_event)
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
    }, COMMAND_TYPE_DISCORD, DISCORD_SUBCOMMAND_STD);
}

/**
 * @param {{subcommand: import("./main.js").discord_subcommand, info: object}} data 
 */
export function process_ws_message(data)
{
    if(data.subcommand == DISCORD_SUBCOMMAND_STD)
    {
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

        }
    }
    else if(data.subcommand == DISCORD_SUBCOMMAND_DELETE_MSG)
    {
        let guild = get_guild(data.info.guildId);
        let channel = get_channel(guild, data.info.channelId);
        let message = get_message(channel, data.info.id);
        if(message?.deletable)
            message.delete();
    }
    else if(data.subcommand == DISCORD_SUBCOMMAND_GET_GUILDS)
    {
        send_data({
            guilds: [...client.guilds.cache.values()]
        }, COMMAND_TYPE_DISCORD, DISCORD_SUBCOMMAND_GET_GUILDS);
    }
    else if(data.subcommand == DISCORD_SUBCOMMAND_GET_CHANNELS)
    {
        let guild = get_guild(data.info?.guildId);
        let channels;
        if(guild)
            channels = get_channels(guild);
        else
            channels = get_all_channel();

        send_data({
            channels
        }, COMMAND_TYPE_DISCORD, DISCORD_SUBCOMMAND_GET_CHANNELS);
    }
    else if(data.subcommand == DISCORD_SUBCOMMAND_GET_USERS)
    {
        send_data({
            users: [...client.users.cache.values()]
        }, COMMAND_TYPE_DISCORD, DISCORD_SUBCOMMAND_GET_GUILDS);
    }
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
