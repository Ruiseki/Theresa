import { resolveSKUId } from 'discord.js';
import { COMMAND_TYPE, THERESA_PORT } from './main.js';
import WebSocket from 'ws';

export var connected = false;

var ws;
var connected = false;

function sleep(delay) {
    return new Promise((resolve) => setTimeout(resolve, delay));
}

function connection_to_theresa()
{
    return new Promise((resolve, reject) => {
        let socket = new WebSocket('ws://127.0.0.1:' + THERESA_PORT.WEBSOCKET_PORT);

        socket.on('open', () => {
            console.log('Connection ok');
            resolve(socket);
        });
        socket.on('error', (err) => {
            reject(err);
        });
        socket.on('close', (evt) => {
            reject(evt);
        });
    });
}

async function connection_handler()
{
    while(true)
    {
        if(!socket)
        {
            var socket = await connection_to_theresa()
            .catch(async (err) => {
                await sleep(1000);
            });
        }

        if(socket)
        {
            connected = true;
            socket.on('close', (evt) => {
                console.log('Connection lost');
                connected = false;
                connection_handler();
            });

            return socket;
        }
    }
}

export async function init_ws()
{
    console.log("Connecting to Theresa...");
    ws = await connection_handler()
    .catch(err => {});
}

export function send_data(data, command_type, subcommand)
{
    if(!connected) return;

    if(typeof(data) == 'object')
    {
        data = {
            command_type,
            subcommand,
            args: data
        };
        ws.send(JSON.stringify(data));
    }
    else
        ws.send(data);
}
