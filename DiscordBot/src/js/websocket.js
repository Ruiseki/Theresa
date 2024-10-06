import WebSocket from 'ws';

export function init_ws()
{
    const ws = new WebSocket("ws://127.0.0.1:55000");
    
    ws.on('error', console.error);
    
    ws.on('open', function open() {
    });
    
    ws.on('message', get_message);
}

function get_message(message)
{
    console.log(message);
}
