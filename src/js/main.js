import { init_ws } from './websocket.js';
import { init_discord } from './discord_handler.js';

export var THERESA_PORT = {
    MAIN_PORT: 42840,
    HTTP_PORT: 8080,
    WEBSOCKET_PORT: 42841
};

init_ws();
// init_discord();
