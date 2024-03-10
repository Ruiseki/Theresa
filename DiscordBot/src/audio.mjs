import { createReadStream, readdirSync, existsSync, readFileSync } from 'fs';
import { ActionRowBuilder } from 'discord.js';
import { createAudioResource } from '@discordjs/voice';
import NodeID3 from 'node-id3';
import ytdl from 'ytdl-core';
import yts from 'yt-search';

import { servers, storageLocation, joinVoice, serverSave, button, client } from './theresa.mjs';
import { reboot, simpleEmbed, getRandomInt, isUserPresentInVoiceChannel } from './tools.mjs';

const { read } = NodeID3;
// local music

export function cmd(message, command, args)
{
    message.delete();
    servers[message.guild.id].audio.lastMusicTextchannelId = message.channel.id;
    
    if(command == undefined) ;
    else
    {
        if(command == 'queue' || command == 'q')
        {
            if(checkQueueEditPermission(message.channel, message.member))
                queueMgr(message.channel, args);
        }
        else if(command == 'player' || command == 'p')
        {
            if(checkQueueEditPermission(message.channel, message.member))
                engineMgr(message.channel, args);
        }
        else if(command == 'miscellaneous' || command == 'm') miscellaneous(message, args);
        else if(command == 'playlist' || command == 'pl')     playlist(message, args);
        else                                                  audioMaster(message.member, message.channel, command, args);
    }
}

export function eventsListeners(server)
{
    server.audio.Engine.on('stateChange', (oldState, newState) => {
        if(newState.status == 'idle')
        {
            server.audio.playing = false;
            if(server.audio.restart) // restart (for ghost update)
            {
                server.audio.restart = false;
                server.audio.playing = true;
                server.audio.currentPlayingSong = server.audio.nextPlayingSong;
                serverSave(server);
                reboot();
            }
            else if(server.audio.arret)
            {
                console.log('\tIdling');
                server.audio.queue.splice(0, server.audio.queue.length)
                server.audio.currentPlayingSong = null;
                server.audio.nextPlayingSong = null;
                server.audio.arret = false;
                server.audio.loop = false;
                server.audio.loopQueue = false;
                server.audio.leave = false;

                serverSave(server);
                return; // stop
            }

            
            if(server.audio.nextPlayingSong != null)
            {
                server.audio.currentPlayingSong = server.audio.nextPlayingSong;
                runAudioEngine(server, server.global.guild);
            }
            else
            {
                console.log('\tIdling');
                server.audio.currentPlayingSong = null;
                if(server.audio.lastQueue.messageId != null)
                {
                    let channel = server.global.guild.channels.cache.get(server.audio.lastQueue.channelId);
                    channel.messages.fetch(server.audio.lastQueue.messageId).then(msg => msg.delete()).catch(() => console.error(`Message id ${msg.id} can't be reach`));
                    server.audio.lastQueue.messageId = null;
                    server.audio.lastQueue.channelId = null;
                }
                server.audio.queue.splice(0, server.audio.queue.length);
            }
        }

        else if(newState.status == 'pause') server.audio.pause = true;
        else if(oldState.status == 'pause') server.audio.pause = false;

        else if(newState.status == 'playing') server.audio.playing = true;
        else if(oldState.status == 'playing' && newState.status != 'playing') server.audio.playing = false;

        serverSave(server);
    });
}

