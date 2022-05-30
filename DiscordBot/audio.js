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

// button
var previousBtn = new Discord.MessageButton()
                    .setCustomId('previousBtn')
                    .setLabel('⏮')
                    .setStyle('SECONDARY'),
    nextBtn = new Discord.MessageButton()
                    .setCustomId('nextBtn')
                    .setLabel('⏭')
                    .setStyle('SECONDARY'),
    pausePlayBtn = new Discord.MessageButton()
                    .setCustomId('pausePlayBtn')
                    .setLabel('⏯')
                    .setStyle('SECONDARY'),
    stopBtn = new Discord.MessageButton()
                    .setCustomId('stopBtn')
                    .setLabel('⏹')
                    .setStyle('SECONDARY'),
    viewMore = new Discord.MessageButton()
                    .setCustomId('viewMore')
                    .setLabel('🔎')
                    .setStyle('SECONDARY'),
    loop = new Discord.MessageButton()
                    .setCustomId('loop')
                    .setLabel('🔂')
                    .setStyle('SECONDARY'),
    loopQueue = new Discord.MessageButton()
                    .setCustomId('loopQueue')
                    .setLabel('🔁')
                    .setStyle('SECONDARY'),
    replay = new Discord.MessageButton()
                    .setCustomId('replay')
                    .setLabel('⏪')
                    .setStyle('SECONDARY');

