import { init_ws } from './websocket.js';
import { init_discord } from './discord_handler.js';

/** @typedef {number} theresa_port */
/** @constant {theresa_port} */
export const MAIN_PORT = 42840;
/** @constant {theresa_port} */
export const HTTP_PORT = 8080;
/** @constant {theresa_port} */
export const WEBSOCKET_PORT = 42841;

/** @typedef {number} command_type */
/** @constant {command_type} */
export const COMMAND_TYPE_DISCORD = 0;
/** @constant {command_type} */
export const COMMAND_TYPE_APP = 1;
/** @constant {command_type} */
export const COMMAND_TYPE_WEB = 2;

/** @typedef {number} discord_subcommand */
/** @constant {discord_subcommand} */
export const DISCORD_COMMAND_STD = 0;
/** @constant {discord_subcommand} */
export const DISCORD_COMMAND_GUILD_UPDATE = 1;
/** @constant {discord_subcommand} */
export const DISCORD_COMMAND_DELETE_MSG = 2;

init_ws();
init_discord();