export async function audioMaster(authorMember, channel, command, args)
{
    let server = servers[channel.guild.id]
    /*
    
        complete commande exemple : t!a World is mine >>1
        this command is special. They are no "command". The command variable contain the first word of the music.
        This isn't arranged like this for the other commands.

    */

    let music = command, queuePos = undefined, current = false;
    
    if(!authorMember.voice.channel)
    {
        error(server, channel, 3, "Please connect yourselft in a voice channel first");
        return;
    }
    
    if(args[0]) // check parameters
    {
        while(args[0])
        {
            if(args[0].startsWith('>>'))
            {
                if(args[0].substring(2) == 'c' || args[0].substring(2) == 'current')
                {
                    current = true;
                    queuePos = server.audio.currentPlayingSong;
                }
                else queuePos = QueueSelectorConverter(servers[channel.guildId], args[0].substring(2));
                
                if(queuePos == null || queuePos == undefined)
                {
                    error(server, channel, 0, 'Expected value : valid queueSelector (integer or key word that refer to an existing position in the queue)');
                    return;
                }

                break;
            }
            else
            {
                music += ' '+args.shift();
            }
        }
    }
    if(server.audio.queue.length == 0) queuePos = 0;
    else if(queuePos == undefined) queuePos = server.audio.queue.length;

    // Adding music
    let array = existsSync(`${storageLocation}/audio/${authorMember.user.id}/`) ? getPathOfFile(music, [`${storageLocation}/audio/${authorMember.user.id}/`]) : undefined;

    if(array == undefined) // YouTube
    {
        let list, video;

        if(music.startsWith('https://www.youtube.com/playlist?list='))
        {
            list = await yts({
                listId: music.substring(38)
            });
        }
        else if(music.startsWith('https://youtube.com/playlist?list='))
        {
            list = await yts({
                listId: music.substring(34)
            });
        }
        else if(music.startsWith('https://youtu.be/'))
        {
            //https://youtu.be/[videoId(11caractère)]?list=[playlistId(34caractère)]
            video = await yts({
                videoId: music.substring('https://youtu.be/'.length, 'https://youtu.be/'.length + 11)
            });
        }
        else if(music.startsWith('https://music.youtube.com/watch?v='))
        {
            //https://music.youtube.com/watch?v=[videoId(11caractère)]
            video = await yts({
                videoId: music.substring('https://music.youtube.com/watch?v='.length, 'https://music.youtube.com/watch?v='.length + 11)
            });
        }
        else if(music.startsWith('https://www.youtube.com/watch?v='))
        {
            //https://www.youtube.com/watch?v=[videoId(11caractère)]&list=[playlistId(34caractère)]&index=[indexdelavideo]
            video = await yts({ 
                videoId: music.substring(32, 32 + 11)
            }); // 32 : Size of https://www.youtube.com/watch?v=
            
        }
        else
        {
            let result = await yts(music);
            video = result.videos[0];
        }

        let embed;
        if(list == undefined)
        {
            let text = `**${video.title}**  :notes:\n*__${video.url}__*\n\n*Position : **${queuePos + 1}***\n*requested by ${authorMember.user.globalName}*`;

            embed = {
                color: '000000',
                description: text,
                thumbnail: {
                    url: video.thumbnail
                }
            };
        }
        else
        {
            let text = `**${list.title}**  :notes:\n*__${list.url}__*\n\n*Number of songs : ${list.videos.length}\nPosition : **${queuePos + 1}***\n*requested by ${authorMember.user.globalName}*`;
            embed = {
                color: '000000',
                description: text,
                thumbnail: {
                    url: list.thumbnail
                }
            };
        }

        channel.send({embeds :[embed]}).then(msg => {
            let object = {
                messageId:msg.id,
                channelId:msg.channel.id
            };
            server.global.messageTemp.push(object);
            serverSave(server);

            setTimeout(() => {
                for(let i=0; i < server.global.messageTemp.length; i++)
                {
                    if(server.global.messageTemp[i].messageId == msg.id)
                    {
                        server.global.messageTemp.splice(i,1);
                        try
                        {
                            msg.delete();
                        }
                        catch(err)
                        {
                            console.err(`Message id ${msg.id} can't be reach`)
                        }
                        serverSave(server);
                        break;
                    }
                }
            }, 30000)
        });

        if(list == undefined)
        {
            if(server.audio.currentPlayingSong == queuePos)
            {
                server.audio.queue[queuePos] = {
                    title: video.title,
                    videoId: video.videoId,
                    url: video.url,
                    thumbnail: video.thumbnail
                };
            }
            else
            {
                server.audio.queue.splice(queuePos, 0, {
                title: video.title,
                videoId: video.videoId,
                url: video.url,
                thumbnail: video.thumbnail
                });
            }
        }
        else
        {
            let videos = [];
            list.videos.forEach(video => {
                videos.push({
                    title: video.title,
                    videoId: video.videoId,
                    url: `https://www.youtube.com/watch?v=${video.videoId}`,
                    thumbnail: video.thumbnail
                });
            });
            if(server.audio.currentPlayingSong == queuePos) server.audio.queue.splice(queuePos, 1, ...videos);
            else server.audio.queue.splice(queuePos, 0, ...videos);
        }
    }
    else // Local
    {
        if(array.length > 1)
        {
            let text = '**⚠ Warning** : other similar file\n\n';
            for(let i = 0; i < array.length-1; i++)
            {
                if(i == array.length - 2    ) text += getNameFromPath(array[i],false);
                else text += getNameFromPath(array[i],false)+'\n';
            }
            simpleEmbed(server, channel, text, undefined, false, true, 10000);

            array[0] = array.pop();
        }

        let tags = read(array[0]);
        let title, artist, thumbnail;

        title = tags.title === undefined ? getNameFromPath(array[0], false) : tags.title;
        artist = tags.artist === undefined ? artist = '<unknown>' : artist = tags.artist;

        let text = `**${title}**  :notes:\n*__${artist}__*\n\n*Position : **${queuePos + 1}***\n*requested by ${authorMember.user.globalName}*`;
        
        if(tags.image != undefined)
        {
            thumbnail = tags.image.imageBuffer;
            simpleEmbed(server, channel, text, thumbnail, true, true, 30000);
        }
        else
        {
            thumbnail = undefined;
            simpleEmbed(server, channel, text, undefined, false, true, 30000);
        }
        
        if(queuePos == server.audio.queue.length)
        {
            server.audio.queue.push({
                title,
                url: `[LOCAL]${array[0]}`,
                artist,
            });
        }
        else
        {
            if(current)
            {
                server.audio.queue[server.audio.currentPlayingSong] = {
                    title,
                    url: `[LOCAL]${array[0]}`,
                    artist,
                };
            }
            else
            {
                if(server.audio.currentPlayingSong >= queuePos)
                    server.audio.currentPlayingSong++;

                server.audio.queue.splice(queuePos, 0, {
                    title,
                    url: `[LOCAL]${array[0]}`,
                    artist,
                });
            }
        }
    }

    computeNextPlayingSong(server);

    if(server.audio.currentPlayingSong == null) // play for the first time
    {
        server.audio.currentPlayingSong = 0;
        runAudioEngine(server, channel.guild);
    }
    else if(current)
    {
        server.audio.nextPlayingSong = server.audio.currentPlayingSong;
        server.audio.Engine.stop();
    }
    else if(server.audio.Engine._state.status != 'playing') // when the queue is complete and not reset
    {
        runAudioEngine(server, channel.guild);
    }
    else queueDisplay(server, 16, true); // when the engine is playing something

    serverSave(server);
}

