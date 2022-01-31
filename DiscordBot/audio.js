const FS = require('fs');
const Discord = require('discord.js');
const Voice = require('@discordjs/voice');
const NodeID3 = require('node-id3');
const ytdl = require('ytdl-core');

const Theresa = require('./Theresa.js');
const YouTubeMgr = require('./YouTubeMgr.js');
const Tools = require('./tools.js');

// local music
var musicDirectory=[];
musicDirectory = FS.readFileSync('./audio/musicDirectory.tlist','utf-8').split(/ +/);

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
                    .setStyle('SECONDARY');

module.exports = class Audio
{
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

        if(args[0])
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
                        if(server.audio.currentPlayingSong) queuePos = server.audio.currentPlayingSong+1;
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
            let videoID = await YouTubeMgr.searchToID(music),
            title = await YouTubeMgr.IdToTitle(videoID),
            URL = await YouTubeMgr.IdToURL(videoID),
            text = `**${title}**  :notes:\n*__${URL}__*\n\n*Position : **${queuePos}***\n*requested by __${message.author.username}__ → ${message.content}*`;
            console.log(title);

            let embed = new Discord.MessageEmbed()
            .setDescription(text)
            .setColor('#000000')
            .setThumbnail(`https://img.youtube.com/vi/${videoID}/sddefault.jpg`);

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
                            msg.delete();
                            Tools.serverSave(server);
                            break;
                        }
                    }
                }, 30000)
            });
            
            if(queuePos == server.audio.queue.length+1) server.audio.queue.push(videoID);
            else
            {
                if(server.audio.currentPlayingSong == queuePos-1) server.audio.queue[server.audio.currentPlayingSong] = videoID;
                else
                {
                    if(server.audio.currentPlayingSong > queuePos) server.audio.currentPlayingSong++;
                    server.audio.queue = Tools.addIntoArray(videoID,queuePos-1,server.audio.queue);
                }
            }
        }
        else // Local
        {
            if(array.length > 1)
            {
                let text = '**Multiple files found**\n\n';
                for(let i = 0; i < array.length; i++)
                {
                    if(i == array.length - 1) text += this.getNameFromPath(array[i],false);
                    else text += this.getNameFromPath(array[i],false)+'\n';
                }
                Tools.simpleEmbed(server,message,text,undefined,false,true,10000);
                return;
            }
            else
            {
                let tags = NodeID3.read(array[0]),
                title, artist;
                if(tags.title === undefined) title = this.getNameFromPath(array[0],false);
                else title = tags.title;
                if(tags.artist === undefined) artist = '<unknown>';
                else artist = tags.artist;
                let text = `**${title}**  :notes:\n*__${artist}__*\n\n*Position : **${queuePos}***\n*requested by __${message.author.username}__ → ${message.content}*`;
                
                if(tags.image != undefined) Tools.simpleEmbed(server,message,text,tags.image.imageBuffer,true,true,30000);
                else Tools.simpleEmbed(server,message,text,undefined,false,true,30000);
                
                if(queuePos == server.audio.queue.length+1) server.audio.queue.push(`[LOCAL]${array[0]}`);
                else
                {
                    if(server.audio.currentPlayingSong == queuePos-1) server.audio.queue[server.audio.currentPlayingSong] = `[LOCAL]${array[0]}`;
                    else
                    {
                        if(server.audio.currentPlayingSong > queuePos) server.audio.currentPlayingSong++;
                        server.audio.queue = Tools.addIntoArray(`[LOCAL]${array[0]}`,queuePos-1,server.audio.queue);
                    }
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
            this.runAudioEngine(servers, server, message.guild);
        }
        else if(!server.audio.isPlaying && !server.audio.pause) // when the queue is complete and not reset
        {
            this.runAudioEngine(servers, server, message.guild);
        }
        else this.queueDisplay(server, 16,true); // when the engine the playing something

        Tools.serverSave(server);
    }

    static async runAudioEngine(servers, server, guild)
    {
        console.log(`Audio Engine is running. File (queue) : ${server.audio.queue[server.audio.currentPlayingSong]}`);

        this.queueDisplay(server,16,true);
        server.audio.isPlaying = true;

        let voiceChannel = guild.channels.cache.get(servers[guild.id].global.lastVoiceChannelId)
        Theresa.joinVoice(server, voiceChannel);

        if(server.audio.queue[server.audio.currentPlayingSong].startsWith('[LOCAL]')) // local file
        {
            server.audio.Engine = Voice.createAudioPlayer();
            server.audio.Engine.play(Voice.createAudioResource(server.audio.queue[server.audio.currentPlayingSong].substring(7)));
            server.global.voiceConnection.subscribe(server.audio.Engine);
        }
        else // youtube
        {
            server.audio.Engine = Voice.createAudioPlayer();
            server.audio.Engine.play(Voice.createAudioResource(ytdl(server.audio.queue[server.audio.currentPlayingSong]),{filter:'audioonly',quality:'highest',highWaterMark:512}));
            server.global.voiceConnection.subscribe(server.audio.Engine);
        }
        Tools.serverSave(servers[guild.id]);

        server.audio.Engine.on('idle', oldEngineStatu =>
        {
            server.audio.isPlaying = false;
            if(server.audio.arret) return;
            else if(server.audio.loop)
            {
                this.runAudioEngine(servers, server, guild);
            }
            else if(server.audio.queueLoop)
            {
                if(!server.audio.queue[server.audio.currentPlayingSong+1]) server.audio.currentPlayingSong = 0;
                else server.audio.currentPlayingSong++;
                this.runAudioEngine(servers, server, guild);
            }
            else
            {
                server.audio.currentPlayingSong++;
                if(server.audio.queue[server.audio.currentPlayingSong])
                {
                    this.runAudioEngine(servers, server, guild);
                }
                else
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
                    console.log('Audio Engine Off.');
                }
            }
            Tools.serverSave(server);
        });
    }

    static engineMgr(servers,message,command,args)
    {
        let server = servers[message.guild.id]

        this.log(message,command,args);
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
        let server = servers[message.guild.id]
        /*
            Command exemple :
            t!a queue
            t!a queue skip | t!a queue previous
            t!a queue go 3
            t!a delete 3 | t!a delete 3 7 | t!a delete 1 3 4 5 7 8 9 34
            t!a queue clear
            ...

        */
        this.log(message,command,args)
        if(!args[0])
        {
            if(!server.audio.queue[0]) return;
            else this.queueDisplay(server,40,true);
        }
        else if(args[0] == 'clear' || args[0] == 'c')
        {
            server.audio.currentPlayingSong = null;
            server.audio.queue.splice(0,server.audio.queue.length);
            if(server.audio.loop) server.audio.loop = false;
            if(server.audio.queueLoop) server.audio.queueLoop = false;
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
        else if(args[0] == 'delete' || args[0] == 'd')
        {
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
                    this.queueDisplay(server,16,true);
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
                        this.queueDisplay(server,16,true);
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
                queueDisplay(server,16,true);
            }

            let text = `**Done ✅**`;
            Tools.simpleEmbed(server,message,text,undefined,false,true,1000);
            this.queueDisplay(server,16,true);
        }
        else if(args[0] == 'skip' || args[0] == 's' || args[0] == '>')
        {
            if(!server.audio.Engine);   
            else if(server.audio.currentPlayingSong+1 > server.audio.queue.length) this.error(server,message,3,'Queue Manager -> skip error');
            else server.audio.Engine.stop();
        }
        else if(args[0] == 'previous' || args[0] == '<')
        {
            if(server.audio.currentPlayingSong == 0) this.error(server,message,3,'There is nothing befor');
            else
            {
                if(server.audio.Engine)
                {
                    server.audio.currentPlayingSong -= 2;
                    server.audio.Engine.stop();
                }
                else
                {
                    server.audio.currentPlayingSong--;
                    this.runAudioEngine(servers, server, message.guild);
                }
            }
        }
        else if(args[0] == 'go')
        {
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

                this.queueDisplay(server,16,true);
            }
        }
        else if(args[0] == 'loopqueue' || args[0] == 'lq')
        {
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

                this.queueDisplay(server,16,true);
            }
        }
        else if(args[0] == 'move' || args[0] == 'm') this.error(server,message,3,'Work in progress');
        else if(args[0] == 'swap' || args[0] == 'sw')
        {
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
            
            if(args[1] == server.audio.currentPlayingSong || args[2] == server.audio.currentPlayingSong) 
            {
                server.audio.Engine.stop();
            }



            let temp = server.audio.queue[args[1]];
            server.audio.queue[args[1]] = server.audio.queue[args[2]];
            server.audio.queue[args[2]] = temp;
        }
        else if(args[0] == 'shuffle' || args[0] == 'sh') this.error(server,message,3,'Work in progress');
        else if(args[0] == 'current' || args[0] == 'ct') this.error(server,message,3,'Work in progress');
    }

    static miscellaneous(servers,message,command,args)
    {
        /*
            Command exemple :
            t!a miscellaneous localshuffle | t!a m ls
            t!a m find ka
        */
        
        let server = servers[message.guild.id]
        this.log(message,command,args);
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
                                msg.delete();
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
            let shuffledMusic = [];
            if(!server.audio.queue[0]) server.audio.currentPlayingSong = 0;
            for(let path of musicDirectory)
            {
                let musics = FS.readdirSync(path);
                for(let music of musics)
                {
                    if(music.substring(music.length-4) == '.mp3' || music.substring(music.length-4) == '.wav')
                    {
                        music = '[LOCAL]'+this.getPathOfFile(music,musicDirectory);
                        shuffledMusic.push(music);
                    }
                }
            }
            let indiceAlea;
            for(let i=shuffledMusic.length;i>0;i--)
            {
                indiceAlea = Tools.getRandomInt(shuffledMusic.length-1);
                server.audio.queue.push(shuffledMusic[indiceAlea]);
                shuffledMusic.splice(indiceAlea,1);
            }

            if(!server.audio.isPlaying && !server.audio.pause)
            {
                this.runAudioEngine(servers, server, message.guild);
            }
            else this.queueDisplay(server, message, 16, true)
        }
    }
    
    static async queueDisplay(server, nbrOfMusicDisplayed, isKeep)
    {
        let text;

        // --------------------------------------------------------------------------------
        // Indique the loop status in top of the queue

        text = `*Playing options :* `;

        if(!server.audio.loop && !server.audio.queueLoop && !server.audio.restart)
        {
            text += '**None**\n\n';
        }
        else
        {
            if(server.audio.loop) text += '🔂';
            if(server.audio.queueLoop) text += '🔁';
            if(server.audio.restart) text += '⏏';
            text += '\n\n';
        }

        // --------------------------------------------------------------------------------
        // calculating the index of the first music to be displayed

        let startAt;
        if(server.audio.queue.length <= nbrOfMusicDisplayed) startAt = 0;
        else
        {
            if(server.audio.currentPlayingSong <= nbrOfMusicDisplayed/2) startAt = 0;
            else startAt = server.audio.currentPlayingSong - nbrOfMusicDisplayed/2;
        }

        // --------------------------------------------------------------------------------
        // building the text of the queue

        for(let i=startAt; i < server.audio.queue.length; i++)
        {
            if(i == server.audio.currentPlayingSong)
            {
                if(server.audio.queue[i].startsWith('[LOCAL]'))
                {
                    let tags = NodeID3.read(server.audio.queue[i].substring(7));
                    if(tags.title != undefined) text += `:arrow_right:  **${tags.title}**  :arrow_left:\n`;
                    else text += `:arrow_right:  **${this.getNameFromPath(server.audio.queue[i].substring(7))}**  :arrow_left:\n`;
                }
                else
                {
                    // youtube
                    text += `:arrow_right:  **${await YouTubeMgr.IdToTitle(server.audio.queue[i])}**  :arrow_left:\n`;
                }
            }
            else
            {
                if(server.audio.queue[i].startsWith('[LOCAL]'))
                {
                    let tags = NodeID3.read(server.audio.queue[i].substring(7));
                    if(tags.title != undefined) text += `${i+1}: ${tags.title}\n`;
                    else text += `${i+1}: ${this.getNameFromPath(server.audio.queue[i].substring(7),false)}\n`;
                }
                else
                {
                    // youtube
                    text += `${i+1}: ${await YouTubeMgr.IdToTitle(server.audio.queue[i])}\n`;
                }
            }

            if(i-startAt == nbrOfMusicDisplayed-1) break;
        }

        // --------------------------------------------------------------------------------
        // Embed generator

        if(server.audio.queue[server.audio.currentPlayingSong] && server.audio.queue[server.audio.currentPlayingSong].startsWith('[LOCAL]'))
        {
            let tags = NodeID3.read(server.audio.queue[server.audio.currentPlayingSong].substring(7));
            var messageOption;

            if(tags.image != undefined)
            {
                let embed = new Discord.MessageEmbed()
                .setColor('#000000')
                .setTitle('Music Queue  :notes:')
                .setDescription(text)
                .setThumbnail('attachment://file.jpg');

                let row = new Discord.MessageActionRow()
                .addComponents(
                    previousBtn,
                    stopBtn,
                    pausePlayBtn,
                    nextBtn
                );

                messageOption = {
                    embeds: [embed],
                    files: [tags.image.imageBuffer],
                    components: [row]
                };
            }
            else
            {
                let embed = new Discord.MessageEmbed()
                .setColor('#000000')
                .setTitle('Music Queue  :notes:')
                .setDescription(text);

                let row = new Discord.MessageActionRow()
                .addComponents(
                    previousBtn,
                    stopBtn,
                    pausePlayBtn,
                    nextBtn
                );
                
                messageOption = {
                    embeds: [embed],
                    components: [row]
                };
            }
        }
        else
        {
            let embed = new Discord.MessageEmbed()
            .setColor('#000000')
            .setTitle('Music Queue  :notes:')
            .setDescription(text)
            .setThumbnail(`https://img.youtube.com/vi/${server.audio.queue[server.audio.currentPlayingSong]}/sddefault.jpg`);

            let row = new Discord.MessageActionRow()
            .addComponents(
                previousBtn,
                stopBtn,
                pausePlayBtn,
                nextBtn
            );
            
            messageOption = {
                embeds: [embed],
                components: [row]
            };
        }

        // --------------------------------------------------------------------------------

        if(server.audio.lastQueue.channelId != null) // delete the old queue
        {
            let channelOfTheLastQueue = server.global.guild.channels.cache.get(server.audio.lastQueue.channelId);
            channelOfTheLastQueue.messages.fetch(server.audio.lastQueue.messageId)
            .then(m => m.delete());
        }

        // --------------------------------------------------------------------------------

        let chn = server.global.guild.channels.cache.get(server.audio.lastMusicTextchannelId); // last music channel

        if(isKeep)
        {
            chn.send(messageOption)
            .then(m => {
                server.audio.lastQueue.messageId = m.id;
                server.audio.lastQueue.channelId = m.channel.id;
                Tools.serverSave(server);
            })
        }
        else
        {
            chn.send(messageOption)
            .then(msg => {
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

    static async download(servers,message,command,args)
    {
        let server = servers[message.guild.id]
        this.log(message,command,args);

        if(!args[0]) // Download from the current song
        {
            if(!server.audio.queue[0])
            {
                this.error(server,message,3,'There is not queue');
                return;
            }

            if(message.author.id == '606684737611759628') // If it's from the server (from Ruiseki)
            {
                let videoTitle = await YouTubeMgr.searchToTitle(server.audio.queue[server.audio.currentPlayingSong]);
                
                videoTitle = videoTitle.split(/\//);
                videoTitle = videoTitle.join(" ");
                videoTitle = videoTitle.split(/\\/);
                videoTitle = videoTitle.join(" ");

                if(server.audio.isPlaying && !server.audio.queue[server.audio.currentPlayingSong].startsWith('[LOCAL]')) // YouTube
                {
                    let filePath = `/Users/ruiseki/Music/Wait/${videoTitle}.mp3`;
                    ytdl(`https://www.youtube.com/watch?v=${server.audio.queue[server.audio.currentPlayingSong]}`,{filter:'audioonly',quality:'highestaudio',highWaterMark:512})
                    .pipe(FS.createWriteStream(filePath));
                }
                else if(!server.audio.queue[server.audio.currentPlayingSong].startsWith('[LOCAL]')) message.author.send(message,3,'You already have this goshujin-sama~'); // Local
            }
            else // If it's a user request
            {
                if(server.audio.isPlaying && !server.audio.queue[server.audio.currentPlayingSong].startsWith('[LOCAL]')) // YouTube
                {
                    message.author.send('Downloading...')
                    .then(msg => {
                        setTimeout(function(){
                            msg.delete();
                        },120000);
                    });
                    let filePath = `./audio/${await YouTubeMgr.searchToTitle(server.audio.queue[server.audio.currentPlayingSong])}.mp3`;
                    ytdl(`https://www.youtube.com/watch?v=${server.audio.queue[server.audio.currentPlayingSong]}`,{filter:'audioonly',quality:'highestaudio',highWaterMark:1024})
                    .pipe(FS.createWriteStream(filePath))
                    .on('finish', () => {
                        message.author.send('Uploading...')
                        .then(msg => {
                            setTimeout(function(){
                                msg.delete();
                            },120000);
                        });
                        message.author.send({
                            content: 'Uploading complete !',
                            files: [{
                                attachment: filePath,
                                name: this.getNameFromPath(filePath,true)
                            }]
                        })
                        .then(msg => {
                            setTimeout(function(){
                                msg.delete();
                                FS.unlinkSync(filePath);
                            },120000);
                        });
                    });
                }
                else if(server.audio.queue[server.audio.currentPlayingSong].startsWith('[LOCAL]')) // Local
                {
                    let filePath = server.audio.queue[server.audio.currentPlayingSong].substring(7);
                    message.author.send('Uploading...')
                    .then(msg => {
                        setTimeout(function(){
                            msg.delete();
                        },120000);
                    });
                    message.author.send({
                        content: 'Uploading complete !',
                        files: [{
                            attachment: filePath,
                            name: this.getNameFromPath(filePath,true)
                        }]
                    })
                    .then(msg => {
                        setTimeout(function(){
                            msg.delete();
                        },120000);
                    });
                }
            }
        }
        else // Download from argument
        {
            let videoID = await YouTubeMgr.searchToID(args.join(" ")),
            videoTitle = await YouTubeMgr.searchToTitle(videoID);

            videoTitle = videoTitle.split(/\//);
            videoTitle = videoTitle.join(" ");
            videoTitle = videoTitle.split(/\\/);
            videoTitle = videoTitle.join(" ");

            console.log(`Downloading -> ${videoTitle}`);
            
            message.author.send('Downloading...')
            .then(msg => {
                setTimeout(function(){
                    msg.delete();
                },120000);
            });

            let filePath = `./audio/${videoTitle}.mp3`;
            ytdl(`https://www.youtube.com/watch?v=${videoID}`,{filter:'audioonly',quality:'highestaudio',highWaterMark:512})
            .pipe(FS.createWriteStream(filePath))
            .on('finish', () => {
                console.log("Download complete. Uploading");
                message.author.send('Uploading...') 
                .then(msg => {
                    setTimeout(function(){
                        msg.delete();
                    },120000);
                });
                message.author.send({
                    content: `**Music Title :** *${videoTitle}\nhttps://www.youtube.com/watch?v=${videoID}*`,
                    files: [{
                        attachment: filePath,
                        name: this.getNameFromPath(filePath,true)
                    }]
                })
                .then(msg => {
                    setTimeout(function(){
                        msg.delete();
                        FS.unlinkSync(filePath);
                    },120000);
                });
            });
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
            Return -1 if doesn't exist.
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

    static log(message,command,args)
    {
        console.log(`In "Audio" -> ${command} <- executed by ${message.author.username}. Argument : ${args}`);
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