module.exports = class Audio
{
    static globalInit(servers, client)
    {
        client.on('interactionCreate', i => {
            if(!i.isButton()) return;
            
            if(i.customId == 'nextBtn') Audio.queueMgr(servers, i.message, 'queue', ['skip']);
            else if(i.customId == 'previousBtn') Audio.queueMgr(servers, i.message, 'queue', ['previous']);
            else if(i.customId == 'stopBtn') Audio.queueMgr(servers, i.message, 'queue', ['clear']);
            else if(i.customId == 'pausePlayBtn')
            {
                if(!servers[i.guild.id].audio.pause) Audio.engineMgr(servers, i.message, 'player', ['pause']);
                else Audio.engineMgr(servers, i.message, 'p', ['play']);
                Audio.queueDisplay(servers[i.guildId], 16, true);
            }
            else if(i.customId == 'viewMore') Audio.queueDisplay(servers[i.guildId], 40, false);
            else if(i.customId == 'loop') Audio.queueMgr(servers, i.message, 'queue', ['loop']);
            else if(i.customId == 'loopQueue') Audio.queueMgr(servers, i.message, 'queue', ['loopqueue']);
            else if(i.customId == 'replay') Audio.engineMgr(servers, i.message, 'player', ['replay']);

            i.deferUpdate();
        });
    }

    static cmd(servers,prefix,command,args,message)
    {
        message.delete();
        servers[message.guild.id].audio.lastMusicTextchannelId = message.channel.id;
        
        if(command == undefined) ;
        else
        {
            if(command == 'queue' || command == 'q') this.queueMgr(servers,message,command,args);
            else if(command == 'player' || command == 'p') this.engineMgr(servers,message,command,args);
            else if(command == 'miscellaneous' || command == 'm') this.miscellaneous(servers,message,command,args);
            else if(command == 'download' || command == 'dl') this.download(servers,message,command,args);
            else this.audioMaster(servers,message,command,args);
        }
    }

    static async audioMaster(servers,message,command,args)
    {
        let server = servers[message.guild.id]
        /*
        
        complete commande exemple : t!a World is mine >>1
        this command is special. They are no "command". The command variable contain the first word of the music.
        This isn't arranged like this for the other commands.
        
        POV :

        queuePos : user view
        currentPlayingSong : array view
        (user view = 1 is the first. array view = 0 is the first)

        */

        let music = command,
        queuePos = undefined;
        
        if(!message.member.voice.channel)
        {
            this.error(server,message,3,"Please connect yourselft in a voice channel first");
            return;
        }

        if(args[0]) // check parameters
        {
            while(args[0])
            {
                if(args[0].startsWith('>>'))
                {
                    if(args[0].substring(2) == 'current' || args[0].substring(2) == 'c')
                    {
                        if(server.audio.Engine == null)
                        {
                            this.error(server,message,3,'There is no current song');
                            return;
                        }
                        if(server.audio.currentPlayingSong) queuePos = server.audio.currentPlayingSong + 1;
                        else queuePos = 1;
                    }
                    else if(args[0].substring(2) == 'after' || args[0].substring(2) == 'aft')
                    {
                        if(server.audio.currentPlayingSong != null) queuePos = server.audio.currentPlayingSong+2;
                    }
                    else if(Number.isNaN(args[0].substring(2)))
                    {
                        this.error(server,message,0,'Expected value : integer');
                        return;
                    }
                    else queuePos = args[0].substring(2);
                    break;
                }
                else
                {
                    music += ' '+args.shift();
                }
            }
        }
        if(server.audio.queue.length == 0) queuePos = 1;
        else if(queuePos == undefined) queuePos = server.audio.queue.length+1;

        // Adding music
        let array = this.getPathOfFile(music,musicDirectory);

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
                let text = `**${video.title}**  :notes:\n*__${video.url}__*\n\n*Position : **${queuePos}***\n*requested by __${message.author.username}__ → ${message.content}*`;
                console.log(video.title);
    
                embed = {
                    color: '#000000',
                    description: text,
                    thumbnail: {
                        url: video.thumbnail
                    }
                };
            }
            else
            {
                let text = `**${list.title}**  :notes:\n*__${list.url}__*\n\n*Number of songs : ${list.videos.length}\nPosition : **${queuePos}***\n*requested by __${message.author.username}__ → ${message.content}*`;
                console.log(`[LIST] ${list.title}`);
                embed = {
                    color: '#000000',
                    description: text,
                    thumbnail: {
                        url: list.thumbnail
                    }
                };
            }

            message.channel.send({embeds :[embed]}).then(msg => {
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
                if(server.audio.currentPlayingSong == queuePos - 1)
                {
                    server.audio.queue[queuePos - 1] = {
                        title: video.title,
                        videoId: video.videoId,
                        url: video.url,
                        thumbnail: video.thumbnail
                    };
                }
                else
                {
                    server.audio.queue.splice(queuePos - 1, 0, {
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
                if(server.audio.currentPlayingSong == queuePos - 1) server.audio.queue.splice(queuePos - 1, 1, ...videos);
                else server.audio.queue.splice(queuePos - 1, 0, ...videos);
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
                Tools.simpleEmbed(server,message,text,undefined,false,true,10000);

                array[0] = array.pop();
            }

            let tags = NodeID3.read(array[0]),
            title, artist, thumbnail;
            if(tags.title === undefined) title = this.getNameFromPath(array[0],false);
            else title = tags.title;
            if(tags.artist === undefined) artist = '<unknown>';
            else artist = tags.artist;
            let text = `**${title}**  :notes:\n*__${artist}__*\n\n*Position : **${queuePos}***\n*requested by __${message.author.username}__ → ${message.content}*`;
            
            if(tags.image != undefined)
            {
                thumbnail = tags.image.imageBuffer;
                Tools.simpleEmbed(server,message,text,thumbnail,true,true,30000);
            }
            else
            {
                thumbnail = undefined;
                Tools.simpleEmbed(server,message,text,undefined,false,true,30000);
            }
            
            if(queuePos == server.audio.queue.length+1)
            {
                server.audio.queue.push({
                    title,
                    url: `[LOCAL]${array[0]}`,
                    artist,
                });
            }
            else
            {
                if(server.audio.currentPlayingSong == queuePos - 1) // current
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
                    server.audio.queue.splice(queuePos - 1, 0, {
                        title,
                        url: `[LOCAL]${array[0]}`,
                        artist,
                        thumbnail
                    });
                }
            }
        }

        if(server.audio.queue.length == 1 && !server.audio.isPlaying) // play for the first time
        {
            server.audio.currentPlayingSong = 0;
            this.runAudioEngine(servers, server, message.guild);
        }
        else if(queuePos - 1 == server.audio.currentPlayingSong && server.audio.isPlaying) // with the option "current"
        {
            server.audio.currentPlayingSong--;
            server.audio.Engine.stop();
        }
        else if(!server.audio.isPlaying && !server.audio.pause) // when the queue is complete and not reset
        {
            this.runAudioEngine(servers, server, message.guild);
        }
        else this.queueDisplay(server, 16, true); // when the engine the playing something

        Tools.serverSave(server);
    }

    static async runAudioEngine(servers, server, guild)
    {
        server.audio.Engine = Voice.createAudioPlayer();
        server.global.voiceConnection.subscribe(server.audio.Engine);
        
        this.queueDisplay(server, 16, true);
        server.audio.isPlaying = true;
        
        let voiceChannel = guild.channels.cache.get(servers[guild.id].global.lastVoiceChannelId)
        Theresa.joinVoice(server, voiceChannel);
        
        if(server.audio.queue[server.audio.currentPlayingSong].url.startsWith('[LOCAL]')) // local file
        {
            server.audio.Engine.play(Voice.createAudioResource(FS.createReadStream(server.audio.queue[server.audio.currentPlayingSong].url.substring(7))));
        }
        else // youtube
        {
            server.audio.Engine.play(Voice.createAudioResource(ytdl(server.audio.queue[server.audio.currentPlayingSong].url,{filter:'audioonly',quality:'highest',highWaterMark:1 << 25})));
        }

        Tools.serverSave(servers[guild.id]);

        console.log(`######\t-> ${server.global.guild.name}`);
        console.log(`\t🎵 Audio Engine loaded\n\tSong : ${server.audio.queue[server.audio.currentPlayingSong].title}`);

        server.audio.Engine.on('error', error => {
            console.log(error.message);
        });

        server.audio.Engine.on('idle', oldEngineStatut =>
        {
            console.log(`######\t-> ${server.global.guild.name}\n\tAudio Engine in Idle`);
            server.audio.isPlaying = false;
            if(server.audio.restart) // restart (for ghost update)
            {
                server.audio.restart = false;
                server.audio.isPlaying = true;
                server.audio.currentPlayingSong++;
                Tools.serverSave(server);
                Tools.reboot();
            }
            else if(server.audio.arret) return; // stop
            else if(server.audio.loop) // loop
            {
                this.runAudioEngine(servers, server, guild);
            }
            else if(server.audio.queueLoop) // queue loop
            {
                if(!server.audio.queue[server.audio.currentPlayingSong+1]) server.audio.currentPlayingSong = 0;
                else server.audio.currentPlayingSong++;
                this.runAudioEngine(servers, server, guild);
            }
            else // normal execution. Play the next song or stop.
            {
                server.audio.currentPlayingSong++;
                if(server.audio.queue[server.audio.currentPlayingSong]) // next song -> true
                {
                    this.runAudioEngine(servers, server, guild);
                }
                else // next song -> false
                {
                    if(server.audio.lastQueue.messageId != null)
                    {
                        let channel = guild.channels.cache.get(server.audio.lastQueue.channelId);
                        channel.messages.fetch(server.audio.lastQueue.messageId).then(msg => msg.delete());
                        server.audio.lastQueue.messageId = null;
                        server.audio.lastQueue.channelId = null;
                    }
                    server.audio.queue = [];
                    server.audio.currentPlayingSong = 0;
                    console.log(`\tAudio Engine Standby`);
                }
            }

            Tools.serverSave(server);
        });
    }

    static engineMgr(servers,message,command,args)
    {
        let server = servers[message.guild.id]

        if(server.audio.Engine == null) return;
        else if(!args[0]) ;
        else if(args[0] == 'stop' || args[0] == 's')
        {
            if(server.audio.isPlaying)
            {
                server.audio.arret = true;
                server.audio.Engine.stop();
            }
            else
            {
                this.error(server,message,3,`Audio Engine isn't playing.`);
            }
        }
        else if(args[0] == 'pause' || args[0] == 'p')
        {
            if(!server.audio.pause && server.audio.isPlaying)
            {
                server.audio.Engine.pause();
                server.audio.pause = true;
            }
            else if(!server.audio.isPlaying)
            {
                this.error(server,message,3,`Audio Engine isn't playing.`);
            }
            else if(server.audio.pause)
            {
                this.error(server,message,3,`Audio Engine is in pause.`);
            }
        }
        else if(args[0] == 'play' || args[0] == 'pl')
        {
            if(server.audio.pause && server.audio.isPlaying)
            {
                server.audio.Engine.unpause();
                server.audio.pause = false;
            }
            else
            {
                if(server.audio.lastQueue.channelId != null)
                {
                    let channel = message.guild.channels.cache.get(server.audio.lastQueue.channelId);
                    channel.messages.fetch(server.audio.lastQueue.messageId)
                    .then(m => m.delete());
                }
                this.error(server,message,3,`Audio Engine isn't playing.`);
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
                    this.error(server,message,3,'There is no queue');
                }
            }
        }
    }

    static async queueMgr(servers,message,command,args)
    {
        let server = servers[message.guild.id];
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
            else this.queueDisplay(server, 16, true);
        }
        else if(args[0] == 'clear' || args[0] == 'c')
        {
            console.log('\t\tClear');
            server.audio.queue.splice(0,server.audio.queue.length);
            server.audio.currentPlayingSong = null;
            server.audio.loop = false;
            server.audio.queueLoop = false;
            server.audio.isPlaying = false;
            server.audio.pause = false;
            server.audio.restart = false;
            server.audio.arret = false;
            server.audio.leave = false;
            if(server.audio.Engine) server.audio.Engine.stop();
            let text = '**Done ✅**';
            Tools.simpleEmbed(server,message,text,undefined,false,true,1000);
            if(server.audio.lastQueue.channelId != null)
            {
                let channel = message.guild.channels.cache.get(server.audio.lastQueue.channelId);
                channel.messages.fetch(server.audio.lastQueue.messageId)
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
            if(!args[1]) this.error(server,message,1,'No argument(s) detected');
            else if(args.length == 2)
            {
                args[1] = this.QueueSelectorConverter(server, args[1]);
                if(args[1] == null)
                {
                    this.error(server,message, 0, "The argument must be a queue selector or an number between 0 and the size of the queue.");
                    return;
                }

                server.audio.queue.splice(args[1],1);
                if(args[1] <= server.audio.currentPlayingSong)
                {
                    server.audio.currentPlayingSong--;
                    this.queueDisplay(server,16, true);
                }
                if(args[1] == server.audio.currentPlayingSong) server.audio.Engine.stop();
            }
            else if(args.length == 3)
            {
                args[1] = this.QueueSelectorConverter(server, args[1]);
                args[2] = this.QueueSelectorConverter(server, args[2]);
                
                if(args[2] <= args[1])
                {
                    this.error(server,message,0,'2nd argument must be superior to the 1st argument');
                    return;
                }
                else
                {
                    server.audio.queue.splice(args[1], args[2] - args[1] + 1);
                    if(server.audio.currentPlayingSong >= args[1] && server.audio.currentPlayingSong <= args[2])
                    {
                        server.audio.currentPlayingSong = args[1]-1;
                        server.audio.Engine.stop();
                    }
                    else if(server.audio.currentPlayingSong > args[2])
                    {
                        server.audio.currentPlayingSong -= args[2] - args[1] + 1;
                        this.queueDisplay(server,16, true);
                    }
                }
            }
            else
            {
                let needStop = false
                for(let i = 1; i < args.length; i++)
                {
                    args[i] = this.QueueSelectorConverter(server, args[i]);
                    if(args[i] == null)
                    {
                        this.error(server,message, 0, `\"${args[i]}\" This argument must be a queue selector or an number between 0 and the size of the queue.`);
                        continue;
                    }
                    server.audio.queue.splice(args[1],1);
                    if(args[i] <= server.audio.currentPlayingSong) server.audio.currentPlayingSong--;
                    if(args[i] == server.audio.currentPlayingSong && server.audio.isPlaying) needStop = true;
                }
                if(needStop) server.audio.Engine.stop();
                queueDisplay(server,16, true);
            }

            let text = `**Done ✅**`;
            Tools.simpleEmbed(server,message,text,undefined,false,true,1000);
            this.queueDisplay(server,16, true);
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
                if(Number.isNaN(args[1])) this.error(server,message,0,'Expected value : integer');
                else if(Number.parseInt(args[1]) > server.audio.queue.length-1 || Number.parseInt(args[1] <= 0)) this.error(server,message,3,'Queue number doesn\'t exist');
                else
                {
                    server.audio.currentPlayingSong = Number.parseInt(args[1])-1;
                    if(server.audio.Engine) 
                    {
                        server.audio.currentPlayingSong--;
                        server.audio.Engine.stop();
                    }
                    else this.runAudioEngine(servers, server, message.guild);
                }
            }
        }
        else if(args[0] == 'loop' || args[0] == 'l')
        {
            console.log('\tLoop');
            if(!server.audio.queue[0])
            { 
                this.error(server,message,3,'There is no queue');
            }
            else
            {
                if(server.audio.loop)
                {
                    server.audio.loop = false;
                    Tools.simpleEmbed(server,message,'**Loop Off ➡**',undefined,false,true,1000);
                }
                else
                {
                    server.audio.loop = true;
                    Tools.simpleEmbed(server,message,'**Loop On 🔂**',undefined,false,true,1000);
                }

                this.queueDisplay(server,16, true);
            }
        }
        else if(args[0] == 'loopqueue' || args[0] == 'lq')
        {
            console.log('\tLoop queue');
            if(!server.audio.queue[0])
            { 
                this.error(server,message,3,'There is no queue');
            }
            else
            {
                if(server.audio.queueLoop)
                {
                    server.audio.queueLoop = false;
                    Tools.simpleEmbed(server,message,'**Loop queue Off ➡**',undefined,false,true,1000);
                }
                else
                {
                    server.audio.queueLoop = true;
                    Tools.simpleEmbed(server,message,'**Loop queue On 🔁**',undefined,false,true,1000);
                }

                this.queueDisplay(server, 16, true);
            }
        }
        else if(args[0] == 'move' || args[0] == 'm') this.error(server,message,3,'Work in progress');
        else if(args[0] == 'swap' || args[0] == 'sw')
        {
            console.log('\tSwap');
            if(args.length == 1)
            {
                this.error(server,message,1,'Please precise the 1st arguments');
                return;
            }
            else if(args.length == 2)
            {
                this.error(server,message,1,'Please precise the 2nd arguments');
                return;
            }

            args[1] = this.QueueSelectorConverter(server, args[1]);
            args[2] = this.QueueSelectorConverter(server, args[2]);

            if(args[1] == null || args[2] == null) this.error(server,message, 0, 'The argument must be a queue selector or an number between 0 and the size of the queue.')
            else if(args[1] == args[2]) this.error(server,message, 0, 'The arguments can\'t have the same value');
            
            let temp = server.audio.queue[args[1]];
            server.audio.queue[args[1]] = server.audio.queue[args[2]];
            server.audio.queue[args[2]] = temp;

            if(args[1] == server.audio.currentPlayingSong || args[2] == server.audio.currentPlayingSong) 
            {
                server.audio.Engine.stop();
            }
            else this.queueDisplay(server, 16, true);
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

            if(server.audio.isPlaying)
            {
                server.audio.currentPlayingSong -= 1;
                server.audio.Engine.stop();
            }
            else this.runAudioEngine(servers, server, guild);
        }
        else if(args[0] == 'current' || args[0] == 'ct') this.error(server,message,3,'Work in progress');

        Tools.serverSave(server);
    }

    static miscellaneous(servers,message,command,args)
    {
        /*
            Command exemple :
            t!a miscellaneous localshuffle | t!a m ls
            t!a m find ka
        */
        
        let server = servers[message.guild.id];
        if(!args[0]) this.error(server,message,1,'Please precise your intention(s).');
        else if(args[0] == 'find' || args[0] == 'f')
        {
            let array = this.getPathOfFile(args[1],musicDirectory);
            if(array == undefined) Tools.simpleEmbed(server,message,'No file was found ❌',undefined,false,true,3000);
            else
            {
                let text = '';
                for(let object of array) text += this.getNameFromPath(object,false)+'\n';
                let embed = new Discord.MessageEmbed()
                .setColor('#000000')
                .setTitle('Found file(s) :')
                .setDescription(text);
                message.channel.send({embeds :[embed]}).then(msg => {
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
            /* console.log('######\tRandomizer algorithm start');
            let t0 = Date.now(); // timer */

            let shuffledMusic = [];
            if(!server.audio.queue[0]) server.audio.currentPlayingSong = 0;
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

            let indiceAlea; // shuffle
            for(let i = shuffledMusic.length; i > 0; i--)
            {
                indiceAlea = Tools.getRandomInt(shuffledMusic.length - 1);
                server.audio.queue.push(shuffledMusic[indiceAlea]);
                shuffledMusic.splice(indiceAlea, 1);
            }

            if(!server.audio.isPlaying && !server.audio.pause) // playing or adding to the queue
            {
                this.runAudioEngine(servers, server, message.guild);
            }
            else this.queueDisplay(server, 16, true);

            /* let totalTime = Date.now() - t0; // timer end
            console.log(`######\tAlgorithm complete.\n\t${totalTime} ms`); */
        }
        else if(args[0] == 'folder' || args[0] == 'fd')
        {
            if(!args[1])
            {
                this.error(server, message, 1, 'Folder path is missing');
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

                    if(!server.audio.isPlaying) this.runAudioEngine(servers, server, server.global.guild);
                    else this.queueDisplay(server, 16, true);
                }
            }
        }
    }
    
    static async queueDisplay(server, nbrOfMusicDisplayed, isKeep)
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
        if(server.audio.pause) text += '**Paused** ⏸';
        else text += '**Playing** ▶';
        text += '\n\n';

        // --------------------------------------------------------------------------------
        // calculating the index of the first music to be displayed

        let startAt, afterCurrent = Number.parseInt(nbrOfMusicDisplayed / 4);
        if(server.audio.queue.length <= nbrOfMusicDisplayed) startAt = 0;
        else
        {
            if(server.audio.currentPlayingSong < afterCurrent) startAt = 0;
            else if(server.audio.queue.length - (server.audio.currentPlayingSong - afterCurrent) < nbrOfMusicDisplayed) startAt = server.audio.queue.length - 1 - nbrOfMusicDisplayed;
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
                    text += `${i+1}: ${server.audio.queue[i].title}\n`;
                }
                else
                {
                    // YouTube
                    text += `${i+1}: ${server.audio.queue[i].title}\n`;
                }
            }

            if(i-startAt == nbrOfMusicDisplayed-1) break;
        }
        
        // --------------------------------------------------------------------------------
        // Embed generator

        if(server.audio.queue[server.audio.currentPlayingSong] && server.audio.queue[server.audio.currentPlayingSong].url.startsWith('[LOCAL]'))
        {
            let tags = NodeID3.read(server.audio.queue[server.audio.currentPlayingSong].url.substring(7));
            var messageOption;

            if(tags.image != undefined)
            {
                let embed = new Discord.MessageEmbed()
                .setColor('#000000')
                .setTitle('Music Queue  :notes:')
                .setDescription(text)
                .setThumbnail('attachment://file.jpg');

                let firstRow = new Discord.MessageActionRow()
                .addComponents(
                    previousBtn,
                    stopBtn,
                    pausePlayBtn,
                    nextBtn
                );
                let secondRow = new Discord.MessageActionRow()
                .addComponents(
                    viewMore,
                    loop,
                    loopQueue,
                    replay
                );

                messageOption = {
                    embeds: [embed],
                    files: [tags.image.imageBuffer],
                    components: [firstRow, secondRow]
                };
            }
            else
            {
                let embed = new Discord.MessageEmbed()
                .setColor('#000000')
                .setTitle('Music Queue  :notes:')
                .setDescription(text);

                let firstRow = new Discord.MessageActionRow()
                .addComponents(
                    previousBtn,
                    stopBtn,
                    pausePlayBtn,
                    nextBtn
                );
                let secondRow = new Discord.MessageActionRow()
                .addComponents(
                    viewMore,
                    loop,
                    loopQueue,
                    replay
                );

                messageOption = {
                    embeds: [embed],
                    components: [firstRow, secondRow]
                };
            }
        }
        else
        {
            let embed = new Discord.MessageEmbed()
            .setColor('#000000')
            .setTitle('Music Queue  :notes:')
            .setDescription(text)
            .setThumbnail(server.audio.queue[server.audio.currentPlayingSong].thumbnail);
            // .setThumbnail(`https://img.youtube.com/vi/${server.audio.queue[server.audio.currentPlayingSong].videoId}/sddefault.jpg`);

            let firstRow = new Discord.MessageActionRow()
                .addComponents(
                    previousBtn,
                    stopBtn,
                    pausePlayBtn,
                    nextBtn
                );
                let secondRow = new Discord.MessageActionRow()
                .addComponents(
                    viewMore,
                    loop,
                    loopQueue,
                    replay
                );

                messageOption = {
                    embeds: [embed],
                    components: [firstRow, secondRow]
                };
        }

        // --------------------------------------------------------------------------------
        // checking if the last message is the queue message

        let channelOfTheLastQueue = server.global.guild.channels.cache.get(server.audio.lastQueue.channelId), willEditQueueMessage = false;
        if(channelOfTheLastQueue)
        {
            channelOfTheLastQueue.messages.fetch({limit:1})
            .then(messages => {
                messages.forEach(msg => {
                    if(msg.id == server.audio.lastQueue.messageId) willEditQueueMessage = true;
                });
            }).then(() => {
                if(willEditQueueMessage)
                {
                    // --------------------------------------------------------------------------------
                    // editing the old queue
        
                    let lastQueueMessage = channelOfTheLastQueue.messages.cache.get(server.audio.lastQueue.messageId);
                    lastQueueMessage.edit(messageOption);
                    console.log('\t\tQueue editing test completed !');
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
                            setTimeout(function(){Audio.queueDisplay(server, 16, true)}, 120000);
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
                    setTimeout(function(){Audio.queueDisplay(server, 16, true)}, 120000);
                });
                Tools.serverSave(server);
            }
        }
    }
    
    static QueueSelectorConverter(server, arg)
    {
        if(arg == "c" || arg == "current") return server.audio.currentPlayingSong;
        else if(arg == "a" || arg == "after") return server.audio.currentPlayingSong + 1;
        else if(arg == "p" || arg == "previous") return server.audio.currentPlayingSong - 1;
        else if(arg == "f" || arg == "final") return server.audio.queue.length - 1;
        else
        {
            if(isNaN(Number.parseInt(arg))) return null;
            arg = Number.parseInt(arg) - 1;
            if(Number.parseInt(arg) >= 0 && Number.parseInt(arg) < server.audio.queue.length) return arg;
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
                console.log(element);
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

    static error(server,message,type,text)
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

        message.channel.send(messageContent).then(msg => {
            server.audio.lastQueue.messageId = msg.id;
            server.audio.lastQueue.channelId = msg.channel.id;
            Tools.serverSave(server);
            setTimeout(function(){
                if(server.audio.lastQueue.messageId != null) msg.delete();
            },5000);
        });
        server.audio.lastQueue.channelId=undefined;
        server.audio.lastQueue.messageId=undefined;
        Tools.serverSave(server);
    }
}