// work in progress
export async function newAudioMaster(authorMember, channel, command, args)
{
    let server = servers[channel.guildId];

    // command exemple : t!audio Eclipse Parade -pos:next -youtube

    let params = {};

    // gettings all words starting by "-" and if they are a command, assign the requested value.
    // If not, keep them in the query
    args.splice(0, 0, command);
    args.forEach(value => {
        if(value.startsWith("-") && value.search(/:/))
        {
            value = value.split("-")[1].split(":");
            console.log(value);
            if(value[0] == "pos" || value[0] == "position") params.pos = value[1];
            else if(value[0] == "yt" || value[0] == "youtube") params.youtube = true;
        }
    });
}

export async function runAudioEngine(server, guild)
{
    server.global.voiceConnection.subscribe(server.audio.Engine);
    computeNextPlayingSong(server);
    
    let voiceChannel = guild.channels.cache.get(server.global.lastVoiceChannelId);
    joinVoice(server, voiceChannel);
    
    if(server.audio.queue[server.audio.currentPlayingSong].url.startsWith('[LOCAL]')) // local file
    {
        // check if the file exist
        if(!existsSync( server.audio.queue[server.audio.currentPlayingSong].url.substring(7) ))
        {
            console.log(`❗ File ${server.audio.queue[server.audio.currentPlayingSong].url.substring(7)} doesn't exist anymore. Deleting and skipping`);
            let text = `Unable to read the track ${server.audio.queue[server.audio.currentPlayingSong].title}`;
            let textChannel = guild.channels.cache.get(server.audio.lastMusicTextchannelId);
            simpleEmbed(server, textChannel, text, undefined, false, true, 10000);
            server.audio.queue.splice(server.audio.currentPlayingSong, 1);
            runAudioEngine(server, guild);
        }

        server.audio.resource = createAudioResource(
            createReadStream(
                server.audio.queue[server.audio.currentPlayingSong].url.substring(7)
            ), {
                inlineVolume: true
            }
        );
        server.audio.Engine.play(server.audio.resource);
    }
    else // youtube
    {
        server.audio.resource = createAudioResource(
            ytdl(server.audio.queue[server.audio.currentPlayingSong].url, {
                filter:'audioonly',
                quality:'highest',
                highWaterMark:1 << 25
            }), { 
                inlineVolume: true
            }
        );
        server.audio.Engine.play(server.audio.resource);
    }

    queueDisplay(server, 16, true);
    serverSave(servers[guild.id]);

    console.log(`\tAudio Engine loaded\n\tSong : ${server.audio.queue[server.audio.currentPlayingSong].title}`);
}

