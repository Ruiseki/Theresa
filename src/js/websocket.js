import { buffers, process_ws_message, wait_for_discord_client } from './discord_handler.js';
import { DISCORD_MAIN_COMMAND_STR, WEBSOCKET_PORT } from './main.js';
import WebSocket from 'ws';

export var connected = false;

/**
 * @type {WebSocket}
 */
var ws;
var connected = false;

/**
 * 
 * @param {number} delay in ms
 * @returns
 */
export function sleep(delay)
{
    return new Promise((resolve) => setTimeout(resolve, delay));
}

function connection_to_main_server()
{
    return new Promise((resolve, reject) => {
        let socket = new WebSocket('ws://127.0.0.1:' + WEBSOCKET_PORT);

        socket.on('open', () => {
            console.log('Connected to main server');
            wait_for_discord_client();
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
            socket = await connection_to_main_server()
            .catch(async (err) => {
                await sleep(1000);
            });
        }

        if(socket)
        {
            connected = true;

            socket.on('message', (evt) => {
                console.log(`<- text[${evt.length / 1000}ko]`);
                process_ws_message(JSON.parse(evt));
            });

            socket.on('close', async (evt) => {
                console.log('Connection to the main server lost');
                connected = false;
                buffers.splice(0, buffers.length);
                connection_handler();
            });

            ws = socket;
            return;
        }
    }
}

export async function init_ws()
{
    console.log("Connecting to main server...");
    await connection_handler();
}

export function send_data(data, command_type, main_command)
{
    if(!connected) return;

    if(typeof(data) == 'object')
    {
        data = {
            command_type,
            main_command,
            datas: data
        };
        let data_str = JSON.stringify(data);
        console.log(`-> ${DISCORD_MAIN_COMMAND_STR[main_command]} text[${data_str.length / 1000}ko]`);
        ws.send(data_str);
    }
    else
        ws.send(data);
}

