require('dotenv').config();
const Discord = require('discord.js'); //API discord
const ffmpeg = require('ffmpeg-static');
const FS = require('fs'); //API fstream
const shell = require('shelljs') //API command windows
const ytdl = require('ytdl-core'); //API Downloader YouTube
const NodeID3 = require('node-id3'); //API MP3 tag
const fetch = require('node-fetch')


const Audio = require('./audio.js');
const Audio2 = require('./audiov2.js');
const Tools = require('./tools.js');
const RP = require('./rp.js');
const Theresa = require('./Theresa.js');
const Help = require('./help.js');
const YouTubeMgr = require('./YouTubeMgr.js');
const EliteDangerous = require('./eliteDangerous.js');

const client = new Discord.Client();
const prefix = 't!';

var servers = [];
var changeStatus = true;

var selectedActivity = 0;
var clientActivity = [
    `Waiting for your order`,
    `t!help`
];

var VodkaGirlz = {user : Discord.Client};
var AlphaDragons = {user : Discord.Client};
var Ruiseki = {user : Discord.Client};
var Krauhos = {user  : Discord.Client};

client.once('ready', () => {
    console.log(`### Powering...`);
    // channel = client.channels.cache.find(channel => channel.name === "hangars");
    client.user.setActivity('Waiting for your order || t!help');
    getUser(VodkaGirlz,'776186126788198410');
    getUser(AlphaDragons,'383156218862239744');
    getUser(Krauhos,'407160503912103937');
    getUser(Ruiseki,'606684737611759628');

    // démarrage et restauration des sauvegardes

    Theresa.boot(client,servers)

    console.log(`### Online`);
})

client.on('guildCreate',(guild) => {
    FS.mkdirSync(`./Servers/${guild.id}`);
    FS.mkdirSync(`./Servers/${guild.id}/userOption`);
    FS.writeFileSync(`./Servers/${guild.id}/queueSave.tsave`,'');
    FS.writeFileSync(`./Servers/${guild.id}/ServerInfo.tsave`,'');
    
    Theresa.specialChannelCreation(guild)
});

client.on('guildDelete',(guild) => {
    FS.unlinkSync(`./Servers/${guild.id}/queueSave.tsave`);
    FS.unlinkSync(`./Servers/${guild.id}/ServerInfo.tsave`);
    FS.rmdirSync(`./Servers/${guild.id}/userOption`);
    FS.rmdirSync(`./Servers/${guild.id}`);
});

client.on('presenceUpdate',(oldStatus,newStatus) => {
    var member;
    if(newStatus.guild.id !== '737261859916349542') return;
    if(newStatus) member = newStatus.member; /*console.log(`${member.user.username} has changed status`)*/

    if(member.id === VodkaGirlz.user.id) VodkaGirlz.user.presence.status = newStatus.status;
    if(member.id === Ruiseki.user.id) Ruiseki.user.presence.status = newStatus.status;
    if(member.id === AlphaDragons.user.id) AlphaDragons.user.presence.status = newStatus.status;
    if(member.id === Krauhos.user.id) Krauhos.user.presence.status = newStatus.status;

    if(oldStatus)
    {
        if(oldStatus.status === 'offline' && newStatus.status !== 'offline' && member.id === Ruiseki.user.id)
        {
            let embed = new Discord.MessageEmbed()
            .setColor('#000000')
            .setDescription('Ruiseki : \`Online ✔\`')

            AlphaDragons.user.send(embed);
            Krauhos.user.send(embed);
        }
        if(oldStatus.status === 'offline' && newStatus.status !== 'offline' && member.id === AlphaDragons.user.id)
        {
            let embed = new Discord.MessageEmbed()
            .setColor('#000000')
            .setDescription('AlphaDragons : \`Online ✔\`')

            Ruiseki.user.send(embed);
            Krauhos.user.send(embed);
        }
        if(oldStatus.status === 'offline' && newStatus.status !== 'offline' && member.id === Krauhos.user.id)
        {
            let embed = new Discord.MessageEmbed()
            .setColor('#000000')
            .setDescription('Krauhos : \`Online ✔\`')

            AlphaDragons.user.send(embed);
            Ruiseki.user.send(embed);
        }
    }
});

