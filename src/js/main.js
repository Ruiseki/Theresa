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
export const DISCORD_SUBCOMMAND_STD = 0;
/** @constant {discord_subcommand} */
export const DISCORD_SUBCOMMAND_UPDATE = 1;
/** @constant {discord_subcommand} */
export const DISCORD_SUBCOMMAND_DELETE_MSG = 2;
/** @constant {discord_subcommand} */
export const DISCORD_SUBCOMMAND_GET_CHANNEL = 3;
/** @constant {discord_subcommand} */
export const DISCORD_SUBCOMMAND_GET_CHANNELS = 4;
/** @constant {discord_subcommand} */
export const DISCORD_SUBCOMMAND_GET_USER = 5;
/** @constant {discord_subcommand} */
export const DISCORD_SUBCOMMAND_GET_USERS = 6;
/** @constant {discord_subcommand} */
export const DISCORD_SUBCOMMAND_GET_GUILD = 7;
/** @constant {discord_subcommand} */
export const DISCORD_SUBCOMMAND_GET_GUILDS = 8;

/** @typedef {number} discord_command */
/** @constant {discord_command} */
export const DISCORD_COMMAND_JOIN_VOICE = 0x00000000;
/** @constant {discord_command} */
export const DISCORD_COMMAND_LEAVE_VOICE = 0x00000001;
/** @constant {discord_command} */
export const DISCORD_COMMAND_UNKNOWN = 0xffffffff;

export const DISCORD_SUBCOMMAND_STR = [
    "DISCORD_SUBCOMMAND_STD",
    "DISCORD_SUBCOMMAND_UPDATE",
    "DISCORD_SUBCOMMAND_DELETE_MSG",
    "DISCORD_SUBCOMMAND_GET_CHANNEL",
    "DISCORD_SUBCOMMAND_GET_CHANNELS",
    "DISCORD_SUBCOMMAND_GET_USER",
    "DISCORD_SUBCOMMAND_GET_USERS",
    "DISCORD_SUBCOMMAND_GET_GUILD",
    "DISCORD_SUBCOMMAND_GET_GUILDS"
];

init_ws();
init_discord();
