import { Client, GatewayIntentBits } from "discord.js";
import { send_data } from "./websocket.js";
import dotenv from 'dotenv';
import { COMMAND_TYPE, DISCORD_COMMAND } from "./main.js";
dotenv.config();

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

    client.once('ready', client_ready);
    client.on('messageCreate', process_message);
}


function client_ready()
{ }

function process_message(message_event)
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
        info: {
            user_id: message_event.author.id,
            username: message_event.author.globalName,
            nickname: message_event.member.nickname,
            guild_id: message_event.guildId,
            channel_id: message_event.channelId
        }
    }, COMMAND_TYPE.COMMAND_TYPE_DISCORD, DISCORD_COMMAND.DISCORD_COMMAND_STD);
}
