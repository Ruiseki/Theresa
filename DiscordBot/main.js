require('dotenv').config();
const Discord = require('discord.js'),  // Discord libraries
    ffmpeg = require('ffmpeg-static'),
    FS = require('fs'),                 // File, folder, datasteam
    shell = require('shelljs'),         // Windows command prompt
    ytdl = require('ytdl-core'),        // YouTube stream
    NodeID3 = require('node-id3'),      // mp3 tag libraries
    fetch = require('node-fetch');


const Audio = require('./audio.js'); // departed
const Test = require('./lucieTest.js');
    Audio2 = require('./audiov2.js'),
    Tools = require('./tools.js'),
    RP = require('./rp.js'),
    Theresa = require('./Theresa.js'),
    Help = require('./help.js'),
    YouTubeMgr = require('./YouTubeMgr.js'),
    EliteDangerous = require('./eliteDangerous.js'),
    Test = require('./lucieTest');


const client = new Discord.Client();
const prefix = 't!'; // All orders are going to have to start with this

var servers = []; // Structure for all server. Watch at Theresa.objectGenerator()
var changeStatus = true;

var selectedActivity = 0;
var clientActivity = [
    `t!help`,
    `Waiting for your order`,
    `t!help`,
    `t!a eternal anamnesis`
];

var AlphaDragons = {user : Discord.Client};
var Ruiseki = {user : Discord.Client};
var Krauhos = {user  : Discord.Client};

client.once('ready', () => {
    console.log(`### Powering...`);
    // channel = client.channels.cache.find(channel => channel.name === "hangars");
    getUser(AlphaDragons,'383156218862239744');
    getUser(Krauhos,'407160503912103937');
    getUser(Ruiseki,'606684737611759628');

    // démarrage et restauration des sauvegardes

    Theresa.boot(client,servers)

    console.log(`### Online`);
})

client.on('guildCreate',(guild) => { // creating folder for storing many informations about user, channel and voiceChannel
    FS.mkdirSync(`./Servers/${guild.id}`);
    FS.mkdirSync(`./Servers/${guild.id}/userOption`);
    FS.writeFileSync(`./Servers/${guild.id}/queueSave.tsave`,'');
    FS.writeFileSync(`./Servers/${guild.id}/ServerInfo.tsave`,'');
    
    Theresa.specialChannelCreation(guild)
});

client.on('guildDelete',(guild) => { // deleting folder
    FS.unlinkSync(`./Servers/${guild.id}/queueSave.tsave`);
    FS.unlinkSync(`./Servers/${guild.id}/ServerInfo.tsave`);
    FS.rmdirSync(`./Servers/${guild.id}/userOption`);
    FS.rmdirSync(`./Servers/${guild.id}`);
});

