const FS = require('fs');
const Discord = require('discord.js');
const Voice = require('@discordjs/voice');
const NodeID3 = require('node-id3');
const ytdl = require('ytdl-core');

const Theresa = require('./Theresa.js');
const yts = require('yt-search');
const Tools = require('./tools.js');

// local music
var musicDirectory = require('./audio/musicDirectory.json');

module.exports = class Audio
{
    static cmd(servers, prefix, command, args, message)
    {
        message.delete();
        servers[message.guild.id].audio.lastMusicTextchannelId = message.channel.id;
        
        if(command == undefined) ;
        else
        {
            if(command == 'queue' || command == 'q') this.queueMgr(servers, message.channel, args);
            else if(command == 'player' || command == 'p') this.engineMgr(servers, message.channel, args);
            else if(command == 'miscellaneous' || command == 'm') this.miscellaneous(servers, message, args);
            else if(command == 'playlist' || command == 'pl') this.playlist(servers, message, args);
            else if(command == 'download' || command == 'dl') this.download(servers, message, command, args);
            else this.audioMaster(servers, message.member, message.channel, command, args);
        }
    }

    static eventsListeners(servers, server)
    {
        server.audio.Engine.on('stateChange', (oldState, newState) => {
            if(newState.status == 'idle')
            {
                console.log(`######\t-> ${server.global.guild.name}\n\tAudio Engine in Idle`);
                server.audio.playing = false;
                if(server.audio.restart) // restart (for ghost update)
                {
                    server.audio.restart = false;
                    server.audio.currentPlayingSong++;
                    Tools.serverSave(server);
                    Tools.reboot();
                }
                else if(server.audio.arret) return; // stop
                else if(server.audio.loop) // loop
                {
                    this.runAudioEngine(servers, server, server.global.guild);
                }
                else if(server.audio.queueLoop) // queue loop
                {
                    if(!server.audio.queue[server.audio.currentPlayingSong+1]) server.audio.currentPlayingSong = 0;
                    else server.audio.currentPlayingSong++;
                    this.runAudioEngine(servers, server, server.global.guild);
                }
                else // normal execution. Play the next song or stop.
                {
                    server.audio.currentPlayingSong++;
                    if(server.audio.queue[server.audio.currentPlayingSong]) // next song -> true
                    {
                        this.runAudioEngine(servers, server, server.global.guild);
                    }
                    else // next song -> false
                    {
                        if(server.audio.lastQueue.messageId != null)
                        {
                            let channel = server.global.guild.channels.cache.get(server.audio.lastQueue.channelId);
                            channel.messages.fetch(server.audio.lastQueue.messageId).then(msg => msg.delete());
                            server.audio.lastQueue.messageId = null;
                            server.audio.lastQueue.channelId = null;
                        }
                        server.audio.queue = [];
                        server.audio.currentPlayingSong = 0;
                        console.log(`\tAudio Engine Standby`);
                    }
                }
            }
            else if(newState.status == 'pause') server.audio.pause = true;
            else if(oldState.status == 'pause') server.audio.pause = false;
            else if(newState.status == 'playing') server.audio.playing = true;
            else if(oldState.status == 'playing') server.audio.playing = false;
        });
    }

    static async audioMaster(servers, authorMember, channel, command, args)
    {
        let server = servers[channel.guild.id]
        /*
        
            complete commande exemple : t!a World is mine >>1
            this command is special. They are no "command". The command variable contain the first word of the music.
            This isn't arranged like this for the other commands.

        */

        let music = command, queuePos = undefined;
        
        if(!authorMember.voice.channel)
        {
            this.error(server, channel, 3, "Please connect yourselft in a voice channel first");
            return;
        }
        
        if(args[0]) // check parameters
        {
            while(args[0])
            {
                if(args[0].startsWith('>>'))
                {
                    queuePos = this.QueueSelectorConverter(servers[channel.guildId], args[0].substring(2));
                    
                    if(queuePos == null || queuePos == undefined)
                    {
                        this.error(server, channel, 0, 'Expected value : valid queueSelector (integer or key word that refer to an existing position in the queue)');
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
        let array = this.getPathOfFile(music, musicDirectory);

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
                let text = `**${video.title}**  :notes:\n*__${video.url}__*\n\n*Position : **${queuePos + 1}***\n*requested by __${authorMember.user.username}__*`;
    
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
                let text = `**${list.title}**  :notes:\n*__${list.url}__*\n\n*Number of songs : ${list.videos.length}\nPosition : **${queuePos + 1}***\n*requested by __${authorMember.user.username}__*`;
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
                Tools.serverSave(server);

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
                            Tools.serverSave(server);
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
                    if(i == array.length - 2    ) text += this.getNameFromPath(array[i],false);
                    else text += this.getNameFromPath(array[i],false)+'\n';
                }
                Tools.simpleEmbed(server, channel, text, undefined, false, true, 10000);

                array[0] = array.pop();
            }

            let tags = NodeID3.read(array[0]),
            title, artist, thumbnail;
            if(tags.title === undefined) title = this.getNameFromPath(array[0],false);
            else title = tags.title;
            if(tags.artist === undefined) artist = '<unknown>';
            else artist = tags.artist;
            let text = `**${title}**  :notes:\n*__${artist}__*\n\n*Position : **${queuePos + 1}***\n*requested by __${authorMember.user.username}__*`;
            
            if(tags.image != undefined)
            {
                thumbnail = tags.image.imageBuffer;
                Tools.simpleEmbed(server, channel, text, thumbnail, true, true, 30000);
            }
            else
            {
                thumbnail = undefined;
                Tools.simpleEmbed(server, channel, text, undefined, false, true, 30000);
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
                if(server.audio.currentPlayingSong == queuePos) // current
                {
                    server.audio.queue[server.audio.currentPlayingSong] = {
                        title,
                        url: `[LOCAL]${array[0]}`,
                        artist,
                    };
                }
                else
                {
                    if(server.audio.currentPlayingSong > queuePos) server.audio.currentPlayingSong++;
                    server.audio.queue.splice(queuePos, 0, {
                        title,
                        url: `[LOCAL]${array[0]}`,
                        artist,
                    });
                }
            }
        }

        if(server.audio.queue.length == 1 && server.audio.Engine._state.status != 'playing') // play for the first time
        {
            server.audio.currentPlayingSong = 0;
            this.runAudioEngine(servers, server, channel.guild);
        }
        else if(queuePos == server.audio.currentPlayingSong && server.audio.Engine._state.status == 'playing') // with the option "current"
        {
            server.audio.currentPlayingSong--;
            server.audio.Engine.stop();
        }
        else if(server.audio.Engine._state.status != 'playing') // when the queue is complete and not reset
        {
            this.runAudioEngine(servers, server, channel.guild);
        }
        else this.queueDisplay(servers, server, 16, true); // when the engine the playing something

        Tools.serverSave(server);
    }

    static async runAudioEngine(servers, server, guild)
    {
        server.global.voiceConnection.subscribe(server.audio.Engine);
        this.queueDisplay(servers, server, 16, true);
        
        let voiceChannel = guild.channels.cache.get(servers[guild.id].global.lastVoiceChannelId)
        Theresa.joinVoice(server, voiceChannel);
        
        if(server.audio.queue[server.audio.currentPlayingSong].url.startsWith('[LOCAL]')) // local file
        {
            server.audio.resource = Voice.createAudioResource(
                FS.createReadStream(
                    server.audio.queue[server.audio.currentPlayingSong].url.substring(7)
                ), {
                    inlineVolume: true
                }
            );
            server.audio.Engine.play(server.audio.resource);
        }
        else // youtube
        {
            server.audio.resource = Voice.createAudioResource(
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

        Tools.serverSave(servers[guild.id]);

        console.log(`######\t-> ${server.global.guild.name}`);
        console.log(`\t🎵 Audio Engine loaded\n\tSong : ${server.audio.queue[server.audio.currentPlayingSong].title}`);
    }

    static engineMgr(servers, channel, args)
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
                this.error(server, channel, 3, `Audio Engine isn't playing.`);
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
                this.error(server, channel, 3, `Audio Engine isn't playing.`);
            }
            else if(server.audio.Engine._state.status == 'paused')
            {
                this.error(server, channel, 3, `Audio Engine is in pause.`);
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
                    .then(m => m.delete());
                }
                this.error(server, channel, 3, `Audio Engine isn't playing.`);
            }
        }
        else if(args[0] == 'replay' || args[0] == 'r')
        {
            if(server.audio.Engine)
            {
                server.audio.currentPlayingSong--;
                server.audio.Engine.stop();
            }
            else
            {
                if(server.audio.queue[0])
                {
                    server.audio.currentPlayingSong--;
                    server.audio.Engine.stop();
                }
                else
                {
                    this.error(server, channel, 3, 'There is no queue');
                }
            }
        }
        
        else if(args[0] == 'skip' || args[0] == 's' || args[0] == '>')
        {
            console.log('\t\tNext');
            server.audio.Engine.stop();
        }
        else if(args[0] == 'previous' || args[0] == '<')
        {
            console.log('\t\tPrevious');
            if(server.audio.currentPlayingSong > 0)
            {
                server.audio.currentPlayingSong -= 2;
                server.audio.Engine.stop();
            }
        }
        else if(args[0] == 'go')
        {
            console.log('\tGo');
            if(args[1])
            {
                if(Number.isNaN(args[1])) this.error(server, channel, 0, 'Expected value : integer');
                else if(Number.parseInt(args[1]) > server.audio.queue.length-1 || Number.parseInt(args[1] <= 0)) this.error(server, channel, 3, 'Queue number doesn\'t exist');
                else
                {
                    server.audio.currentPlayingSong = Number.parseInt(args[1])-1;
                    if(server.audio.Engine) 
                    {
                        server.audio.currentPlayingSong--;
                        server.audio.Engine.stop();
                    }
                    else this.runAudioEngine(servers, server, channel.guild);
                }
            }
        }
        else if(args[0] == 'loop' || args[0] == 'l')
        {
            console.log('\tLoop');
            if(!server.audio.queue[0])
            { 
                this.error(server, channel, 3, 'There is no queue');
            }
            else
            {
                if(server.audio.loop)
                {
                    server.audio.loop = false;
                    Tools.simpleEmbed(server, channel, '**Loop Off ➡**', undefined, false, true, 1000);
                }
                else
                {
                    server.audio.loop = true;
                    Tools.simpleEmbed(server, channel, '**Loop On 🔂**', undefined, false, true, 1000);
                }

                this.queueDisplay(servers, server, 16, true);
            }
        }
        else if(args[0] == 'loopqueue' || args[0] == 'lq')
        {
            console.log('\tLoop queue');
            if(!server.audio.queue[0])
            { 
                this.error(server, channel, 3, 'There is no queue');
            }
            else
            {
                if(server.audio.queueLoop)
                {
                    server.audio.queueLoop = false;
                    Tools.simpleEmbed(server, channel, '**Loop queue Off ➡**', undefined, false, true, 1000);
                }
                else
                {
                    server.audio.queueLoop = true;
                    Tools.simpleEmbed(server, channel, '**Loop queue On 🔁**', undefined, false, true, 1000);
                }

                this.queueDisplay(servers, server, 16, true);
            }
        }
    }

    static async queueMgr(servers, channel, args)
    {
        let server = servers[channel.guild.id];
        console.log(`######\t-> ${server.global.guild.name}`);
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
            else this.queueDisplay(servers, server, 16, true);
        }
        else if(args[0] == 'clear' || args[0] == 'c')
        {
            console.log('\t\tClear');
            server.audio.queue.splice(0,server.audio.queue.length);
            server.audio.currentPlayingSong = null;
            server.audio.loop = false;
            server.audio.queueLoop = false;
            server.audio.restart = false;
            server.audio.arret = false;
            server.audio.leave = false;
            if(server.audio.Engine) server.audio.Engine.stop();
            let text = '**Done ✅**';
            Tools.simpleEmbed(server, channel, text, undefined, false, true, 1000);
            if(server.audio.lastQueue.channelId != null)
            {
                let lastQueueChannel = channel.guild.channels.cache.get(server.audio.lastQueue.channelId);
                lastQueueChannel.messages.fetch(server.audio.lastQueue.messageId)
                .then(m => {
                    m.delete();
                    server.audio.lastQueue.messageId = null;
                    server.audio.lastQueue.channelId = null;
                });
            }
        }
        else if(args[0] == 'delete' || args[0] == 'd' || args[0] == 'remove' || args[0] == 'r')
        {
            console.log('\tDelete');
            if(!args[1]) this.error(server, channel, 1, 'No argument(s) detected');
            else if(args.length == 2) // single
            {
                args[1] = this.QueueSelectorConverter(server, args[1]);
                if(args[1] == null)
                {
                    this.error(server, channel, 0, "The argument must be a valid queue selector or an number between 0 and the size of the queue.");
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
                args[1] = this.QueueSelectorConverter(server, args[1]);
                args[2] = this.QueueSelectorConverter(server, args[2]);
                
                if(args[2] <= args[1])
                {
                    this.error(server, channel, 0, '2nd argument must be superior to the 1st argument');
                    return;
                }
                else
                {
                    server.audio.queue.splice(args[1], args[2] - args[1]);
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
                    args[i] = this.QueueSelectorConverter(server, args[i]);
                    if(args[i] == null)
                    {
                        this.error(server, channel, 0, `\"${args[i]}\" This argument must be a valid queue selector or an number between 0 and the size of the queue.`);
                        continue;
                    }
                    server.audio.queue.splice(args[1],1);
                    if(args[i] <= server.audio.currentPlayingSong) server.audio.currentPlayingSong--;
                    if(args[i] == server.audio.currentPlayingSong && server.audio.Engine._state.status == 'playing') needStop = true;
                }
                if(needStop) server.audio.Engine.stop();
            }

            let text = `**Done ✅**`;
            Tools.simpleEmbed(server, channel, text, undefined, false, true, 1000);
            this.queueDisplay(servers, server, 16, true);
        }
        else if(args[0] == 'move' || args[0] == 'm') this.error(server, channel, 3, 'Work in progress');
        else if(args[0] == 'swap' || args[0] == 'sw')
        {
            console.log('\tSwap');
            if(args.length == 1)
            {
                this.error(server, channel, 1, 'Please precise the 1st arguments');
                return;
            }
            else if(args.length == 2)
            {
                this.error(server, channel, 1, 'Please precise the 2nd arguments');
                return;
            }

            args[1] = this.QueueSelectorConverter(server, args[1]);
            args[2] = this.QueueSelectorConverter(server, args[2]);

            if(args[1] == null || args[2] == null) this.error(server, channel, 0, 'The argument must be a valid queue selector or an number between 0 and the size of the queue.')
            else if(args[1] == args[2]) this.error(server, channel, 0, 'The arguments can\'t have the same value');
            
            let temp = server.audio.queue[args[1]];
            server.audio.queue[args[1]] = server.audio.queue[args[2]];
            server.audio.queue[args[2]] = temp;

            if(args[1] == server.audio.currentPlayingSong || args[2] == server.audio.currentPlayingSong) 
            {
                server.audio.Engine.stop();
            }
            else this.queueDisplay(servers, server, 16, true);
        }
        else if(args[0] == 'shuffle' || args[0] == 'sh')
        {
            let shuffledMusic = server.audio.queue;
            server.audio.queue = [];
            let indiceAlea;;
            for(let i = shuffledMusic.length; i > 0; i--)
            {
                indiceAlea = Tools.getRandomInt(shuffledMusic.length - 1);
                server.audio.queue.push(shuffledMusic[indiceAlea]);
                shuffledMusic.splice(indiceAlea, 1);
            }

            if(server.audio.Engine._state.status == 'playing')
            {
                server.audio.currentPlayingSong -= 1;
                server.audio.Engine.stop();
            }
            else this.runAudioEngine(servers, server, guild);
        }
        else if(args[0] == 'current' || args[0] == 'ct') this.error(server, channel, 3, 'Work in progress');

        Tools.serverSave(server);
    }

    static async miscellaneous(servers, message, args)
    {
        /*
            Command exemple :
            t!a miscellaneous localshuffle | t!a m ls
            t!a m find ka
        */
        
        let server = servers[message.guild.id];
        if(!args[0]) this.error(server, message.channel, 1, 'Please precise your intention(s).');
        else if(args[0] == 'find' || args[0] == 'f')
        {
            let array = this.getPathOfFile(args[1],musicDirectory);
            if(array == undefined) Tools.simpleEmbed(server, message.channel, 'No file was found ❌', undefined, false, true, 3000);
            else
            {
                let text = '';
                for(let object of array) text += this.getNameFromPath(object,false)+'\n';
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
                    Tools.serverSave(server);
                    
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
                                Tools.serverSave(server);
                                break;
                            }
                        }
                    }, 10000);
                });
            }
        }
        else if(args[0] == 'localshuffle' || args[0] == 'ls')
        {
            if(!server.audio.queue[0]) server.audio.currentPlayingSong = 0;
            
            let shuffledMusic = [];
            for(let path of musicDirectory)
            {
                FS.readdirSync(path).forEach(music => {
                    let extension = music.split('.').pop();
                    if(extension == 'mp3' || extension == 'wav' || extension == 'flac')
                    {
                        let tags = NodeID3.read(path + music);
                        if(tags.title != undefined)
                        {
                            music = {
                                title: tags.title,
                                url: '[LOCAL]' + path + music,
                                artist: tags.artist,
                            };
                        }
                        else
                        {
                            music = {
                                title: music.substring(0, music.length-4),
                                url: '[LOCAL]' + path + music,
                                artist: tags.artist,
                            };
                        }
                        shuffledMusic.push(music);
                    }
                });
            }

            // shuffling
            let indiceAlea;
            for(let i = shuffledMusic.length; i > 0; i--)
            {
                indiceAlea = Tools.getRandomInt(shuffledMusic.length - 1);
                server.audio.queue.push(shuffledMusic[indiceAlea]);
                shuffledMusic.splice(indiceAlea, 1);
            }

            if(server.audio.Engine._state.status != 'playing') // playing or adding to the queue
            {
                this.runAudioEngine(servers, server, message.guild);
            }
            else this.queueDisplay(servers, server, 16, true);
        }
        else if(args[0] == 'folder' || args[0] == 'fd')
        {
            if(!args[1])
            {
                this.error(server, message.channel, 1, 'Folder path is missing');
                return;
            }
            else
            {
                args.shift();
                let filePath = args.join(' ');
                if(FS.existsSync(filePath))
                {
                    FS.readdirSync(filePath).forEach(file => {
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

                    if(server.audio.Engine._state.status != 'playing') this.runAudioEngine(servers, server, server.global.guild);
                    else this.queueDisplay(servers, server, 16, true);
                }
            }
        }
    }
    
    static async queueDisplay(servers, server, nbrOfMusicDisplayed, isKeep)
    {
        let text;

        // --------------------------------------------------------------------------------
        // Indique the loop status in top of the queue

        text = '*Playing options :* ';

        if(!server.audio.loop && !server.audio.queueLoop && !server.audio.restart)
        {
            text += '**None**';
        }
        else
        {
            if(server.audio.loop) text += '🔂';
            if(server.audio.queueLoop) text += '🔁';
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
        
        text += `*Numbers of song in the queue : **${server.audio.queue.length - 1}***`;
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

        let firstRow = new Discord.ActionRowBuilder()
            .addComponents(
                servers[0].button.audio.previousBtn,
                servers[0].button.audio.stopBtn,
                servers[0].button.audio.pausePlayBtn,
                servers[0].button.audio.nextBtn
            );
        let secondRow = new Discord.ActionRowBuilder()
            .addComponents(
                servers[0].button.audio.viewMore,
                servers[0].button.audio.loop,
                servers[0].button.audio.loopQueue,
                servers[0].button.audio.replay
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
            let tags = NodeID3.read(server.audio.queue[server.audio.currentPlayingSong].url.substring(7));

            if(tags.image != undefined) messageOption.files[0] = tags.image.imageBuffer;
            else messageOption.files[0] = FS.readFileSync('./audio/noThumbnail.png');
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
                        .then(queueMessage => queueMessage.delete());
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
                            Tools.serverSave(server);
                        });
                    }
                    else
                    {
                        chn.send(messageOption)
                        .then(msg => {
                            server.audio.lastQueue.messageId = msg.id;
                            server.audio.lastQueue.channelId = msg.channel.id;
                            Tools.serverSave(server);
                            setTimeout(function(){Audio.queueDisplay(servers, server, 16, true)}, 120000);
                        });
                        Tools.serverSave(server);
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
                    Tools.serverSave(server);
                });
            }
            else
            {
                chn.send(messageOption)
                .then(msg => {
                    server.audio.lastQueue.messageId = msg.id;
                    server.audio.lastQueue.channelId = msg.channel.id;
                    Tools.serverSave(server);
                    setTimeout(() => {Audio.queueDisplay(servers, server, 16, true)}, 120000);
                });
                Tools.serverSave(server);
            }
        }
    }
    
    static playlist(servers, message, args)
    {
        let server = servers[message.guild.id];
        if(!args[0]) this.error(server, message.channel, 1, 'Possible action : *please fill this line of text Ruiseki sama~*')
        
        let user = server.users.find(element => element.userId == message.author.id);
        if(args[0] == 'create')
        {

        }
    }

    static QueueSelectorConverter(server, arg)
    {
        if(arg == "c" || arg == "current") return server.audio.currentPlayingSong;
        else if(arg == "a" || arg == "after" || arg == 'aft' || arg == "next" || arg == "n")
        {
            if(server.audio.currentPlayingSong == server.audio.queue.length - 1) return null;
            else return server.audio.currentPlayingSong + 1;
        }
        else if(arg == "p" || arg == "previous" || arg == "befor" || arg == "b")
        {
            if(server.audio.currentPlayingSong == 0) return null;
            return server.audio.currentPlayingSong - 1;
        }
        else if(arg == "f" || arg == "final" || arg == "end" || arg == "e")
        {
            return server.audio.queue.length - 1;
        }
        else
        {
            if(isNaN(Number.parseInt(arg))) return null;
            arg = Number.parseInt(arg) - 1;
            if(Number.parseInt(arg) >= 0 && Number.parseInt(arg) < server.audio.queue.length) return arg - 1;
            else return null;
        }
    }

    static getNameFromPath(path,needExtension)
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

    static getPathOfFile(targetName,directory)
    {
        /*
            Will give the path of "targetName" in "directory".
            Return an array of all file that commence by this name.
            Return undefined if doesn't exist.
        */
        let array=[];
        for(let path of directory)
        {
            let files = FS.readdirSync(path);
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


    static clearMessagesTemps(server, guild)
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
                        console.log(err);
                        console.log(' -> in "clearChannel"');
                    }
                });
            });
        server.global.messageTemp = [];
    }

    static error(server, channel, type, text)
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
            Tools.serverSave(server);
            setTimeout(function(){
                if(server.audio.lastQueue.messageId != null) msg.delete();
            }, 5000);
        });
        server.audio.lastQueue.channelId=undefined;
        server.audio.lastQueue.messageId=undefined;
        Tools.serverSave(server);
    }
}