export function engineMgr(channel, args)
{
    let server = servers[channel.guildId]

    if(server.audio.Engine._state.status == 'idle') return;
    else if(!args[0]) ;
    else if(args[0] == 'stop' || args[0] == 's')
    {
        if(server.audio.Engine._state.status == 'playing')
        {
            server.audio.arret = true;
            server.audio.Engine.stop();
        }
        else
        {
            error(server, channel, 3, `Audio Engine isn't playing.`);
        }
    }
    else if(args[0] == 'pause' || args[0] == 'p')
    {
        if(server.audio.Engine._state.status == 'playing')
        {
            server.audio.Engine.pause();
        }
        else if(server.audio.Engine._state.status == 'idle')
        {
            error(server, channel, 3, `Audio Engine isn't playing.`);
        }
        else if(server.audio.Engine._state.status == 'paused')
        {
            error(server, channel, 3, `Audio Engine is in pause.`);
        }
    }
    else if(args[0] == 'play' || args[0] == 'pl')
    {
        if(server.audio.Engine._state.status == 'paused')
        {
            server.audio.Engine.unpause();
        }
        else
        {
            if(server.audio.lastQueue.channelId != null)
            {
                let lastQueueChannel = channel.guild.channels.cache.get(server.audio.lastQueue.channelId);
                lastQueueChannel.messages.fetch(server.audio.lastQueue.messageId)
                .then(m => m.delete())
                .catch(() => console.error(`Message id ${msg.id} can't be reach`));
            }
            error(server, channel, 3, `Audio Engine isn't playing.`);
        }
    }
    else if(args[0] == 'replay' || args[0] == 'r')
    {
        if(server.audio.Engine)
        {
            server.audio.nextPlayingSong = server.audio.currentPlayingSong;
            server.audio.Engine.stop();
        }
        else
        {
            if(server.audio.queue[0])
            {
                server.audio.nextPlayingSong = server.audio.currentPlayingSong;
                server.audio.Engine.stop();
            }
            else
            {
                error(server, channel, 3, 'There is no queue');
            }
        }
    }
    else if(args[0] == 'skip' || args[0] == 's' || args[0] == '>')
    {
        console.log('\tNext');
        server.audio.nextPlayingSong = server.audio.queue[server.audio.currentPlayingSong+1] ? server.audio.currentPlayingSong + 1 : server.audio.loopQueue ? 0 : null;
        if(server.audio.Engine._state.status != 'playing' && server.audio.queue.length != 0)
            server.audio.Engine.unpause();
        server.audio.Engine.stop();
    }
    else if(args[0] == 'previous' || args[0] == '<')
    {
        console.log('\tPrevious');
        server.audio.nextPlayingSong = server.audio.currentPlayingSong - 1 >= 0 ? server.audio.currentPlayingSong - 1 : 0;
        server.audio.Engine.stop();
    }
    else if(args[0] == 'go')
    {
        console.log('\tGo');
        if(args[1])
        {
            args.shift();
            args = args.join(' ');
            let index = QueueSelectorConverter(server, args);
            if(index == null)
            {
                error(server, channel, 0, 'Expected value : valid queue selector');
                return;
            }
            else server.audio.nextPlayingSong = index;

            if(server.audio.Engine)
                server.audio.Engine.stop();

            else runAudioEngine(server, channel.guild);
        }
    }
    else if(args[0] == 'loop' || args[0] == 'l')
    {
        console.log('\tLoop');
        if(!server.audio.queue[0])
        { 
            error(server, channel, 3, 'There is no queue');
        }
        else
        {
            if(server.audio.loop)
            {
                server.audio.loop = false;
                computeNextPlayingSong(server);
                simpleEmbed(server, channel, '**Loop Off ➡**', undefined, false, true, 1000);
            }
            else
            {
                server.audio.loop = true;
                computeNextPlayingSong(server);
                simpleEmbed(server, channel, '**Loop On 🔂**', undefined, false, true, 1000);
            }
            
            queueDisplay(server, 16, true);
        }
    }
    else if(args[0] == 'loopqueue' || args[0] == 'lq')
    {
        console.log('\tLoop queue');
        if(!server.audio.queue[0])
        { 
            error(server, channel, 3, 'There is no queue');
        }
        else
        {
            if(server.audio.loopQueue)
            {
                server.audio.loopQueue = false;
                simpleEmbed(server, channel, '**Loop queue Off ➡**', undefined, false, true, 1000);
            }
            else
            {
                server.audio.loopQueue = true;
                simpleEmbed(server, channel, '**Loop queue On 🔁**', undefined, false, true, 1000);
            }

            computeNextPlayingSong(server);
            queueDisplay(server, 16, true);
        }
    }

    serverSave(server);
}