client.on('presenceUpdate',(oldStatus,newStatus) => { // Wiil be executed when a user change his status (connected, disconnected, DnD...)
    // just for DM friend when somebody is online. *** THIS FUNCTION MUST BE GENERALISED ****

    var member;
    if(newStatus) member = newStatus.member;

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

client.on('message', message => { // Will be executed when a message is emit
    
    if(message.guild !== null) // if the message is in a guild
    {
        if(servers[message.guild.id] === undefined) // if the server is not declared in the server structur
        {
            Theresa.objectGenerator(servers,message.guild.id);
        }
        
        servers[message.guild.id].global.lastTextChannelID = message.channel.id; // write the information of the text channel.

        mots = message.content.split(/ +/);

        for(mot of mots) // DM custom alerte
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

    if(message.content.toLocaleLowerCase === 'theresa' || message.content.startsWith(`<@!${client.user.id}>`)) // if the message is "theresa" of @Theresa
    {
        message.channel.send(`Ohayō *${message.author.username}*,`
        +` I'm ready to serv you. Send **t!help** to view all my command !`);
    }
    
    
    if(!message.content.startsWith(prefix)) return; // if the message doesnt start with the prefix, exit. The reste of the code is for the commands
    
    
    /* ---------- BOT COMMAND ---------- 
    
        new command :    
        [prefix][type]    [command]    [arguments]

        old command :
        [prefix][command]    [arguments]
    */

    
    // New command


    let type, command;
    const newArgs = message.content.slice(prefix.length).split(/ +/);               // delete the prefix and split all word of message
    type = newArgs.shift().toLocaleLowerCase();                                     // the first word will be the TYPE
    if(newArgs[0] != undefined) command = newArgs.shift().toLocaleLowerCase();      // The next word the COMMAND, and the reste the ARGUMENTS

    /*


        ---------- HOW MY BOT COMMANDS WORK ? ----------



        Each class have a "cmd" method. To use the class, just call the cmd method and give to him the command and the argument.
        The cmd method will call the other methode

        Exemple : t!audio queue clear

        Main => 
        TYPE = audio, so we call the cmd of the class "Audio"

        Audio =>
        The cmd see the command "queue", so he will will call Audio.queue

        Audio.queue =>
        The methode do something with the argument "clear"
    */

    if(type == 'a' || type == 'audio')
    {
        Audio2.cmd(servers[message.guild.id],prefix,command,newArgs,message);
        return;
    }

    if(type == 'ed' || type == 'elite '|| type == 'elitedangerous')
    {
        EliteDangerous.cmd(servers[message.guild.id],message,command,newArgs);
        return;
    }
    
    // ---------- TEST AREA ----------

    if(type == 'enter' || type == 'e')
    {
        Test.randomnum(command, message);
        return;
    }

    //---------- ---------- ----------


    // old command (need update)
    
    const args = message.content.slice(prefix.length).split(/ +/); // arguments. Contient au début le type, la commande, et les arguments d'une commande complète.
    // type = args.shift().toLocaleLowerCase(); // séparation du type
    command = args.shift().toLocaleLowerCase(); // séparation de la commande
    
    if(Tools.cmd(servers[message.guild.id],command,message,args,client,Audio2,Theresa)) return;
    
    else if(Theresa.cmd(servers,command,client,message,args,Audio)) return;
    
    else if(RP.cmd(servers[message.guild.id],message,command,args)) return;

    else if(Help.cmd(command,prefix,message,args)) return;
    
    else
    {
        message.channel.send(`Dear ${message.author.username}, I don't know this command. Try **t!help** for watch list of my available commands. If a command is weird or if you think a command is missing, tell **__Ruiseki__**.`);
        message.delete();
    }
    

    //---------------------------------------------------------------------------------------------------------------------------------------------------//
    //---------------------------------------------------------------------------------------------------------------------------------------------------//
});

client.on('voiceStateUpdate',(oldState,newState) => { // will be call when a user change his state in a voice channel (join, leave, mute, unmute...)

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

    if(newState.channel != null && oldState.channel != newState.channel) // Custom alerte for the voice channel (a very complexe thing. Probable a gaz factory with spaghetti code)
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

client.on('guildMemberSpeaking',(member,speaking) => { // will be executed when a member speak.
    if(speaking.bitfield == 1) {}
    else if(speaking.bitfield == 0) {}
    else {}
});

async function getUser(userReturn,id) // useless
{
    userFound = await client.users.fetch(id, {cache : true}).then(user => userReturn.user = user);
    //console.log(`Found ${userFound.tag}`);
}

setInterval(function() { // each 10sec, change the activity of the bot (playing at : [message] in discord)
    client.user.setActivity(clientActivity[selectedActivity]);
    selectedActivity++;
    if(selectedActivity == clientActivity.length) selectedActivity = 0;
}, 10000);

setInterval(function() { // each minutes, check the last update, and download data

    //gestionnaire des téléchargement auto

    if(Date.now() >= Number.parseInt(FS.readFileSync('./elite/lastcheck.tsave','utf8'))+7200000) EliteDangerous.downloadData(); // 7200000ms = 2h
    
},60000);

try // log the bot if internet is available
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