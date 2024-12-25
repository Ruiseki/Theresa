import { BaseGuildTextChannel, channelLink, Client, GatewayIntentBits, Guild, GuildChannel, GuildChannelManager, GuildManager, Message } from "discord.js";
import { send_data } from "./websocket.js";
import dotenv from 'dotenv';
import { COMMAND_TYPE_DISCORD, DISCORD_COMMAND_DELETE_MSG, DISCORD_COMMAND_STD } from "./main.js";
dotenv.config();

/**
 * @type {Client}
 */
export var client;
export var prefix = 't!';

export async function init_discord()
{
    client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildEmojisAndStickers,
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

    client.once('ready', () => {});
    client.on('messageCreate', process_discord_message);
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
    }, COMMAND_TYPE_DISCORD, DISCORD_COMMAND_STD);
}

/**
 * @param {{id: number, guildId: number, channelId: number, subcommand: import("./main.js").discord_subcommand}} data 
 */
export function process_ws_message(data)
{
    if(data.subcommand == DISCORD_COMMAND_DELETE_MSG)
    {
        let guild = get_guild(data.guildId);
        let channel = get_channel(guild, data.channelId);
        let message = get_message(channel, data.id);
        if(message.deletable)
            message.delete();
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
 * @param {BaseGuildTextChannel} channel 
 * @param {number} messageId 
 * @returns {Message | null}
 */
function get_message(channel, messageId)
{
    return channel.messages.cache.each(() => {}).get(messageId);
}
