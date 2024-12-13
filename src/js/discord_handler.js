import { Client, GatewayIntentBits } from "discord.js";
import { send_data } from "./websocket.js";
import dotenv from 'dotenv';
dotenv.config();

export var client;

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
{

}

function process_message(message_event)
{
    const args = message_event.content.slice(prefix.length).split(/ +/);
    let type = args.shift().toLocaleLowerCase();
    let command = args[0] != undefined ? args.shift() : null;

    send_data({args, type, command});
}
