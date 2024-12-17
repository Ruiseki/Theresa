import { THERESA_PORT } from './main.js';

export var ws;

export function init_ws()
{
    let socket = new WebSocket(`ws://127.0.0.1:${THERESA_PORT.WEBSOCKET_PORT}`);
    
    socket.addEventListener("error", (err) => console.error(err));
    socket.addEventListener("open", (evt) => console.log(evt));
    socket.addEventListener("message", (msg) => console.log(msg));

    ws = socket;
}

function get_message(message)
{
    console.log(message);
}

export function send_data(data)
{
    if(typeof(data) == 'object')
        ws.send(JSON.stringify(data));
    else
        ws.send(data);
}