client.on('message', message => {
    
    if(message.guild !== null)
    {
        if(servers[message.guild.id] === undefined)
        {
            Theresa.objectGenerator(servers,message.guild.id);
        }
        
        servers[message.guild.id].global.lastTextChannelID = message.channel.id;

        mots = message.content.split(/ +/);

        for(mot of mots) //Alerte personnalisee
        {
            if(!mot.startsWith('<@!')) continue;
            for(pUser of servers[message.guild.id].recallPingUser.user)
            {
                if(mot.substring(3,mot.length-1) != pUser) continue;
                u=message.guild.members.cache.get(pUser);

                var Embed = new Discord.MessageEmbed()
                .setColor('#000000')
                .setTitle(`⚠  Ping Alerte  ⚠`)
                .setDescription(`Dear *${u.user.username}*, **${message.author.username}** is pinging you in __**${message.guild}**__.`
                +`\n\n**${message.author}** said : \n"${message.content}".`);
                u.user.send(Embed);

                break;
            }
        }
    }

    /* if(message.author.username === 'Theresa' && message.content === `I'm back !`)
    {
        Tools.sleep(2000);
        servers[message.guild.id].audio.queue = Audio.getQueueSave(message);
        Audio.queueEmbed(servers[message.guild.id].audio,message.channel);
        Audio.musicPlay(servers[message.guild.id].audio,Audio,message,client,YouTubeMgr,VodkaGirlz,Theresa);
    } */

    if(message.content === 'Theresa' || message.content.startsWith(`<@!${client.user.id}>`))
    {
        message.channel.send(`Ohayō *${message.author.username}*,`
        +` I'm ready to serv you. Send **t!help** to view all my command !`);
    }



    if(!message.content.startsWith(prefix) || (message.author.bot && (message.author !== VodkaGirlz.user))) return;
    
    //    [prefix][type]   [command]   [arguments]
    let type, command;
    const chose = message.content.slice(prefix.length).split(/ +/);
    type = chose.shift().toLocaleLowerCase();
    if(chose[0] != undefined) command = chose.shift().toLocaleLowerCase();

    //---------------------------------------------------------------------------------------------------------------------------------------------------//
    //---------------------------------------------------------------------------------------------------------------------------------------------------//
    
    if(type == 'a' || type == 'audio') 
    {
        Audio2.cmd(servers[message.guild.id],prefix,command,chose,message);
        return;
    }

    if(type == 'ed' || type == 'elite '|| type == 'elitedangerous')
    {
        EliteDangerous.cmd(servers[message.guild.id],message,command,chose);
        return;
    }
    
    
    const args = message.content.slice(prefix.length).split(/ +/); // arguments. Contient au début le type, la commande, et les arguments d'une commande complète.
    // type = args.shift().toLocaleLowerCase(); // séparation du type
    command = args.shift().toLocaleLowerCase(); // séparation de la commande
    
    
    
    /* if(Audio.cmd(servers[message.guild.id].audio,prefix,client,command,args,message,YouTubeMgr,VodkaGirlz,Theresa)) return;
    
    else  */
    
    if(Tools.cmd(servers[message.guild.id],command,message,args,client,Audio2,Theresa)) return;
    
    else if(Theresa.cmd(servers,command,client,message,args,VodkaGirlz,Audio)) return;
    
    else if(RP.cmd(servers[message.guild.id],message,command,args)) return;
    else if(Help.cmd(command,prefix,message,args)) return;
    
    else switch(command)
    {
        default:
            message.channel.send(`Dear ${message.author.username}, I don't know this command. Try **t!help** for watch list of my available commands. If a command is weird or if you think a command is missing, tell **__Ruiseki__**.`);
            message.delete();
            return;
        }
    });
    

    //---------------------------------------------------------------------------------------------------------------------------------------------------//
    //---------------------------------------------------------------------------------------------------------------------------------------------------//


