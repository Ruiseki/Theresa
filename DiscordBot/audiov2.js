const FS = require('fs');
const Discord = require('discord.js');
const NodeID3 = require('node-id3');
const ytdl = require('ytdl-core');

const YouTubeMgr = require('./YouTubeMgr.js');
const Tools = require('./tools.js')

var musicDirectory=[];
musicDirectory = FS.readFileSync('./audio/musicDirectory.tlist','utf-8').split(/\r\n/);

module.exports = class Audio
{
    static cmd(server,prefix,command,args,message)
    {
        message.delete();
        
        if(command == undefined) ;
        else
        {
            if(command == 'queue' || command == 'q') this.queueMgr(server,message,command,args);
            else if(command == 'player' || command == 'p') this.engineMgr(server,message,command,args);
            else if(command == 'miscellaneous' || command == 'm') this.miscellaneous(server,message,command,args);
            else if(command == 'download' || command == 'dl') this.download(server,message,command,args);
            else this.audioMaster(server,message,command,args);
        }
    }

    static async audioMaster(server,message,command,args)
    {
        /*
        
        complete commande exemple : t!a World is mine >>1
        this command is special. They are no "command". The command variable contain the first word of the music.
        This isn't arranged like this for the other commands.
        
        POV :

        queuePos : user view
        currentPlayingSong : array view
        
        */

        let music = command,
        queuePos = undefined;
        
        if(!message.member.voice.channel)
        {
            this.error(message,3,"Please connect yourselft in a voice channel first");
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
                        if(server.audio.Engine == undefined)
                        {
                            this.error(message,3,'There is no current song');
                            return;
                        }
                        if(server.audio.currentPlayingSong) queuePos = server.audio.currentPlayingSong+1;
                        else queuePos = 1;
                    }
                    else if(args[0].substring(2) == 'after' || args[0].substring(2) == 'aft')
                    {
                        if(server.audio.currentPlayingSong != undefined) queuePos = server.audio.currentPlayingSong+2;
                    }
                    else if(Number.isNaN(args[0].substring(2)))
                    {
                        this.error(message,0,'Expected value : integer');
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
            title = await YouTubeMgr.searchToTitle(videoID),
            URL = await YouTubeMgr.titleToURL(videoID),
            text = `**${title}**  :notes:\n*__${URL}__*\n\n*Position : **${queuePos}***\n*requested by __${message.author.username}__ → ${message.content}*`;

            let embed = new Discord.MessageEmbed()
            .setDescription(text)
            .setColor('#000000')
            .setThumbnail(`https://img.youtube.com/vi/${videoID}/sddefault.jpg`);

            message.channel.send(embed).then(msg => {
                let object = {
                    messageID:msg.id,
                    channelID:msg.channel.id
                };
                server.audio.messageTemp.push(object);

                setTimeout(() => {
                    for(let i=0; i < server.audio.messageTemp.length; i++)
                    {
                        if(server.audio.messageTemp[i].messageID == msg.id)
                        {
                            server.audio.messageTemp.splice(i,1);
                            msg.delete();
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
                    server.audio.queue = this.addIntoArray(videoID,queuePos-1,server.audio.queue);
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
                this.simpleEmbed(server,message,text);
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
                
                if(tags.image != undefined) this.simpleEmbed(server,message,text,tags.image.imageBuffer,true,true,30000);
                else this.simpleEmbed(server,message,text,undefined,false,true,30000);
                
                if(queuePos == server.audio.queue.length+1) server.audio.queue.push(`[LOCAL]${array[0]}`);
                else
                {
                    if(server.audio.currentPlayingSong == queuePos-1) server.audio.queue[server.audio.currentPlayingSong] = `[LOCAL]${array[0]}`;
                    else
                    {
                        if(server.audio.currentPlayingSong > queuePos) server.audio.currentPlayingSong++;
                        server.audio.queue = this.addIntoArray(`[LOCAL]${array[0]}`,queuePos-1,server.audio.queue);
                    }
                }
            }
        }

        if(server.audio.queue.length == 1)
        {
            server.audio.currentPlayingSong = 0;
            this.audioEngine(server,message);
        }
        else if(server.audio.currentPlayingSong == queuePos-1 && server.audio.Engine != undefined)
        {
            if(server.audio.pause)
            {
                server.audio.Engine.resume();
                server.audio.pause = false;
            }
            server.audio.currentPlayingSong--;
            server.audio.Engine.end();
        }
        else if(!server.audio.isPlaying && !server.audio.pause)
        {
            this.audioEngine(server,message);
        }
        else this.queueDisplay(server,message,16,true);
    }

    static async audioEngine(server,message)
    {
        console.log(`Audio Engine is running. File (queue) : ${server.audio.queue[server.audio.currentPlayingSong]}`);
        // console.log(server.audio.currentPlayingSong);
        
        let lastTchn = message.guild.channels.cache.get(server.global.lastTextChannelID);

        this.queueDisplay(server,lastTchn,16,true);
        server.audio.isPlaying = true;
        lastTchn.guild.me.voice.channel.join().then(connection => {
            if(server.audio.queue[server.audio.currentPlayingSong].startsWith('[LOCAL]')) server.audio.Engine = connection.play(server.audio.queue[server.audio.currentPlayingSong].substring(7));
            else
            {
                server.audio.Engine = connection.play(ytdl(`https://www.youtube.com/watch?v=${server.audio.queue[server.audio.currentPlayingSong]}`),{filter:'audioonly',quality:'highest',highWaterMark:1024 * 1024});
            }
            server.audio.Engine.on('finish', function()
            {   
                server.audio.isPlaying = false;
                server.audio.Engine = undefined;
                if(server.audio.arret) return;
                else if(server.audio.loop)    
                {
                    Audio.audioEngine(server,lastTchn);
                }
                else if(server.audio.queueLoop)
                {
                    if(!server.audio.queue[server.audio.currentPlayingSong+1]) server.audio.currentPlayingSong = 0;
                    else server.audio.currentPlayingSong++;
                    Audio.audioEngine(server,lastTchn);
                }
                else
                {
                    server.audio.currentPlayingSong++;
                    if(server.audio.queue[server.audio.currentPlayingSong])
                    {
                        Audio.audioEngine(server,lastTchn);
                    }
                    else
                    {
                        if(server.audio.lastQueue.messageID != undefined)
                        {
                            let channel = message.guild.channels.cache.get(server.audio.lastQueue.channelID);
                            channel.messages.fetch(server.audio.lastQueue.messageID).then(msg => msg.delete());
                            server.audio.lastQueue.messageID = undefined;
                            server.audio.lastQueue.channelID = undefined;
                        }
                        console.log('Audio Engine Off.');
                    }
                }
            });
        });   
    }

    static engineMgr(server,message,command,args)
    {
        this.log(message,command,args);
        if(server.audio.Engine == undefined) return;
        else if(!args[0]) ;
        else if(args[0] == 'stop' || args[0] == 's')
        {
            if(server.audio.isPlaying)
            {
                server.audio.arret = true;
                server.audio.Engine.end();
            }
            else
            {
                this.error(message,3,`Audio Engine isn't playing.`);
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
                this.error(message,3,`Audio Engine isn't playing.`);
            }
            else if(server.audio.pause)
            {
                this.error(message,3,`Audio Engine is in pause.`);
            }
        }
        else if(args[0] == 'play' || args[0] == 'pl')
        {
            if(server.audio.pause && server.audio.isPlaying)
            {
                server.audio.Engine.resume();
                server.audio.pause = false;
            }
            else
            {
                if(server.audio.lastQueue.channelID != undefined)
                {
                    let channel = message.guild.channels.cache.get(server.audio.lastQueue.channelID);
                    channel.messages.fetch(server.audio.lastQueue.messageID)
                    .then(m => m.delete());
                }
                this.error(message,3,`Audio Engine isn't playing.`);
            }
        }
        else if(args[0] == 'replay' || args[0] == 'r')
        {
            if(server.audio.Engine)
            {
                server.audio.currentPlayingSong--;
                server.audio.Engine.end();
            }
            else
            {
                if(server.audio.queue[0])
                {
                    server.audio.currentPlayingSong--;
                    server.audio.Engine.end();
                }
                else
                {
                    this.error(message,3,'There is no queue');
                }
            }
        }
    }

    static async queueMgr(server,message,command,args)
    {
        /*
            Command exemple :
            t!a queue
            t!a queue skip | t!a queue previous
            t!a queue go 3
            t!a delete 3 | t!a delete 3 7 | t!a delete 1 3 4 5 7 8 9 0
            t!a queue clear
            ...

        */
        this.log(message,command,args)
        if(!args[0])
        {
            if(!server.audio.queue[0]) return;
            else this.queueDisplay(server,message,40,true);
        }
        else if(args[0] == 'clear' || args[0] == 'c')
        {
            server.audio.currentPlayingSong = undefined;
            server.audio.queue.splice(0,server.audio.queue.length);
            if(server.audio.loop) server.audio.loop = false;
            if(server.audio.queueLoop) server.audio.queueLoop = false;
            if(server.audio.Engine) server.audio.Engine.end();
            let text = `**Done ✅**`;
            this.simpleEmbed(server,message,text,undefined,false,true,1000);
            if(server.audio.lastQueue.channelID != undefined)
            {
                let channel = message.guild.channels.cache.get(server.audio.lastQueue.channelID);
                channel.messages.fetch(server.audio.lastQueue.messageID)
                .then(m => {
                    m.delete();
                    server.audio.lastQueue.messageID = undefined;
                    server.audio.lastQueue.channelID = undefined;
                });
            }
        }
        else if(args[0] == 'delete' || args[0] == 'd')
        {
            if(!args[1]) this.error(message,1,'You must precise the song number in the queue');
            else if(args[1] && !args[2])
            {
                if(Number.isNaN(args[1]) && args[1] != 'current' && args[1] != 'after' && args[1] != 'c' && args[1] != 'aft') this.error(message,0,'Expected value : integer');
                else if(args[1] == 'current' || args[1] == 'c')
                {
                    if(args[1] == 'current') args[1] = server.audio.currentPlayingSong;
                }
                else if(args[0] == 'after' || args[0] == 'aft')
                {
                    if(server.audio.currentPlayingSong != undefined) args[0] = server.audio.currentPlayingSong+1;
                }
                else args[1] = Number.parseInt(args[1])-1;


                server.audio.queue.splice(args[1],1);
                if(args[1] <= server.audio.currentPlayingSong)
                {
                    server.audio.currentPlayingSong--;
                    this.queueDisplay(server,message,16,true);
                }
                if(args[1] == server.audio.currentPlayingSong) server.audio.Engine.end();
            }
            else
            {
                if(Number.isNaN(args[1]) && args[1] != 'current' && args[1] != 'after' && args[1] != 'c' && args[1] != 'aft') this.error(message,0,'Expected value : integer');
                else if(args[1] == 'current' || args[1] == 'c')
                {
                    if(args[1] == 'current') args[1] = server.audio.currentPlayingSong;
                }
                else if(args[1] == 'after' || args[1] == 'aft')
                {
                    if(server.audio.currentPlayingSong != undefined) args[1] = server.audio.currentPlayingSong+1;
                }
                else args[1] = Number.parseInt(args[1])-1;

                if(Number.isNaN(args[2]) && args[2] != 'current' && args[2] != 'after' && args[2] != 'c' && args[2] != 'aft') this.error(message,0,'Expected value : integer');
                else if(args[2] == 'current' || args[2] == 'c')
                {
                    if(args[2] == 'current') args[2] = server.audio.currentPlayingSong;
                }
                else if(args[2] == 'after' || args[2] == 'aft')
                {
                    if(server.audio.currentPlayingSong != undefined) args[2] = server.audio.currentPlayingSong+1;
                }
                else args[2] = Number.parseInt(args[2])-1;


                if(args[2] <= args[1]) this.error(message,0,'2nd argument must be superior to the 1st argument');
                else
                {
                    server.audio.queue.splice(args[1], args[2] - args[1] + 1);
                    if(server.audio.currentPlayingSong >= args[1] && server.audio.currentPlayingSong <= args[2])
                    {
                        server.audio.currentPlayingSong = args[1]-1;
                        server.audio.Engine.end();
                    }
                    else if(server.audio.currentPlayingSong > args[2])
                    {
                        server.audio.currentPlayingSong -= args[2] - args[1] + 1;
                        this.queueDisplay(server,message,16,true);
                    }
                }
            }

            let text = `**Done ✅**`;
            this.simpleEmbed(server,message,text,undefined,false,true,1000);
            this.queueDisplay(server,message,16,true);
        }
        else if(args[0] == 'skip' || args[0] == 's' || args[0] == '>')
        {
            if(!server.audio.Engine);   
            else if(server.audio.currentPlayingSong+1 > server.audio.queue.length) this.error(message,3,'Queue Manager -> skip error');
            else server.audio.Engine.end();
        }
        else if(args[0] == 'previous' || args[0] == '<')
        {
            if(server.audio.currentPlayingSong == 0) this.error(message,3,'There is nothing befor');
            else
            {
                if(server.audio.Engine)
                {
                    server.audio.currentPlayingSong -= 2;
                    server.audio.Engine.end();
                }
                else
                {
                    server.audio.currentPlayingSong--;
                    this.audioEngine(server,message);
                }
            }
        }
        else if(args[0] == 'go')
        {
            if(args[1])
            {
                if(Number.isNaN(args[1])) this.error(message,0,'Expected value : integer');
                else if(Number.parseInt(args[1]) > server.audio.queue.length-1 || Number.parseInt(args[1] <= 0)) this.error(message,3,'Queue number doesn\'t exist');
                else
                {
                    server.audio.currentPlayingSong = Number.parseInt(args[1])-1;
                    if(server.audio.Engine) 
                    {
                        server.audio.currentPlayingSong--;
                        server.audio.Engine.end();
                    }
                    else this.audioEngine(server,message);
                }
            }
        }
        else if(args[0] == 'loop' || args[0] == 'l')
        {
            if(!server.audio.queue[0])
            { 
                this.error(message,3,'There is no queue');
            }
            else
            {
                if(server.audio.loop)
                {
                    server.audio.loop = false;
                    this.simpleEmbed(server,message,'**Loop Off ➡**',undefined,false,true,1000);
                }
                else
                {
                    server.audio.loop = true;
                    this.simpleEmbed(server,message,'**Loop On 🔂**',undefined,false,true,1000);
                }

                this.queueDisplay(server,message,16,true);
            }
        }
        else if(args[0] == 'loopqueue' || args[0] == 'lq')
        {
            if(!server.audio.queue[0])
            { 
                this.error(message,3,'There is no queue');
            }
            else
            {
                if(server.audio.queueLoop)
                {
                    server.audio.queueLoop = false;
                    this.simpleEmbed(server,message,'**Loop queue Off ➡**',undefined,false,true,1000);
                }
                else
                {
                    server.audio.queueLoop = true;
                    this.simpleEmbed(server,message,'**Loop queue On 🔁**',undefined,false,true,1000);
                }

                this.queueDisplay(server,message,16,true);
            }
        }
        else if(args[0] == 'move' || args[0] == 'm') this.error(message,3,'Work in progress');
        else if(args[0] == 'swap' || args[0] == 'sw')
        {
            if(!args[1])
            {
                this.error(message,1,'Please precise the 1st arguments');
                return;
            }
            else if(args[1] == "current") 
            {
                server.audio.currentPlayingSong--;
                server.audio.Engine.end();
                args[1] = server.audio.currentPlayingSong;
            }
            else if(args[1] == "end") args[1] = server.audio.queue[server.audio.queue.length-1];
            else if(!Number.isNaN(args[1])) args[1] = Number.parseInt(args[1])-1;
            else
            {
                this.error(message,0,'Expected value : integer');
            }

            if(!args[2])
            {
                this.error(message,1,'Please precise the 2nd arguments');
                return;
            }
            else if(args[2] == "current")
            {
                server.audio.currentPlayingSong--;
                server.audio.Engine.end();
                args[2] = server.audio.currentPlayingSong;
            }
            else if(args[2] == "end") args[2] = server.audio.queue[server.audio.queue.length-1];
            else if(!Number.isNaN(args[2])) args[2] = Number.parseInt(args[2])-1;
            else
            {
                this.error(message,0,'Expected value : integer');
            }

            let temp = server.audio.queue[args[1]];
            server.audio.queue[args[1]] = server.audio.queue[args[2]];
            server.audio.queue[args[2]] = temp;
        }
        else if(args[0] == 'shuffle' || args[0] == 'sh') this.error(message,3,'Work in progress');
        else if(args[0] == 'current' || args[0] == 'ct') this.error(message,3,'Work in progress');
    }

    static miscellaneous(server,message,command,args)
    {
        /*
            Command exemple :
            t!a miscellaneous localshuffle | t!a m ls
            t!a m find ka
        */
       
        this.log(message,command,args);
        if(!args[0]) this.error(message,1,'Please precise your intention(s).');
        else if(args[0] == 'find' || args[0] == 'f')
        {
            let array = this.getPathOfFile(args[1],musicDirectory);
            if(array == undefined) this.simpleEmbed(server,message,'No file was found ❌',undefined,false,true,3000);
            else
            {
                let text = '';
                for(let object of array) text += this.getNameFromPath(object,false)+'\n';
                let embed = new Discord.MessageEmbed()
                .setColor('#000000')
                .setTitle('Found file(s) :')
                .setDescription(text);
                message.channel.send(embed).then(msg => {
                    setTimeout(() => msg.delete(), 10000);
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
                this.audioEngine(server,message);
            }
        }
    }
    
    static async queueDisplay(server,message,nbrOfMusicDisplayed,isKeep)
    {
        let text;

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

        let startAt;
        if(server.audio.queue.length <= nbrOfMusicDisplayed) startAt = 0;
        else
        {
            if(server.audio.currentPlayingSong <= nbrOfMusicDisplayed/2) startAt = 0;
            else startAt = server.audio.currentPlayingSong - nbrOfMusicDisplayed/2;
        }

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
                    text += `:arrow_right:  **${await YouTubeMgr.searchToTitle(server.audio.queue[i])}**  :arrow_left:\n`;
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
                    text += `${i+1}: ${await YouTubeMgr.searchToTitle(server.audio.queue[i])}\n`;
                }
            }

            if(i-startAt == nbrOfMusicDisplayed-1) break;
        }


        if(server.audio.queue[server.audio.currentPlayingSong] && server.audio.queue[server.audio.currentPlayingSong].startsWith('[LOCAL]'))
        {
            let tags = NodeID3.read(server.audio.queue[server.audio.currentPlayingSong].substring(7));
            if(tags.image != undefined)
            {
                var embed = new Discord.MessageEmbed()
                .setColor('#000000')
                .setTitle('Music Queue  :notes:')
                .setDescription(text)
                .attachFiles(tags.image.imageBuffer)
                .setThumbnail('attachment://file.jpg');
            }
            else
            {
                var embed = new Discord.MessageEmbed()
                .setColor('#000000')
                .setTitle('Music Queue  :notes:')
                .setDescription(text);
            }
        }
        else
        {
            var embed = new Discord.MessageEmbed()
            .setColor('#000000')
            .setTitle('Music Queue  :notes:')
            .setDescription(text)
            .setThumbnail(`https://img.youtube.com/vi/${server.audio.queue[server.audio.currentPlayingSong]}/sddefault.jpg`);
        }

        if(server.audio.lastQueue.channelID != undefined)
        {
            let channel = message.guild.channels.cache.get(server.audio.lastQueue.channelID);
            channel.messages.fetch(server.audio.lastQueue.messageID)
            .then(m => m.delete());
        }

        let chn;
        if(message.channel) chn = message.channel // Gived value : DiscordMessage or DiscordTextChannel
        else chn = message;

        if(isKeep)
        {
            chn.send(embed)
            .then(m => {
                server.audio.lastQueue.messageID = m.id;
                server.audio.lastQueue.channelID = m.channel.id;
            })
        }
        else
        {
            chn.send(embed).then(msg => {
                server.audio.lastQueue.messageID = msg.id;
                server.audio.lastQueue.channelID = msg.channel.id;
                setTimeout(function(){
                    if(server.audio.lastQueue.messageID != undefined) msg.delete();
                },5000);
            });
            server.audio.lastQueue.channelID=undefined;
            server.audio.lastQueue.messageID=undefined;
        }
    }

    static async download(server,message,command,args)
    {
        this.log(message,command,args);

        if(!args[0]) // Download from the queue
        {
            if(!server.audio.queue[0])
            {
                this.error(message,3,'There is not queue');
                return;
            }

            if(message.author.id == '606684737611759628') // If it's from the server (from Ruiseki)
            {
                if(server.audio.isPlaying && !server.audio.queue[server.audio.currentPlayingSong].startsWith('[LOCAL]')) // YouTube
                {
                    let filePath = `/Users/ruiseki/Music/Musique/Wait/${await YouTubeMgr.searchToTitle(server.audio.queue[server.audio.currentPlayingSong])}.mp3`;
                    ytdl(`https://www.youtube.com/watch?v=${server.audio.queue[server.audio.currentPlayingSong]}`,{filter:'audioonly',quality:'highestaudio',highWaterMark:1024*1024*20})
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
                    ytdl(`https://www.youtube.com/watch?v=${server.audio.queue[server.audio.currentPlayingSong]}`,{filter:'audioonly',quality:'highestaudio',highWaterMark:1024*1024*20})
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
            console.log(`Downloading -> ${args[0]}`);
            message.author.send('Downloading...')
            .then(msg => {
                setTimeout(function(){
                    msg.delete();
                },120000);
            });
            
            let filePath = `./audio/${await YouTubeMgr.searchToTitle(args[0])}.mp3`;
            ytdl(`https://www.youtube.com/watch?v=${await YouTubeMgr.searchToID(args[0])}`,{filter:'audioonly',quality:'highestaudio',highWaterMark:1024*1024*20})
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

    static addIntoArray(object,place,array)
    {
        for(let i=array.length; i >= place; i--) array[i] = array [i-1]
        array[place] = object;
        return array;
    }

    static simpleEmbed(server,message,text)
    {
        this.simpleEmbed(server,message,text,undefined,false,false,undefined);
    }

    static simpleEmbed(server,message,text,image,needThumbnail)
    {
        this.simpleEmbed(server,message,text,image,needThumbnail,false,undefined);
    }
    
    static simpleEmbed(server,message,text,image,needThumbnail,willDelete,time)
    {
        if(needThumbnail)
        {
            let embed = new Discord.MessageEmbed()
            .setDescription(text)
            .setColor('#000000')
            .attachFiles(image)
            .setThumbnail('attachment://file.jpg');

            if(willDelete)
            {
                message.channel.send(embed).then(msg => {
                    let object = {
                        messageID:msg.id,
                        channelID:msg.channel.id
                    };
                    server.audio.messageTemp.push(object);

                    setTimeout(() => {
                        for(let i=0; i < server.audio.messageTemp.length; i++)
                        {
                            if(server.audio.messageTemp[i].messageID == msg.id)
                            {
                                server.audio.messageTemp.splice(i,1);
                                msg.delete();
                                break;
                            }
                        }
                    }, time)
                });
            }
            else message.channel.send(embed);
        }
        else
        {
            let embed = new Discord.MessageEmbed()
            .setColor('#000000')
            .setDescription(text);

            if(willDelete)
            {
                message.channel.send(embed).then(msg => {
                    let object = {
                        messageID:msg.id,
                        channelID:msg.channel.id
                    };
                    server.audio.messageTemp.push(object);

                    setTimeout(() => {
                        for(let i=0; i < server.audio.messageTemp.length; i++)
                        {
                            if(server.audio.messageTemp[i].messageID == msg.id)
                            {
                                server.audio.messageTemp.splice(i,1);
                                msg.delete();
                                break;
                            }
                        }
                    }, time)
                });
            }
            else message.channel.send(embed);
        }
    }

    static log(message,command,args)
    {
        console.log(`In "Audio" -> ${command} <- executed by ${message.author.username}. Argument : ${args}`);
    }

    static error(message,type,text)
    {
        /*
            Error type :
            -1 : Invalid Syntaxe
            0 : Invalid Argument
            1 : Missing Argument
            2 : Incomplete Command
            3 : Command fail
        */
       if(type == -1) message.channel.send(`**⚠ Invalid syntaxe ⚠**\n${text}`);
       else if(type == 0) message.channel.send(`**⚠ Invalide argument ⚠**\n${text}`);
       else if(type == 1) message.channel.send(`**⚠ Missing argument ⚠**\n${text}`);
       else if(type == 2) message.channel.send(`**⚠ Incomplete command ⚠**\n${text}`);
        else if(type == 3) message.channel.send(`**⚠ Command has fail ⚠**\n${text}`);
    }
}