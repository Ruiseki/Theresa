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

/** @typedef {number} discord_main_command */
/** @constant {discord_main_command} */
export const DISCORD_MAIN_COMMAND_STD = 0;
/** @constant {discord_main_command} */
export const DISCORD_MAIN_COMMAND_EVENT = 1;
/** @constant {discord_main_command} */
export const DISCORD_MAIN_COMMAND_UPDATE = 2;
/** @constant {discord_main_command} */
export const DISCORD_MAIN_COMMAND_UPDATE_ALL = 3;
/** @constant {discord_main_command} */
export const DISCORD_MAIN_COMMAND_SEND_MSG = 4;
/** @constant {discord_main_command} */
export const DISCORD_MAIN_COMMAND_DELETE_MSG = 5;
/** @constant {discord_main_command} */
export const DISCORD_MAIN_COMMAND_GET_CHANNEL = 6;
/** @constant {discord_main_command} */
export const DISCORD_MAIN_COMMAND_GET_CHANNELS = 7;
/** @constant {discord_main_command} */
export const DISCORD_MAIN_COMMAND_GET_USER = 8;
/** @constant {discord_main_command} */
export const DISCORD_MAIN_COMMAND_GET_USERS = 9;
/** @constant {discord_main_command} */
export const DISCORD_MAIN_COMMAND_GET_GUILD = 10;
/** @constant {discord_main_command} */
export const DISCORD_MAIN_COMMAND_GET_GUILDS = 11;

/** @typedef {number} discord_event */
/** @constant {discord_event} */
export const DISCORD_EVENT_MSG_SENDED = 0;
/** @constant {discord_event} */
export const DISCORD_EVENT_VOICE_STATE = 1;

/** @typedef {number} discord_command */
/** @constant {discord_command} */
export const DISCORD_COMMAND_JOIN_VOICE = 0x00000000;
/** @constant {discord_command} */
export const DISCORD_COMMAND_LEAVE_VOICE = 0x00000001;
/** @constant {discord_command} */
export const DISCORD_COMMAND_UNKNOWN = 0xffffffff;

export const DISCORD_MAIN_COMMAND_STR = [
    "DISCORD_MAIN_COMMAND_STD",
    "DISCORD_MAIN_COMMAND_EVENT",
    "DISCORD_MAIN_COMMAND_UPDATE",
    "DISCORD_MAIN_COMMAND_UPDATE_ALL",
    "DISCORD_MAIN_COMMAND_SEND_MSG",
    "DISCORD_MAIN_COMMAND_DELETE_MSG",
    "DISCORD_MAIN_COMMAND_GET_CHANNEL",
    "DISCORD_MAIN_COMMAND_GET_CHANNELS",
    "DISCORD_MAIN_COMMAND_GET_USER",
    "DISCORD_MAIN_COMMAND_GET_USERS",
    "DISCORD_MAIN_COMMAND_GET_GUILD",
    "DISCORD_MAIN_COMMAND_GET_GUILDS"
];

init_ws();
init_discord();