client.on('voiceStateUpdate',(oldState,newState) => {

    //---------------------------------------------//
    // Theresa will join the voice channel of his creator and leave with him if she doing nothing
    if(oldState.channel == null && newState.channel != null && newState.id == Ruiseki.user.id && newState.guild.me.voice.channel == null) newState.member.voice.channel.join();
    if(oldState.channel != null && newState.channel == null && newState.id == Ruiseki.user.id && !servers[newState.guild.id].audio.isPlaying && !servers[newState.guild.id].audio.queue[0] && newState.guild.me.voice.channel != null) oldState.guild.me.voice.channel.leave();
    //---------------------------------------------//

    if(newState.channel != null && newState.id == client.user.id)
    {
        servers[newState.guild.id].global.lastVoiceChannelID = newState.channel.id;
        tab=FS.readFileSync(`./Servers/${newState.guild.id}/ServerInfo.tsave`,'utf8').split(/\n/);
        tab[1]=newState.channel.name;
        FS.writeFileSync(`./Servers/${newState.guild.id}/ServerInfo.tsave`,tab[0]+'\n'+tab[1]);
    }

    if(newState.channel == null && oldState.channel != null && newState.id == client.user.id)
    {
        servers[newState.guild.id].global.lastVoiceChannelID = undefined;
        tab=FS.readFileSync(`./Servers/${newState.guild.id}/ServerInfo.tsave`,'utf8').split(/\n/);
        tab[1]='---';
        FS.writeFileSync(`./Servers/${newState.guild.id}/ServerInfo.tsave`,tab[0]+'\n'+tab[1]);
    }

    if(newState.channel != null && oldState.channel != newState.channel)
    {
        var server=servers[newState.guild.id].recallVoicePingUser;
        for(ID of server.user)
        {
            for(var i=0;i<server.usersAndChannels[ID].userID.length;i++)
            {
                if(newState.id==server.usersAndChannels[ID].userID[i] && newState.channel.id==server.usersAndChannels[ID].channel[i])
                {
                    var u=newState.guild.members.cache.get(ID); // the user who is DM
                    var a=newState.guild.members.cache.get(server.usersAndChannels[ID].userID[i]); // targeted user
                    var c=newState.guild.channels.cache.get(server.usersAndChannels[ID].channel[i]); // targeted channel

                    for(let users of c.members.array()) if(users.id === u.user.id) return;

                    if(a.user.id != client.user.id)
                    {
                        var Embed = new Discord.MessageEmbed()
                        .setColor('#000000')
                        .setTitle(`Voice Connection Alerte`)
                        .setDescription(`***User :** __${a.user.username}__*\n***Channel :** __${c.name}__*\n***Server :** __${newState.guild.name}__*`);
                        u.user.send(Embed);
                    }
                    else if(a.user.id == client.user.id)
                    {
                        var Embed = new Discord.MessageEmbed()
                        .setColor('#000000')
                        .setTitle(`Voice Connection Alerte`)
                        .setDescription(`I'm in the voice channel \`${c.name}\` in the server __***${newState.guild.name}***__.`);
                        u.user.send(Embed);
                    }
                }
            }
        }
    }
});

client.on('guildMemberSpeaking',(member,speaking) => {
    if(speaking.bitfield == 1) {}
    else if(speaking.bitfield == 0) {}
    else {}
});

async function getUser(userReturn,id)
{
    userFound = await client.users.fetch(id, {cache : true}).then(user => userReturn.user = user);
    //console.log(`Found ${userFound.tag}`);
}

setInterval(function() {
    client.user.setActivity(clientActivity[selectedActivity]);
    selectedActivity++;
    if(selectedActivity == clientActivity.length) selectedActivity = 0;
}, 20000);

setInterval(function() {

    //gestionnaire des téléchargement auto

    if(Date.now() >= Number.parseInt(FS.readFileSync('./elite/lastcheck.tsave','utf8'))+86400000) EliteDangerous.downloadData(); // 86400000ms = 24h
    
},60000);

try
{
    fetch('https://www.google.com')
    .then(() => {
        client.login(process.env.key);
        console.log('### Login : OK');
    });
}
catch(error)
{
    console.log(`### Login : BAD`);
    console.error(error);
}