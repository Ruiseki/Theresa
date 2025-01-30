import { joinVoiceChannel } from '@discordjs/voice';
import { Guild, GuildChannel, User } from "discord.js";
import { servers } from "./discord_handler.js";

/**
 * 
 * @param {User} user 
 * @param {Guild} guild 
 * @param {GuildChannel} channel
 */
export function join_voice(guild, channel)
{
    servers[guild.id].voice = joinVoiceChannel({
        channelId: channel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator
    });
}

/**
 * 
 * @param {Guild} guild 
 */
export function leave_voice(guild)
{
    servers[guild.id].voice.destroy();
}