export async function queueMgr(channel, args)
{
    let server = servers[channel.guild.id];
    console.log(`\tQueue Manager`);
    /*
        Command exemple :
        t!a queue
        t!a queue skip | t!a queue previous
        t!a queue go 3
        t!a delete 3 | t!a delete 3 7 | t!a delete 1 3 4 5 7 8 9 34
        t!a queue clear
        ...

    */

    if(!args[0])
    {
        if(!server.audio.queue[0]) return;
        else queueDisplay(server, 16, true);
    }
    else if(args[0] == 'clear' || args[0] == 'c')
    {
        if(!server.audio.Engine) return;
        console.log('\tClear');

        // possible problem when engine is in pause
        if(server.audio.playing)
        {
            server.audio.arret = true;
            server.audio.Engine.stop();
        }

        if(server.audio.lastQueue.channelId != null)
        {
            let lastQueueChannel = channel.guild.channels.cache.get(server.audio.lastQueue.channelId);
            lastQueueChannel.messages.fetch(server.audio.lastQueue.messageId)
            .then(m => {
                m.delete();
                server.audio.lastQueue.messageId = null;
                server.audio.lastQueue.channelId = null;
                serverSave(server);
            })
            .catch(() => console.error(`Message id ${server.audio.lastQueue.messageId} can't be reach`));
        }
    }
    else if(args[0] == 'delete' || args[0] == 'd' || args[0] == 'remove' || args[0] == 'r')
    {
        console.log('\tDelete');
        if(!args[1]) error(server, channel, 1, 'No argument(s) detected');
        else if(args.length == 2) // single
        {
            args[1] = QueueSelectorConverter(server, args[1]);
            if(args[1] == null)
            {
                error(server, channel, 0, "The argument must be a valid queue selector or an number between 0 and the size of the queue.");
                return;
            }

            server.audio.queue.splice(args[1], 1);
            if(args[1] < server.audio.currentPlayingSong)
            {
                server.audio.currentPlayingSong--;
            }
            else if(args[1] == server.audio.currentPlayingSong)
            {
                server.audio.currentPlayingSong--;
                server.audio.Engine.stop();
            }
        }
        else if(args.length == 3) // range
        {
            args[1] = QueueSelectorConverter(server, args[1]);
            args[2] = QueueSelectorConverter(server, args[2]);
            
            if(args[2] <= args[1])
            {
                error(server, channel, 0, '2nd argument must be superior to the 1st argument');
                return;
            }
            else
            {
                server.audio.queue.splice(args[1], args[2] - args[1] + 1);
                if(server.audio.currentPlayingSong >= args[1] && server.audio.currentPlayingSong <= args[2])
                {
                    server.audio.currentPlayingSong = args[1] - 1;
                    server.audio.Engine.stop();
                }
                else if(server.audio.currentPlayingSong > args[2])
                {
                    server.audio.currentPlayingSong -= args[2] - args[1] + 1;
                }
            }
        }
        else // multiple
        {
            let needStop = false
            for(let i = 1; i < args.length; i++)
            {
                args[i] = QueueSelectorConverter(server, args[i]);
                if(args[i] == null)
                {
                    error(server, channel, 0, `\"${args[i]}\" This argument must be a valid queue selector or an number between 0 and the size of the queue.`);
                    continue;
                }
                server.audio.queue.splice(args[1],1);
                if(args[i] <= server.audio.currentPlayingSong) server.audio.currentPlayingSong--;
                if(args[i] == server.audio.currentPlayingSong && server.audio.Engine._state.status == 'playing') needStop = true;
            }
            if(needStop) server.audio.Engine.stop();
        }

        queueDisplay(server, 16, true);
    }
    else if(args[0] == 'move' || args[0] == 'm') error(server, channel, 3, 'Work in progress');
    else if(args[0] == 'swap' || args[0] == 'sw')
    {
        console.log('\tSwap');
        if(args.length == 1)
        {
            error(server, channel, 1, 'Please precise the 1st arguments');
            return;
        }
        else if(args.length == 2)
        {
            error(server, channel, 1, 'Please precise the 2nd arguments');
            return;
        }

        args[1] = QueueSelectorConverter(server, args[1]);
        args[2] = QueueSelectorConverter(server, args[2]);

        if(args[1] == null || args[2] == null) error(server, channel, 0, 'The argument must be a valid queue selector or an number between 0 and the size of the queue.')
        else if(args[1] == args[2]) error(server, channel, 0, 'The arguments can\'t have the same value');
        
        let temp = server.audio.queue[args[1]];
        server.audio.queue[args[1]] = server.audio.queue[args[2]];
        server.audio.queue[args[2]] = temp;

        if(args[1] == server.audio.currentPlayingSong || args[2] == server.audio.currentPlayingSong) 
        {
            server.audio.Engine.stop();
        }
        else queueDisplay(server, 16, true);
    }
    else if(args[0] == 'shuffle' || args[0] == 'sh')
    {
        let shuffledMusic = server.audio.queue;
        server.audio.queue = [];
        let indiceAlea;;
        for(let i = shuffledMusic.length; i > 0; i--)
        {
            indiceAlea = getRandomInt(shuffledMusic.length - 1);
            server.audio.queue.push(shuffledMusic[indiceAlea]);
            shuffledMusic.splice(indiceAlea, 1);
        }

        if(server.audio.Engine._state.status == 'playing')
        {
            server.audio.nextPlayingSong = server.audio.currentPlayingSong;
            server.audio.Engine.stop();
        }
        else runAudioEngine(server, guild);
    }
    else if(args[0] == 'current' || args[0] == 'ct') error(server, channel, 3, 'Work in progress');

    serverSave(server);
}

