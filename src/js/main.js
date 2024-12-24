import { init_ws } from './websocket.js';
import { init_discord } from './discord_handler.js';

export var THERESA_PORT = {
    MAIN_PORT: 42840,
    HTTP_PORT: 8080,
    WEBSOCKET_PORT: 42841
};

export var COMMAND_TYPE = {
    COMMAND_TYPE_DISCORD: 0,
    COMMAND_TYPE_APP: 1,
    COMMAND_TYPE_WEB: 2
};

export var DISCORD_COMMAND = {
    DISCORD_COMMAND_STD: 0,
    DISCORD_COMMAND_GUILD_UPDATE: 1,
    DISCORD_COMMAND_DELETE_MSG: 2
};

init_ws();
init_discord();
