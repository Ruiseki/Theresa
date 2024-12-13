import { THERESA_PORT } from './main.js';

export var ws;

export function init_ws()
{
    ws = new WebSocket(`ws://127.0.0.1:${THERESA_PORT.WEBSOCKET_PORT}`);

    /* ws.on('error', console.error);
    
    ws.on('open', function open() { });
    
    ws.on('message', get_message); */
}

function get_message(message)
{
    console.log(message);
}

export function send_data(data)
{
    ws.send(data);
}