async function miscellaneous(message, args)
{
    /*
        Command exemple :
        t!a miscellaneous localshuffle | t!a m ls
        t!a m find ka
    */
    
    let server = servers[message.guild.id];
    if(!args[0]) error(server, message.channel, 1, 'Please precise your intention(s).');
    else if(args[0] == 'find' || args[0] == 'f')
    {
        let array = getPathOfFile(args[1], [`${storageLocation}/audio/${message.author.id}/`]);
        if(array == undefined) simpleEmbed(server, message.channel, 'No file was found ❌', undefined, false, true, 3000);
        else
        {
            let text = '';
            for(let object of array)
            {
                let tags = read(object);
                text += `${getNameFromPath(object, false)}`;
                if(tags.title != undefined) text += ` ➡️ ${tags.title}`;
                text += '\n';
            }
            message.channel.send({
                embeds: [
                    {
                        color: '000000',
                        title: 'Found file(s) :',
                        description: text
                    }
                ]
            }).then(msg => {
                server.global.messageTemp.push({
                    messageId: msg.id,
                    channelId: msg.channel.id
                });
                serverSave(server);
                
                setTimeout(() => {
                    for(let i=0; i < server.global.messageTemp.length; i++)
                    {
                        if(server.global.messageTemp[i].messageId == msg.id)
                        {
                            server.global.messageTemp.splice(i,1);
                            try
                            {
                                msg.delete();
                            }
                            catch(err)
                            {
                                console.err(`Message id ${msg.id} can't be reach`);
                            }
                            serverSave(server);
                            break;
                        }
                    }
                }, 30000);
            });
        }
    }
    else if(args[0] == 'localshuffle' || args[0] == 'ls')
    {
        if(!message.member.voice.channel)
        {
            error(server, channel, 3, "Please connect yourselft in a voice channel first");
            return;
        }
        if(!server.audio.queue[0]) server.audio.currentPlayingSong = 0;

        const url = `http://${process.env.apiUrl}:${process.env.apiPort}/musics/random/${message.author.id}`;
        let userMusics = await fetch(url).then(result => result.json());
        
        for(let element of userMusics)
        element.url = `[LOCAL]${storageLocation}/audio/${message.author.id}/${element.url}`;
    
        server.audio.queue.push(...userMusics);
        
        if(server.audio.Engine._state.status != 'playing') // playing or adding to the queue
            runAudioEngine(server, message.guild);
        else
            queueDisplay(server, 16, true);
    }
    else if(args[0] == 'folder' || args[0] == 'fd')
    {
        if(!args[1])
        {
            error(server, message.channel, 1, 'Folder path is missing');
            return;
        }
        else
        {
            args.shift();
            let filePath = args.join(' ');
            if(existsSync(filePath))
            {
                readdirSync(filePath).forEach(file => {
                    if(file.substring(file.length-4) == '.mp3' || file.substring(file.length-4) == '.wav' || file.substring(file.length-5) == '.flac')
                    {
                        server.audio.queue.push({
                            title: file,
                            url: `[LOCAL]${filePath}\\${file}`,
                            artist: '<unknown>'
                        });
                    }
                });
                
                if(server.audio.currentPlayingSong == null) server.audio.currentPlayingSong = 0;

                if(server.audio.Engine._state.status != 'playing') runAudioEngine(server, server.global.guild);
                else queueDisplay(server, 16, true);
            }
        }
    }
}

