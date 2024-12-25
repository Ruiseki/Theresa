import { process_ws_message } from './discord_handler.js';
import { WEBSOCKET_PORT } from './main.js';
import WebSocket from 'ws';

export var connected = false;

/**
 * @type {WebSocket}
 */
var ws;
var connected = false;

function sleep(delay) {
    return new Promise((resolve) => setTimeout(resolve, delay));
}

function connection_to_theresa()
{
    return new Promise((resolve, reject) => {
        let socket = new WebSocket('ws://127.0.0.1:' + WEBSOCKET_PORT);

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
    /**
     * @type {WebSocket}
     */
    let socket;
    while(true)
    {
        if(!socket)
        {
            socket = await connection_to_theresa()
            .catch(async (err) => {
                await sleep(1000);
            });
        }

        if(socket)
        {
            connected = true;

            socket.on('message', (evt) => {
                process_ws_message(JSON.parse(evt));
            });

            socket.on('close', async (evt) => {
                console.log('Connection lost');
                connected = false;
                connection_handler();
            });

            ws = socket;
            return;
        }
    }
}

export async function init_ws()
{
    console.log("Connecting to Theresa...");
    await connection_handler()
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
            datas: data
        };
        ws.send(JSON.stringify(data));
    }
    else
        ws.send(data);
}
