const MusicDirectory = `../../Music/Musique/`;
const MusicDirectoryOST = `../../Music/Musique/OST/`;
const MusicDirectoryWait = `../../Music/Wait/`;

const FS = require('fs');
const ffmpeg = require('ffmpeg-static');
const Discord = require('discord.js');
const shell = require('shelljs');
const NodeID3 = require('node-id3');
const ytdl = require('ytdl-core');

const Tools = require('./tools.js');
const YouTubeMgr = require('./YouTubeMgr.js');

module.exports = class Audio
{
    static cmd(server,prefix,client,command,args,message,YouTubeMgr,VodkaGirlz,Theresa)
    {
        if(command === 'a' || command === 'audio') this.audio(server,prefix,command,client,message,args,YouTubeMgr,VodkaGirlz,Theresa);
        else if(command === 'ap' || command === 'audiopause') this.audioPause(server,message); // --> help
        else if(command === 'as' || command === 'audioskip') this.audioSkip(server,prefix,command,message,args,VodkaGirlz);
        else if(command === 'aq' || command === 'audioqueue') this.audioqueue(server,message,YouTubeMgr,Theresa);
        else if(command === 'ash' || command === 'audioshuffle') this.audioshuffle(server,message,client,VodkaGirlz,Theresa);
        else if(command === 'aqm' || command === 'audioqueuemove') this.audioqueuemove(server,message,args,Theresa);
        else if(command === 'aqw' || command === 'audioqueueswap') this.audioqueueswap(server,message,args,Theresa);
        else if(command === 'aqs' || command === 'audioqueueshuffle') this.audioqueueshuffle(server,message,args,client,VodkaGirlz,Theresa);
        else if(command === 'aqc' || command === 'audioqueueclear') this.audioqueueclear(server,message,Theresa);
        else if(command === 'ad' || command === 'audiodelete') this.audiodelete(server,message,args,Theresa);
        else if(command === 'ads' || command === 'audiodeleteselect') this.audiodeleteselect(server,message,args,Theresa);
        else if(command === 'af' || command === 'audiofind') this.audiofind(server,prefix,command,message,Theresa);
        else if(command === 'astop' || command === 'audiostop') this.stop(server,message,Theresa);
        else if(command === 'aql' || command === 'audioloopqueue') this.audioloopqueue(server,message,Theresa);
        else if(command === 'al' || command === 'audioloop') this.audioloop(server,message,Theresa);
        else if(command === 'ar' || command === 'audioreplay') this.audioreplay(server,message,client,VodkaGirlz,Theresa);
        else if(command === 'aly' || command === 'audiolyrics') this.audioLyrics(server,message);
        else if(command === 'ac' || command === 'audiocurrent') this.audioCurrent(server,message);

        //else if(command == 'adl' || command === 'audiodownload') this.audioDownload();

        else if(command === 'apl' || command === 'audioplaylist') this.audioplaylist(server,message,args,client,VodkaGirlz,Theresa);
        else if(command === 'pa' || command === 'playlistadd') this.playlistadd(server,prefix,command,message,args,Theresa);
        else if(command === 'pr' || command === 'playlistremove') this.playlistremove(server,message,args,Theresa);
        else if(command === 'pv' || command === 'playlistview') this.playlistview(server,message,args,Theresa);
        else if(command === 'apl2') this.audioplaylist2(server,message,args,client,VodkaGirlz,Theresa)

        else if(command === 'callroza') this.callRoza(server,message,args,VodkaGirlz);
        else if(command === 'continueplayingtheresa') this.continueplayingtheresa(server,message,client,VodkaGirlz,Theresa);
        else if(command === 'rozastartplaying') this.rozaStartPlaying(server,message,VodkaGirlz,Theresa);
        else if(command === 'rozastopplaying') this.rozaStopPlaying(server,message,client,VodkaGirlz,Theresa);


        else return false;
        return true;
    }

    static audioplaylist2(server,message,args,client,VodkaGirlz,Theresa)
    {
        console.log(`command -audioplaylist detected. Executed by ${message.author.username}.`);
        console.log();
        if(!args[0])
        {
            
        }
        else if(args[0]==('play'||'p'))
        {
            if(!args[1])
            {
                message.channel.send('[...]');
                return;
            }
            let result = this.findPlaylist(args[1]);
            if(result.length==0)
            {
                message.channel.send(`No matching playlist`);
                return;
            }
            else if(result.length>1)
            {
                message.channel.send(`You need to be more precise, some playlist start with the same word`);
            }
            let contain = FS.readFileSync(`./audio/playlist/${result[0]}`,'utf8').split(/\n/);
            for(let music of contain) server.queue.push(music);

            message.channel.send(`Playlist ${args[0]} added to the queue !`);

            if(!server.isPlaying)
            {
                message.member.voice.channel.join();
                this.musicPlay(server,this,message,client,YouTubeMgr,VodkaGirlz,Theresa);
            }
            this.queueEmbed(server,message.channel);
            this.queueSave(server,message);
        }
        else if(args[0]==('add'||'a'))
        {
            
        }
        else if(args[0]==('remove'||'r'))
        {
            if(!args[1])
            {
                message.channel.send('[...]');
                return;
            }
        }
        else if(args[0]==('view'||'v'))
        {
            
        }
    }

    static audioCurrent(server,message)                                                                                                                                                                                                                                                                      
    {
        message.delete();
        if(!server.queue[0]) {message.channel.send(`[...]`); return;}
        if(this.findMusic(server.queue[0]).length == 1)
        {
            var tags=NodeID3.read(this.getPathOfMusic(server.queue[0])),
            image={
                attachment: tags.image.imageBuffer,
                name: tags.title+'.jpg'
            };
            FS.writeFileSync('./audio/image.jpg',tags.image.imageBuffer);

            
            /*var avancemement=server.Engine.streamTime*100/server.Engine.totalStreamTime,
            nmbrLigne=avancemement/15,
            LignesRestantes=15-nmbrLigne;
            nmbrLigne--;
            var text="𝄞 ";
            for(var i=0;i<=nmbrLigne;i++) text+="⏤";
            text+="◯";
            for(var i=0;i<=LignesRestantes;i++) text+="⏤";*/
            //⏤◯𝄞


            var embed=new Discord.MessageEmbed()
            .setColor('#000000')
            .attachFiles([`./audio/image.jpg`])
            .setThumbnail(`attachment://image.jpg`)
            .setTitle(`:notes:  **${tags.title}**  :notes:`)
            .setDescription(`*${tags.artist}*`)
            .addField('About :',`Album : ${tags.album}`,false);

            message.channel.send(embed)
            .then(FS.rm('./audio/image.jpg'));
        }
        else if(this.findMusic(server.queue[0]).length > 1)
        {
            message.channel.send(`[...]`);
        }
        else
        {
            
        }
        
        /*var embed = new Discord.MessageEmbed
        .setColor('#000000')
        .setTitle(``);*/

        //message.channel.send(embed);
    }
    
    static async audio(server,prefix,command,client,message,args,YouTubeMgr,VodkaGirlz,Theresa)
    {
        var freeadd=0;
        var isOnPC=true;
        console.log(`command -audio detected. Executed by ${message.author.username}.`);
        message.delete();
        if(message.author.id === VodkaGirlz.id) waitingRoza=false;
        if(!message.member.voice.channel)
        {
            message.channel.send(`It's ok, please connect yourselft in a vocal channel, retry the command and we are good for the music !`);
            return;
        }
        
        if(!args[0])
        {
            if(server.queue[0] && server.Engine != undefined)
            {
                server.Engine.resume();
                return;
            }
            if(!server.queue[0]) message.channel.send('[...]');
            else this.musicPlay(server,this,message,client,YouTubeMgr,VodkaGirlz,Theresa)
            return;
        }
        if(args[args.length-1].startsWith('>>')) freeadd=args[args.length-1].substring(2);
        
        var musicName = message.content.substring(prefix.length + command.length + 1);
        if(freeadd!==0)
        {
            console.log(`-audio parameter >>${freeadd}`);
            var finder;
            for(var i=0;finder!=='>';i++)
            {
                finder=musicName[i];
                if(finder=='>') musicName=musicName.substring(0,i-1);
            }
        }
        
        if(this.getPathOfMusic(musicName) == '[---]')
        {
            var musicTab = this.findMusic(musicName);
            if(musicTab.length == 1)
            {
                musicName = musicTab[0].substring(0, musicTab[0].length - 4);
            }
            else if(musicTab.length > 1)
            {
                message.channel.send(`I need to have more precision about the title of the music. There is some music that begins with this word.`);
                var findFile=message.content.substring(prefix.length + command.length + 1);
                var audioFiles = this.findMusic(findFile);
                this.audioFilesEmbed(message.channel,audioFiles);
                
                return;
            }
            else if(VodkaGirlz.user.presence.status === 'online' && server.enableVodkaGirlz)
            {
                isOnPC=false;
            }
            else
            {
                isOnPC=false;
            }
        }
        
        if(freeadd==0) server.queue.push(musicName);
        else
        {
            var tab=[];
            if(freeadd > server.queue.length) freeadd=server.queue.length;
            for(var i=0;i<freeadd;i++) tab.push(server.queue[i]);
            tab.push(musicName);
            for(var i=freeadd;i<server.queue.length;i++) tab.push(server.queue[i]);
            server.queue=tab;
        }
        
        if(isOnPC)
        {
            var tags=NodeID3.read(this.getPathOfMusic(musicName));
            if(tags.title === undefined)
            {
                if(!server.queue[1]) {message.channel.send(`*User ${message.author.username} have requested "${musicName}"*\nHai hai~~ ! Next song is : "*${musicName}*".`);}
                else message.channel.send(`*User ${message.author.username} have requested "${musicName}"*\nHai hai~~ ! Added "*${musicName}*" to the queue.`);
            }
            else
            {
                if(!server.queue[1]) {message.channel.send(`*User ${message.author.username} have requested "${musicName}"*\nHai hai~~ ! Next song is : "*${tags.title}*".`);}
                else message.channel.send(`*User ${message.author.username} have requested "${musicName}"*\nHai hai~~ ! Added "*${tags.title}*" to the queue.`);
            }
        }
        else
        {
            var title = await YouTubeMgr.searchToTitle(musicName);
            if(title == undefined)
            {
                message.channel.send(`[...]`);
                return;
            }
            if(!server.queue[1]) {message.channel.send(`*User ${message.author.username} have requested "${musicName}"*\nHai hai~~ ! Next song is : "*${title}*".`);}
            else message.channel.send(`*User ${message.author.username} have requested "${musicName}"*\nHai hai~~ ! Added "*${title}*" to the queue.`);
        }
        
        
        console.log(`added to queue : ${musicName}`);
        
        message.member.voice.channel.join();
        
        if(server.queue[1] == undefined)
        {
            this.musicPlay(server,this,message,client,YouTubeMgr,VodkaGirlz,Theresa);
        }
        else
        {
            this.queueSave(server,message);
            Theresa.savePlace(message);
        }
    }
    
    static audioPause(server,message)
    {
        message.delete();
        if(server.Engine == undefined) return;
        else if(server.pause)
        {
            server.pause = false;
            server.Engine.resume();
        }
        else
        {
            server.pause = true;
            server.Engine.pause();
        }
    }

    static async audioSkip(server,prefix,command,message,args,VodkaGirlz)
    {
        console.log(`command -audioskip detected. Executed by ${message.author.username}.`);
        message.delete();
        if(!args[0] && server.VodkaGirlzIsPlaying) message.channel.send('v!s');
        else if(!args[0] && server.isPlaying) server.Engine.end();
        else if(args[0].startsWith('>>'))
        {
            if(args[0] === '>>>to')
            {
                console.log('-audioskip parameter : >>>to');
                var musics=this.findMusic(message.content.substring(prefix.length + command.length + 7));
                if(musics.length == 0) //a tester
                {
                    for(var i=0;i<server.queue.length;i++)
                    {
                        if(this.findMusic(server.queue[i]).length == 1) continue;
                        else
                        {
                            var title = await YouTubeMgr.searchToTitle(args[1]);
                            if(title == undefined)
                            {
                                message.channel.send(`[...]`);
                                return;
                            }
                            if(server.queue[i] == title)
                            {
                                server.queue.splice(i,0);
                            }
                            else continue;
                        }
                    }
                    return;
                }
                else if(musics.length != 1)
                {
                    message.channel.send(`I need to have more precision about the title of the music. There is some music that begins with this word.`);
                    this.audioFilesEmbed(message.channel,musics);
                    return;
                }
                musics[0]=musics[0].substring(0,musics[0].length-4);
                for(var i=0;i<server.queue.length;i++)
                {
                    if(server.queue[i] === musics[0])
                    {
                        server.queue.splice(0,i-1);
                        server.queueDisplayBool = true;
                        server.Engine.end();
                        continue;
                    }
                }
            }
            else //>>'nom de la musique'
            {
                var musicName = message.content.substring(prefix.length + command.length + 3);
                console.log(`-audioskip parameter : >>${musicName}`);
                if(this.getPathOfMusic(musicName) == '[---]')
                {
                    var musics=this.findMusic(musicName);
                    if(musics.length == 0)
                    {
                        message.channel.send(`No music was founded. You need to verify if VodkaGirlz are here Ruiseki-sama.`)
                        return;
                    }
                    else if(musics.length != 1)
                    {
                        message.channel.send(`I need to have more precision about the title of the music. There is some music that begins with this word.`);
                        this.audioFilesEmbed(message.channel,musics);
                        return;
                    }
                    musicName=musics[0].substring(0,musics[0].length-4);
                }
                var tab=[];
                tab.push(server.queue[0]);
                tab.push(musicName);
                for(var i=1;i<server.queue.length;i++) tab.push(server.queue[i]);
                server.queue.splice(0,server.queue.length);
                for(var music of tab) server.queue.push(music);
                server.queueDisplayBool=true;
                server.Engine.end();
            }
        }
        else if(args[0] && server.isPlaying)
        {
            var a=Number.parseInt(args[0]);
            if(Number.isNaN(a) === true) {message.channel.send('[...]'); return;}
            if(a>=1 && a<server.queue.length) server.queue.splice(0,a-1);
            server.queueDisplayBool = true;
            server.Engine.end();
        }
        else if(!server.isPlaying && VodkaGirlz.user.presence.status === 'online')
        {
            console.log('Rozaliya');
            server.queue.shift();
            message.channel.send('v!p');
        }
        else
        {
            message.channel.send(`There is nothing to skip~`);
        }
    }

    static audioqueue(server,message,YouTubeMgr,Theresa)
    {
        message.delete();
        Theresa.savePlace(message);
        console.log(`command -audioqueue detected. Executed by ${message.author.username}.`);
        if(server.queue[0]) this.queueEmbed(server,message.channel);
        else message.channel.send(`There is no queue !`);
    }

    static audioshuffle(server,message,client,VodkaGirlz,Theresa)
    {
        message.delete();
        console.log(`command -audioshuffle detected. Executed by ${message.author.username}.`);
        message.channel.send(`*${message.author.username}* have requested a shuffle play !`);
        var audioFiles = [];
        var allMusicTab = FS.readdirSync(MusicDirectory);
        var allMusicOST = FS.readdirSync(MusicDirectoryOST);
        var allMusicWait = FS.readdirSync(MusicDirectoryWait);

        for(var music of allMusicTab)
        {
            if((music.substring(music.length-4) === '.mp3') || (music.substring(music.length-4) === '.wav'))
            {
                music = music.substring(0,music.length-4);
                audioFiles.push(music);
            }
        }
        for(var music of allMusicOST)
        {
            if((music.substring(music.length-4) === '.mp3') || (music.substring(music.length-4) === '.wav'))
            {
                music = music.substring(0,music.length-4);
                audioFiles.push(music);
            }
        }
        for(var music of allMusicWait)
        {
            if((music.substring(music.length-4) === '.mp3') || (music.substring(music.length-4) === '.wav'))
            {
                music = music.substring(0,music.length-4);
                audioFiles.push(music);
            }
        }

        var indiceAlea;
        for(var i=audioFiles.length;i>0;i--)
        {
            indiceAlea = Tools.getRandomInt(audioFiles.length-1);
            server.queue.push(audioFiles[indiceAlea]);
            audioFiles.splice(indiceAlea,1);
        }
        
        if(!server.isPlaying)
        {
            message.member.voice.channel.join();
            this.musicPlay(server,this,message,client,YouTubeMgr,VodkaGirlz,Theresa);
        }
        else this.queueSave(server,message);
        this.queueEmbed(server,message.channel);
    }

    static audioqueueshuffle(server,message,args,client,VodkaGirlz,Theresa)
    {
        console.log(`command -audioqueue detected. Executed by ${message.author.username}.`);
        message.delete();
        Theresa.savePlace(message);
        var tabAlea = [];
        var tab = [];
        if(args[0] === 'p' || args[0] === 'play')
        {
            for(var music of server.queue) tab.push(music);
            tab.shift();
            while(tab[0])
            {
                var indiceAlea = Tools.getRandomInt(tab.length-1);
                tabAlea.push(tab[indiceAlea]);
                tab.splice(indiceAlea,1);
            }
            for(var i=0;i<tabAlea.length;i++) server.queue[i+1] = tabAlea[i];
        }
        else
        {
            while(server.queue[0])
            {
                var indiceAlea = Tools.getRandomInt(server.queue.length-1);
                tabAlea.push(server.queue[indiceAlea]);
                server.queue.splice(indiceAlea,1);
            }
            server.queue = tabAlea;
            this.musicPlay(server,this,message,client,YouTubeMgr,VodkaGirlz,Theresa);
        }

        if(server.queue[0])
        {
            message.channel.send(`Here's the queue :`);
            this.queueEmbed(server,message.channel);
        }
        else message.channel.send(`There is no queue !`);
    }

    static audioqueuemove(server,message,args,Theresa) // faire une multi commande pour déplacer plusieurs musique d'un coup
    {
        console.log(`command -audioqueuemove detected. Executed by ${message.author.username}.`);
        message.delete();
        Theresa.savePlace(message);
        var argsCount=0;
        var argsA=args[argsCount];
        var argsB=args[argsCount+1];

        if(!argsA || !argsB) return;
        argsA=Number.parseInt(argsA);
        if(Number.isNaN(argsA) == true) return;
        argsB=Number.parseInt(argsB);
        if(Number.isNaN(argsB) == true) return;
        
        
        var tab=[];
        
        if(argsA == argsB) return;
        for(var i = 0; i<server.queue.length;i++)
        {
            if(i == argsB)
            {
                tab.push(server.queue[argsA]);
                tab.push(server.queue[i]);
            }
            else if(i != argsA) tab.push(server.queue[i]);
        }

        server.queue = tab;
        this.queueEmbed(server,message.channel);
        this.queueSave(server,message);
    }

    static audioqueueswap(server,message,args,Theresa)
    {
        console.log(`command -audioqueueswap detected. Executed by ${message.author.username}.`);
        message.delete();
        Theresa.savePlace(message);
        var nom1;
        var nom2;
        var id1;
        var id2;
        for(var i=0;args[i] && args[i+1];i+=2)
        {
            id1=args[i];
            id2=args[i+1];

            console.log(`id1 : ${id1}`);
            console.log(`id2 : ${id2}`);

            nom1=server.queue[id1];
            nom2=server.queue[id2];

            server.queue[id1]=nom2;
            server.queue[id2]=nom1;
        }
        this.queueSave(server,message);
        this.queueEmbed(server,message.channel);
    }

    static audioqueueclear(server,message,Theresa)
    {
        console.log(`command -audioqueueclear detected. Executed by ${message.author.username}.`);
        message.delete();
        Theresa.savePlace(message);
        server.queue.splice(0,server.queue.length);
        if(server.Engine) server.Engine.end();
    }

    static audiodelete(server,message,args,Theresa)
    {
        message.delete();
        console.log(`command -audiodelete detected. Executed by ${message.author.username}.`);
        Theresa.savePlace(message);
        if(!args[0]) return;
        else if(Number.isNaN(parseInt(args[0])) && !(args[0] < server.queue.length))
        {
            message.channel.send('[...]');
            return;
        }
        else if(!args[1]) server.queue.splice(args[0],1);
        else if(Number.isNaN(parseInt(args[1])) && !(args[1] < server.queue.length))
        {
            message.channel.send('[...]');
            return;
        }
        else if(args[0] && args[1])
        {
            if(args[1] == 0) args[1] = server.queue.length-1;
            else args[1] = args[1] - args[0] + 1;
            server.queue.splice(args[0],args[1]);
        }
        this.queueEmbed(server,message.channel);
        this.queueSave(server,message);
    }

    static audiodeleteselect(server,message,args,Theresa)
    {
        console.log(`command -audiodeleteselect detected. Executed by ${message.author.username}.`);
        Theresa.savePlace(message);
        if(!args[0]) return;
        else if(Number.isNaN(args[0])) message.channel.send('[...]');
        else
        {
            var i = 0;
            while(args[i])
            {
                server.queue.splice(args[i]-i,1);
                i++;
            }
            this.queueEmbed(server,message.channel);
            this.queueSave(server,message);
        }
    }

    static audiofind(server,prefix,command,message,Theresa)
    {
        console.log(`command -audiofind detected. Executed by ${message.author.username}.`);
        message.delete();
        Theresa.savePlace(message);
        var findFile = message.content.substring(prefix.length + command.length + 1);
        var audioFiles = this.findMusic(findFile);
        if(audioFiles.length === 1 && message.guild.me.voice.channel !== null)
        {
            for(var i=0;i<server.queue.length;i++)
            {
                if(server.queue[i] === audioFiles[0].substring(0,audioFiles[0].length-4))
                {
                    console.log(i);
                    message.channel.send(`Position of *"__${audioFiles[0].substring(0,audioFiles[0].length-4)}__"* in the queue : **${i}**`);
                    i=server.queue.length;
                }
            }
        }
        else this.audioFilesEmbed(message.channel,audioFiles);
    }

    static stop(server,message,Theresa)
    {
        console.log(`command -stop detected. Executed by ${message.author.username}.`);
        if(!server.VodkaGirlzIsPlaying) message.delete();
        Theresa.savePlace(message);
        server.arret = true;
        server.Engine.end();
    }

    static audioloopqueue(server,message,Theresa)
    {
        console.log(`command -audioqueueloop detected. Executed by ${message.author.username}.`);
        message.delete();
        Theresa.savePlace(message);
        if(server.queueLoop) 
        {
            server.queueLoop = false
            message.channel.send(`Audio Queue Loop disable !`);
        }
        else
        {
            server.queueLoop = true;
            message.channel.send(`Audio Queue Loop enable !`);
        } 
    }

    static audioloop(server,message,Theresa)
    {
        console.log(`command -audioloop detected. Executed by ${message.author.username}.`);
        message.delete();
        Theresa.savePlace(message);
        if(server.loop)
        {
            server.loop = false;
            message.channel.send(`Loop is disable !`);
        }
        else
        {
            server.loop = true;
            message.channel.send(`Loop is enable !`);
        }
    }

    static audioreplay(server,message,client,VodkaGirlz,Theresa)
    {
        console.log(`command -audioreplay detected. Executed by ${message.author.username}.`);
        message.delete();
        Theresa.savePlace(message);
        Tools.sleep(1000);
        server.Engine.pause();
        this.musicPlay(server,this,message,client,YouTubeMgr,VodkaGirlz,Theresa);
    }

    static audioLyrics(server,message)
    {
        message.delete();
        if(!server.queue[0]) {message.channel.send('[...]'); return;}
        if(this.findMusic(server.queue[0]).length !== 1) {message.channel.send('[...]'); return;}
        try {var tab = NodeID3.read(this.getPathOfMusic(server.queue[0])).unsynchronisedLyrics.text.split(/\r\n/);}
        catch(error)
        {
            message.channel.send('[...]');
            console.log(error);
            return;
        }
        var tabB = [];
        for(var i=0;i<tab.length;i++)
        {
            if(i%60 == 0)
            {
                tabB.push(tab[i]+'\n');
            }
            else
            {
                tabB[tabB.length-1]+=tab[i]+'\n';
            }
        }
        message.channel.send(`Here are the lyrics of __**${server.queue[0]}**__ : \n\n :headphones:`);
        for(var i=0;i<tabB.length;i++) message.channel.send(tabB[i]);
    }

//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//

    static callRoza(server,message,args,VodkaGirlz)
    {
        message.delete();
        console.log(`command -callroza detected. Executed by ${message.author.username}.`);
        if(!args[0]) message.channel.send(`[...]`);
        else if(VodkaGirlz.user.presence.status !== 'online') {message.channel.send(`[...]`); server.enableVodkaGirlz=false;}
        else if(args[0] == 'enable') {message.channel.send(`I will call VodkaGirlz next time.`); server.enableVodkaGirlz=true;}
        else if(args[0] == 'disable') {message.channel.send(`I will make my own research now.`); server.enableVodkaGirlz=false;}
    }

    static continueplayingtheresa(server,message,client,VodkaGirlz,Theresa)
    {
        console.log(`command -continueplayingtheresa detected. Executed by ${message.author.username}.`);
        message.delete();
        if(message.author.id != VodkaGirlz.user.id && message.author.id != '606684737611759628') return;
        server.queue.shift();
        this.queueSave(server,message);
        if(server.queue[0]) this.musicPlay(server,this,message,client,YouTubeMgr,VodkaGirlz,Theresa);
    }

    static rozaStartPlaying(server,message,VodkaGirlz,Theresa)
    {
        console.log(`command -rozaStartPlaying detected. Executed by ${message.author.username}.`);
        message.delete();
        if(message.author.id != VodkaGirlz.user.id && message.author.id != '606684737611759628') return;
        server.VodkaGirlzIsPlaying = true;
        if(server.isPlaying) this.stop(server,message,Theresa);
    }

    static rozaStopPlaying(server,message,client,VodkaGirlz,Theresa)
    {
        console.log(`command -rozaStopPlaying detected. Executed by ${message.author.username}.`);
        message.delete();
        if(message.author.id != VodkaGirlz.user.id && message.author.id != '606684737611759628') return;
        server.VodkaGirlzIsPlaying = false;
        if(server.queue[0])
        {
            var tab = this.findMusic(server.queue[0])
            if(tab.length != 0) this.musicPlay(server,this,message,client,YouTubeMgr,VodkaGirlz,Theresa);
        }
    }

//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//

    static audioplaylist(server,message,args,client,VodkaGirlz,Theresa)
    {
        message.delete();
        console.log(`command -audioplaylist detected. Executed by ${message.author.username}.`);
        Theresa.savePlace(message);
        if(!args[0]) return;
        var PlaylistFile = `./audio/Playlist/${args[0]}.txt`;
        if(FS.existsSync(PlaylistFile))
        {
            var data = FS.readFileSync(PlaylistFile,'utf8');
            var tab = data.split(/\n/);
            for(var i=0;i<tab.length;i++) server.queue.push(tab[i]);
        }
        else
        {
            message.channel.send(`[...]`);
            return;
        }

        if(!server.isPlaying)
        {
            message.member.voice.channel.join();
            this.musicPlay(server,this,message,client,YouTubeMgr,VodkaGirlz,Theresa);
        }
        message.channel.send(`Playlist ${args[0]} added to the queue !`);
        this.queueEmbed(server,message.channel);
        this.queueSave(server,message);
    }

    static playlistadd(server,prefix,command,message,args,Theresa)
    {
        console.log(`command -playlistadd detected. Executed by ${message.author.username}.`);
        message.delete();
        Theresa.savePlace(message);
        if(!args[0]) return;
        var PlaylistFile = `./audio/Playlist/${args[0]}.txt`;

        if(!args[1])
        {
            if(!FS.existsSync(`${PlaylistFile}`))
            {
                FS.writeFileSync(PlaylistFile,``);
                message.channel.send(`Playlist *"${args[0]}"* created !`);
                console.log(`Playlist "${args[0]}" created by ${message.author.username}.`);
            }
            else message.channel.send(`This playlist is already here !`);
        }
        else
        {
            args[1] = message.content.substring(prefix.length + command.length + 1 + args[0].length+1);
            if(FS.existsSync(PlaylistFile) && args[1] === 'queue' && server.queue[0])
            {
                for(var i=0;i<server.queue.length;i++)
                {
                    if(i!=server.queue.length-1) FS.appendFileSync(PlaylistFile,`${server.queue[i]}\n`);
                    else FS.appendFileSync(PlaylistFile,`${server.queue[i]}`);
                }
                return;
            }
            else if(FS.existsSync(`${MusicDirectory}${args[1]}.mp3`) || FS.existsSync(`${MusicDirectoryOST}${args[1]}.mp3`) || FS.existsSync(`${MusicDirectoryWait}${args[1]}.mp3`)) {}
            else if(FS.existsSync(`${MusicDirectory}${args[1]}.wav`) || FS.existsSync(`${MusicDirectoryOST}${args[1]}.wav`) || FS.existsSync(`${MusicDirectoryWait}${args[1]}.wav`)) {}
            else
            {
                var musicFind = this.findMusic(args[1]);
                if(musicFind.length != 1)
                    {
                        console.log(`(!) plusieurs musique trouver`);
                        message.channel.send(`I need to have more precision about the title of the music. There is some music that begins with this word.`);
                        return;
                    }
                else args[1] = musicFind[0].substring(0,musicFind[0].length-4);
            }

            if(FS.existsSync(PlaylistFile))
            {
                FS.appendFileSync(PlaylistFile,`\n${args[1]}`);
                message.channel.send(`*"${args[1]}"* was added to *"${args[0]}"*.`);
            }
            else
            {
                console.log(`(!) playlist introuvable`);
                message.channel.send(`This playlist doesn't exist~`);
            }
        }
    }

    static playlistremove(server,message,args,Theresa)
    {
        console.log(`command -playlistremove detected. Executed by ${message.author.username}.`);
        message.delete();
        Theresa.savePlace(message);
        if(!args[0]) return;
        if(FS.existsSync(`./audio/Playlist/${args[0]}.txt`))
        {
            FS.unlinkSync(`./audio/Playlist/${args[0]}.txt`);
            message.channel.send(`The playlist ${args[0]} has been deleted !`);
        }
    }

    static playlistview(server,message,args,Theresa)
    {
        console.log(`command -playlistview detected. Executed by ${message.author.username}.`);
        message.delete();
        Theresa.savePlace(message);
        if(!args[0])
        {
            var playlistName=FS.readdirSync(`./audio/Playlist/`);
            for(var i=0;i<playlistName.length;i++) playlistName[i]=playlistName[i].substring(0,playlistName[i].length-4);
            var Embed = new Discord.MessageEmbed()
            .setColor('#000000')
            .setTitle(`**:headphones:  Available Playlist  :headphones:**`)
            .attachFiles([`./Picture/Theresa.jpg`])
            .setThumbnail(`attachment://Theresa.jpg`)
            .setDescription(playlistName);
            message.channel.send(Embed);
        }
        else
        {
            if(FS.existsSync(`./audio/Playlist/${args[0]}.txt`))
            {
                var name = FS.readFileSync(`./audio/Playlist/${args[0]}.txt`,'utf8');
                var Embed = new Discord.MessageEmbed()
                .setColor('#000000')
                .setTitle(`**:headphones:  Available Song in ${args[0]}  :headphones:**`)
                .attachFiles([`./Picture/Theresa.jpg`])
                .setThumbnail(`attachment://Theresa.jpg`)
                .setDescription(name);
                message.channel.send(Embed);
            }
            else
            {
                console.log(`(!) playlist introuvable`);
                return;
            }
        }
    }

//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//


    static async musicPlay(server,audio,message,client,YouTubeMgr,VodkaGirlz,Theresa)
    {
        Theresa.savePlace(message);
        if(server.VodkaGirlzIsPlaying)
        {
            this.queueSave(server,message);
            return;
        }

        var musicPath;
        var isOnPC=true;

        if(!server.queue[0])
        {
            server.isPlaying=false;
            this.queueSave(server,message);
            return;
        }

        musicPath=this.getPathOfMusic(server.queue[0])

        if(musicPath !== '[---]') {}
        else if(musicPath == '[---]' && !server.enableVodkaGirlz) isOnPC=false;
        else if(VodkaGirlz.user.presence.status === 'online' && server.enableVodkaGirlz)
        {
            console.log('Calling VodkaGirlz...');
            message.channel.send(`Rozaliya, Liliya, please search this : ${server.queue[0]}.`);
            message.channel.send(`v!p ${server.queue[0]}`);
            server.isPlaying=true;
            this.queueSave(server,message);
            return;
        }
        else
        {
            console.log(`Unknown Error !`);
            server.queue.shift();
            return;
        }
        
        server.isPlaying=true;
        this.queueSave(server,message);
        
        if(isOnPC) console.log(`Playing ${server.queue[0]}`);
        else console.log(`Playing ${await YouTubeMgr.searchToTitle(server.queue[0])}`);

        if(isOnPC) server.Engine = await message.guild.me.voice.connection.play(musicPath);
        else server.Engine = await message.guild.me.voice.connection.play(ytdl(await YouTubeMgr.titleToURL(server.queue[0]),{filter:'audioonly',quality:'highest',highWaterMark:1024*1024*2}));
        server.Engine.on('finish', function()
        {
            server.isPlaying=false;
            server.Engine=undefined; //reset streamTime (entre-autre)
            if(server.restart)
            {
                server.restart=false;
                server.isPlaying=true;
                server.queue.shift();
                audio.queueSave(server,message);
                console.log('### Theresa has restarted ###');
                Theresa.savePlace(message);
                shell.exec('pm2 restart main');
            }
            else if(server.leave)
            {
                server.queue.splice(0,server.queue.length);
                server.leave=false;
                server.isPlaying=false;
                audio.queueSave(server,message);
                return;
            }
            else if(server.arret)
            {
                server.arret = false;
                return;
            }
            else if(server.queueLoop)
            {
                    server.queue.push(server.queue[0]);
                    server.queue.shift();
                    audio.musicPlay(server,audio,message,client,YouTubeMgr,VodkaGirlz,Theresa)
            }
            else if(!server.loop)
            {
                server.queue.shift();
                if(server.queue[0])
                {
                    if(server.queueDisplayBool)
                    {
                        server.queueDisplayBool=false;
                        audio.queueEmbed(server,message.channel);
                    }
                    Tools.sleep(1000);
                    audio.queueSave(server,message);
                    audio.musicPlay(server,audio,message,client,YouTubeMgr,VodkaGirlz,Theresa);
                }
                else
                {
                    client.user.setActivity(`Waiting for your order`);
                    message.channel.send("There is nothing left in the queue~");
                    audio.queueSave(server,message);
                }
            }
            else
            {
                Tools.sleep(1000);
                audio.musicPlay(server,audio,message,client,YouTubeMgr,VodkaGirlz,Theresa);
            }
        });
        /*server.Engine.on('error', function(error)
        {
            console.log(error);
            message.channel.send('[...]');
        }*/
    }

    static leaving(server)
    {
        server.leave=true;
        if(server.Engine != undefined) server.Engine.end();
    }

    static queueSave(server,message)
    {
        FS.writeFileSync(`./Servers/${message.guild.id}/queueSave.tsave`,``);
        if(server.queue[0]) for(var i=0;i<server.queue.length;i++) FS.appendFileSync(`./Servers/${message.guild.id}/queueSave.tsave`,`${server.queue[i]}\n`);
        if(server.isPlaying) FS.appendFileSync(`./Servers/${message.guild.id}/queueSave.tsave`,`inPlaying`);
        else FS.appendFileSync(`./Servers/${message.guild.id}/queueSave.tsave`,`---`);
    }

    static async queueEmbed(server,channel)
    {
        var Embed = new Discord.MessageEmbed()
        .setColor('#000000')
        .setTitle(`**:headphones:  Music queue  :headphones:**`)
        .attachFiles([`./Picture/Theresa.jpg`])
        .setThumbnail(`attachment://Theresa.jpg`)
        .setDescription(await this.queueDisplay(server));
        channel.send(Embed);
    }

    static async queueDisplay(server)
    {
        var path=this.getPathOfMusic(server.queue[0]);
        if(path === '[---]')
        {
            var text = `**__Now playing__**  :arrow_right:  **${await YouTubeMgr.searchToTitle(server.queue[0])}** \n`
        }
        else
        {
            var tags=NodeID3.read(path);
            if(tags.title === undefined) var text = `**__Now playing__**  :arrow_right:  **${server.queue[0]}** \n`
            else var text = `**__Now playing__**  :arrow_right:  **${tags.title}** \n`
        }

        if(server.queue.length <= 41)
        {
            for(var i=1;i<server.queue.length;i++)
            {
                path=this.getPathOfMusic(server.queue[i]);
                if(path==='[---]') text += `${i} : ${await YouTubeMgr.searchToTitle(server.queue[i])}\n`;
                else
                {
                    tags=NodeID3.read(path);
                    if(tags.title === undefined) text += `${i} : ${server.queue[i]}\n`;
                    else text += `${i} : ${tags.title}\n`;
                }
            }
        }
        else
        {
            for(var i=1;i<41;i++)
            {
                path=this.getPathOfMusic(server.queue[i]);
                if(path==='[---]') text += `${i} : ${await YouTubeMgr.searchToTitle(server.queue[i])}\n`;
                else
                {
                    tags=NodeID3.read(path);
                    if(tags.title === undefined) text += `${i} : ${server.queue[i]}\n`;
                    else text += `${i} : ${tags.title}\n`;
                }
            }
            text += `\n **AND __${server.queue.length-41}__ MORE !**`;
        }
        return text;
    }
    
    static getPathOfMusic(musicName)
    {
        var path='[---]';
        var allMusicTab = FS.readdirSync(MusicDirectory);
        var allMusicOST = FS.readdirSync(MusicDirectoryOST);
        var allMusicWait = FS.readdirSync(MusicDirectoryWait);

        for(var music of allMusicTab)
        {
            if(music.toLocaleLowerCase() === musicName.toLocaleLowerCase()+'.mp3') {path=MusicDirectory+musicName+'.mp3'; continue;}
            if(music.toLocaleLowerCase() === musicName.toLocaleLowerCase()+'.wav') {path=MusicDirectory+musicName+'.wav'; continue;}
        }
        for(var music of allMusicOST)
        {
            if(music.toLocaleLowerCase() === musicName.toLocaleLowerCase()+'.mp3') {path=MusicDirectoryOST+musicName+'.mp3'; continue;}
            if(music.toLocaleLowerCase() === musicName.toLocaleLowerCase()+'.wav') {path=MusicDirectoryOST+musicName+'.wav'; continue;}
        }
        for(var music of allMusicWait)
        {
            if(music.toLocaleLowerCase() === musicName.toLocaleLowerCase()+'.mp3') {path=MusicDirectoryWait+musicName+'.mp3'; continue;}
            if(music.toLocaleLowerCase() === musicName.toLocaleLowerCase()+'.wav') {path=MusicDirectoryWait+musicName+'.wav'; continue;}
        }
        
        return path;
    }

    static findPlaylist(playName)
    {
        let playlistTab=FS.readdirSync(`./audio/playlist`);
        let result=[];
        for(let playlistName of playlistTab)
        {
            if(playlistName.toLocaleLowerCase().startsWith(playName.toLocaleLowerCase())) result.push(playlistName);
        }
        return result;
    }
    
    static findMusic(musicName)
    {
        var audioFiles = [];
        var allMusicTab = FS.readdirSync(MusicDirectory);
        var allMusicOST = FS.readdirSync(MusicDirectoryOST);
        var allMusicWait = FS.readdirSync(MusicDirectoryWait);
        for(var music of allMusicTab)
        {
            if(music.toLocaleLowerCase().startsWith(musicName.toLocaleLowerCase()) && ((music.substring(music.length - 4) === '.mp3') || (music.substring(music.length - 4) === '.wav'))) audioFiles.push(music);
        }
        for(var music of allMusicOST)
        {
            if(music.toLocaleLowerCase().startsWith(musicName.toLocaleLowerCase()) && ((music.substring(music.length - 4) === '.mp3') || (music.substring(music.length - 4) === '.wav'))) audioFiles.push(music);
        }
        for(var music of allMusicWait)
        {
            if(music.toLocaleLowerCase().startsWith(musicName.toLocaleLowerCase()) && ((music.substring(music.length - 4) === '.mp3') || (music.substring(music.length - 4) === '.wav'))) audioFiles.push(music);
        }
        return audioFiles;
    }

    static audioFilesEmbed(channel,audioFiles)
    {
        var Embed = new Discord.MessageEmbed()
        .setColor('#000000')
        .setTitle('Audio Find :')
        .setDescription(this.audioFilesDisplay(audioFiles))
        channel.send(Embed);
    }

    static audioFilesDisplay(audioFiles)
    {
        var text = '';
        for(var a of audioFiles)
        {
            text += `${a}\n`;
        }
        return text;
    }

    static getQueueSave(message)
    {
        var tab = FS.readFileSync(`./Servers/${message.guild.id}/queueSave.tsave`,'utf8').split(/\n/);
        tab.pop();
        return tab;
    }

    static getIsPlaying(server)
    {
        return server.isPlaying;
    }
}