export async function queueDisplay(server, nbrOfMusicDisplayed, isKeep)
{
    let text;

    // --------------------------------------------------------------------------------
    // Indique the loop status in top of the queue

    text = '*Options :* ';

    if(!server.audio.loop && !server.audio.loopQueue && !server.audio.restart)
    {
        text += '**None**';
    }
    else
    {
        if(server.audio.loop) text += '🔂';
        if(server.audio.loopQueue) text += '🔁';
        if(server.audio.restart) text += '⏏';
    }
    text += '\n';

    // --------------------------------------------------------------------------------
    // playing status

    text += '*Status :* ';
    if(server.audio.Engine._state.status == 'paused') text += '**Paused** ⏸';
    else text += '**Playing** ▶';
    text += '\n';
    
    // --------------------------------------------------------------------------------
    // number of song in the queue
    
    text += `*Numbers of song in the queue : **${server.audio.queue.length}***`;
    text += '\n\n';
    
    // --------------------------------------------------------------------------------
    // calculating the index of the first music to be displayed

    let startAt, afterCurrent = Number.parseInt(nbrOfMusicDisplayed / 4);
    if(server.audio.queue.length <= nbrOfMusicDisplayed) startAt = 0;
    else
    {
        // at the begining
        if(server.audio.currentPlayingSong < afterCurrent) startAt = 0;
        // at the end
        else if(server.audio.queue.length - (server.audio.currentPlayingSong - afterCurrent) < nbrOfMusicDisplayed) startAt = server.audio.queue.length - nbrOfMusicDisplayed;
        // another else
        else startAt = server.audio.currentPlayingSong - afterCurrent;
    }

    // --------------------------------------------------------------------------------
    // building the text of the queue

    for(let i = startAt; i < server.audio.queue.length; i++)
    {
        if(i == server.audio.currentPlayingSong) // current song
        {
            text += `:arrow_right:  **${server.audio.queue[i].title}**  :arrow_left:\n`;
        }
        else
        {
            if(server.audio.queue[i].url.startsWith('[LOCAL]'))
            {
                text += `${i + 1}: ${server.audio.queue[i].title}\n`;
            }
            else
            {
                // YouTube
                text += `${i + 1}: ${server.audio.queue[i].title}\n`;
            }
        }

        if(i - startAt == nbrOfMusicDisplayed - 1) break;
    }
    
    // --------------------------------------------------------------------------------
    // Embed generator

    let firstRow = new ActionRowBuilder()
        .addComponents(
            button.audio.previousBtn,
            button.audio.stopBtn,
            button.audio.pausePlayBtn,
            button.audio.nextBtn
        );
    let secondRow = new ActionRowBuilder()
        .addComponents(
            button.audio.viewMore,
            button.audio.loop,
            button.audio.loopQueue,
            button.audio.replay
        );

    let messageOption = {
        embeds: [
            {
                color: '000000',
                title: 'Music Queue  :notes:',
                description: text,
                thumbnail: {
                    url: 'attachment://file.jpg'
                }
            }
        ],
        files: [],
        components: [firstRow, secondRow]
    };

    if(server.audio.queue[server.audio.currentPlayingSong] && server.audio.queue[server.audio.currentPlayingSong].url.startsWith('[LOCAL]')) // Local
    {
        let tags = read(server.audio.queue[server.audio.currentPlayingSong].url.substring(7));

        if(tags.image != undefined) messageOption.files[0] = tags.image.imageBuffer;
        else messageOption.files[0] = readFileSync(`${storageLocation}/ressource/image/noThumbnail.png`);
    }
    else messageOption.embeds[0].thumbnail.url = server.audio.queue[server.audio.currentPlayingSong].thumbnail; // YouTube

    // --------------------------------------------------------------------------------
    // checking if the last message is the queue message and in the correct channel

    let channelOfTheLastQueue = server.global.guild.channels.cache.get(server.audio.lastQueue.channelId), willEditQueueMessage = false;
    if(channelOfTheLastQueue)
    {
        channelOfTheLastQueue.messages.fetch({limit:1})
        .then(messages => {
            messages.forEach(msg => {
                if(msg.id == server.audio.lastQueue.messageId) willEditQueueMessage = true;
            });
        }).then(() => {

            if(server.audio.lastQueue.channelId != server.audio.lastMusicTextchannelId) willEditQueueMessage = false;

            if(willEditQueueMessage)
            {
                // --------------------------------------------------------------------------------
                // editing the old queue
    
                let lastQueueMessage = channelOfTheLastQueue.messages.cache.get(server.audio.lastQueue.messageId);
                lastQueueMessage.edit(messageOption);
            }
            else
            {
                // --------------------------------------------------------------------------------
                // deleting the old queue ...
        
                if(server.audio.lastQueue.channelId != null)
                {
                    let channelOfTheLastQueue = server.global.guild.channels.cache.get(server.audio.lastQueue.channelId);
                    channelOfTheLastQueue.messages.fetch(server.audio.lastQueue.messageId)
                    .then(queueMessage => queueMessage.delete())
                    .catch(() => console.error(`Message id ${server.audio.lastQueue.messageId} can't be reach`));
                }
                
                // --------------------------------------------------------------------------------
                // ... and resend it
    
                let chn = server.global.guild.channels.cache.get(server.audio.lastMusicTextchannelId); // last music channel
        
                if(isKeep)
                {
                    chn.send(messageOption)
                    .then(m => {
                        server.audio.lastQueue.messageId = m.id;
                        server.audio.lastQueue.channelId = m.channel.id;
                        serverSave(server);
                    });
                }
                else
                {
                    chn.send(messageOption)
                    .then(msg => {
                        server.audio.lastQueue.messageId = msg.id;
                        server.audio.lastQueue.channelId = msg.channel.id;
                        serverSave(server);
                        setTimeout(function(){queueDisplay(server, 16, true)}, 120000);
                    });
                    serverSave(server);
                }
            }
        });
    }
    else
    {
        let chn = server.global.guild.channels.cache.get(server.audio.lastMusicTextchannelId); // last music channel
        
        if(isKeep)
        {
            chn.send(messageOption)
            .then(m => {
                server.audio.lastQueue.messageId = m.id;
                server.audio.lastQueue.channelId = m.channel.id;
                serverSave(server);
            });
        }
        else
        {
            chn.send(messageOption)
            .then(msg => {
                server.audio.lastQueue.messageId = msg.id;
                server.audio.lastQueue.channelId = msg.channel.id;
                serverSave(server);
                setTimeout(() => {queueDisplay(server, 16, true)}, 120000);
            });
            serverSave(server);
        }
    }
}

function computeNextPlayingSong(server)
{
    if(server.audio.loop)
        server.audio.nextPlayingSong = server.audio.currentPlayingSong;
    else
    {
        server.audio.nextPlayingSong = server.audio.currentPlayingSong + 1;

        if(server.audio.nextPlayingSong == server.audio.queue.length)
        {
            if(server.audio.loopQueue) server.audio.nextPlayingSong = 0;
            else server.audio.nextPlayingSong = null;
        }
    }
}

function playlist(message, args)
{
    let server = servers[message.guild.id];
    if(!args[0]) error(server, message.channel, 1, 'Possible action : *please fill this line of text Ruiseki sama~*')
    
    let user = server.users.find(element => element.userId == message.author.id);
    if(args[0] == 'create') { }
}

function QueueSelectorConverter(server, arg)
{
    if(arg == "a" || arg == "after" || arg == 'aft' || arg == "next" || arg == "n")
    {
        if(server.audio.currentPlayingSong == server.audio.queue.length - 1) return null;
        else return server.audio.currentPlayingSong + 1;
    }
    else if(arg == "p" || arg == "previous" || arg == "befor" || arg == "b")
    {
        if(server.audio.currentPlayingSong == 0) return null;
        return server.audio.currentPlayingSong; // <- will be inserted, so p = current
    }
    else if(arg == "f" || arg == "final" || arg == "end" || arg == "e")
    {
        return server.audio.queue.length - 1;
    }
    else
    {
        if(isNaN(Number.parseInt(arg)))
        {
            let mach = [], perfectMach = null;
            for(let i = 0; i < server.audio.queue.length; i++)
            {
                if(server.audio.queue[i].title.toLocaleLowerCase() == arg.toLocaleLowerCase())
                {
                    perfectMach = i;
                    break;
                }
                else if( server.audio.queue[i].title.toLocaleLowerCase().startsWith(arg.toLocaleLowerCase()) ) mach.push(i);
            }

            if(perfectMach == null && mach.length == 0) return null;
            else if(perfectMach) return perfectMach;
            else
            {
                let returnedValue = mach.shift();
                if(mach.length > 0)
                {
                    let text = `*Searching " __${arg}__ "*\n**⚠️ Other similar track : **\n\n`;
                    mach.forEach(element => {
                        text += `${element}: ${server.audio.queue[element].title}\n`;
                    });
                    simpleEmbed(server, server.global.guild.channels.cache.get(server.audio.lastMusicTextchannelId), text, undefined, false, true, 20000);
                }

                return returnedValue;
            }
        }
        else
        {
            arg = Number.parseInt(arg);
            if(arg > 0 && arg <= server.audio.queue.length) return arg - 1;
            else return null;
        }
    }
}

function getNameFromPath(path,needExtension)
{
    let word = path.split(/\//);
    let fileName = word[word.length-1];
    if(needExtension) return fileName;
    else
    {
        let extension = fileName.split(/\./),
        extensionSize = extension[extension.length-1].length+1;
        return fileName.substring(0,fileName.length-extensionSize);
    }
}

function getPathOfFile(targetName, directory)
{
    /*
        Will give the path of "targetName" in "directory".
        Return an array of all file that commence by this name.
        Return undefined if doesn't exist.
    */

    let array=[];
    for(let path of directory)
    {
        let files = readdirSync(path);
        for(let file of files)
        {
            if(file.toLocaleLowerCase() == (targetName.toLocaleLowerCase()+'.mp3' || targetName.toLocaleLowerCase()+'.wav'))
            {
                array.splice(0,array.length);
                array.push(path+file);
                return array;
            }
            if(file.toLocaleLowerCase().startsWith(targetName.toLocaleLowerCase())) array.push(path+file);
        }
    }
    if(array.length == 0) return undefined;
    else return array;
    
}

export function clearMessagesTemps(server, guild)
{
    server.global.messageTemp.forEach(element => // deleting other audio temporary message
        {
            let channel = guild.channels.cache.get(element.channelId);
            channel.messages.fetch(element.messageId)
            .then( m => {
                try
                {
                    m.delete();
                }
                catch(err)
                {
                    console.error(`Message id ${msg.id} can't be reach in "clearMessagesTemps"`);
                }
            });
        });
    server.global.messageTemp = [];
}

function error(server, channel, type, text)
{
    /*
        Error type :
        -1 : Invalid Syntaxe
        0 : Invalid Argument
        1 : Missing Argument
        2 : Incomplete Command
        3 : Command fail
    */
    let messageContent;
    if(type == -1) messageContent = `**⚠ Invalid syntaxe ⚠**\n${text}`;
    else if(type == 0) messageContent = `**⚠ Invalide argument ⚠**\n${text}`;
    else if(type == 1) messageContent = `**⚠ Missing argument ⚠**\n${text}`;
    else if(type == 2) messageContent = `**⚠ Incomplete command ⚠**\n${text}`;
    else if(type == 3) messageContent = `**⚠ Command has fail ⚠**\n${text}`;

    channel.send(messageContent).then(msg => {
        server.audio.lastQueue.messageId = msg.id;
        server.audio.lastQueue.channelId = msg.channel.id;
        serverSave(server);
        setTimeout(function(){
            if(server.audio.lastQueue.messageId != null)
            {
                try {
                    msg.delete();
                } catch (error) {
                    console.error(`Message id ${msg.id} can't be reach`);
                }
            }
        }, 5000);
    });
    server.audio.lastQueue.channelId=undefined;
    server.audio.lastQueue.messageId=undefined;
    serverSave(server);
}

export function checkQueueEditPermission(channel, authorMember)
{
    if( isUserPresentInVoiceChannel(authorMember.user.id, servers[channel.guildId].global.voiceConnection.joinConfig.channelId) )
        return true;
    else
    {
        let username = authorMember.nickname ? authorMember.nickname : authorMember.user.globalName;
        let text = `❌ **Acces denied to the queue for ${username}**`;
        simpleEmbed(servers[channel.guildId], channel, text, undefined, false, true, 120000);
        return false;
    }
}