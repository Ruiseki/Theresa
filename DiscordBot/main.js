require('dotenv').config();
const Discord = require('discord.js'),  // Discord libraries
    FS = require('fs');

const Audio = require('./audio.js'),
    Tools = require('./tools.js'),
    RP = require('./rp.js'),
    Theresa = require('./Theresa.js'),
    Help = require('./help.js'),
    EliteDangerous = require('./customServices/veritasKingdom/eliteDangerous.js'),
    CodingFactory = require('./customServices/codingFactory/coding.js');

var client = new Discord.Client({ intents: [ // The bot and what he can do
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    Discord.Intents.FLAGS.GUILD_INVITES,
    Discord.Intents.FLAGS.GUILD_VOICE_STATES,
    Discord.Intents.FLAGS.GUILD_PRESENCES,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.GUILD_MESSAGE_TYPING,
    Discord.Intents.FLAGS.DIRECT_MESSAGES,
    Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.DIRECT_MESSAGE_TYPING
]});

const prefix = 't!'; // All orders are going to have to start with this

var servers = []; // Structure for all server. Watch at Theresa.objectGenerator()
servers[0] = {
    prefix
}

var changeStatus = true;

var selectedActivity = 0;
var clientActivity = [
    `t!help`,
    `t!help`,
    `t!a [music title]`,
    `Version : BETA 0.3.1`
];

Audio.init(servers, client);

client.once('ready', () => {
    console.log(`### Powering...`);

    // Restoring data
    // Restart some services
    // Check folder
    Theresa.boot(client,servers, Audio);

    console.log(`### Online`);
})

client.on('guildCreate',(guild) => { // creating folder for storing many informations about user, channel and voiceChannel
    Theresa.createServerFile(guild);
    Theresa.objectGenerator(servers, guild.id);
});

client.on('guildDelete',(guild) => { // deleting folder
    Theresa.deleteServerFile(guild);
    servers[guild.id] = undefined;
});

client.on('presenceUpdate',(oldStatus,newStatus) => { // Will be executed when a user change his status (connected, disconnected, DnD...)
    // **** THIS FUNCTION MUST BE GENERALISED ****
});

client.on('messageCreate', message => { // Will be executed when a message is emit
    if(message.guild !== null) // if the message is in a guild
    {   
        servers[message.guild.id].global.lastTextChannelId = message.channel.id; // write the information of the text channel.

        messageWords = message.content.split(/ +/);

        for(word of messageWords)
        {
            // ping tracking DM code here
        }
    }

    if(message.content.toLocaleLowerCase() === 'theresa' || message.content.startsWith(`<@!${client.user.id}>`)) // if the message is "theresa" of @Theresa
    {
        message.channel.send(`Ohayō *${message.author.username}*,`
        +` I'm ready to serv you. Send **t!help** to view all my command !`);
    }
    

    /* 
        ----- TEST AREA -----
    */
    
    if(message.guild != null && message.guild.id == '889416369567834112') CodingFactory.checkWord(message);

    /*
        ---------------------
    */

    
    if(!message.content.startsWith(prefix)) return; // if the message doesnt start with the prefix, exit. The reste of the code is for the commands
    
    
    /* ---------- BOT COMMAND STRUCTURE ---------- 
    
        [prefix][type]    [command]    [arguments]

    */

    
    // New command


    let type, command;
    const args = message.content.slice(prefix.length).split(/ +/);  // delete the prefix and split all word of message
    type = args.shift().toLocaleLowerCase();                        // the first word will be the TYPE
    if(args[0] != undefined) command = args.shift();                // The next word the COMMAND, and the reste the ARGUMENTS

    /*


        ---------- HOW THERESA'S COMMANDS WORK ? ----------


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

    if(type == 'a' || type == 'audio') // Class for music
    {
        Audio.cmd(servers,prefix,command,args,message);
        return;
    }

    else if(type == 'ed' || type == 'elite '|| type == 'elitedangerous') // Class for elite dangerous database on discord
    {
        EliteDangerous.cmd(message,command,args);
        return;
    }

    else if(type == 'c' || type == 'code' || type == 'coding')
    {
        CodingFactory.cmd(servers[message.guild.id],message,command,args);
        return; 
    }

    else // Main Class of the bot. Contains the admin manager, the joining or leaving command, voice tracking ...
    {
        Theresa.cmd(servers, message, type, command, args, Audio);
    }
    
    // ---------- TEST AREA ----------

    //---------- ---------- ----------

    // Help obsolete
    // else if(Help.cmd(command,prefix,message,args)) return;
});

client.on('voiceStateUpdate',(oldState,newState) => { // will be call when a user change his state in a voice channel (join, leave, mute, unmute...)
    
    //---------------------------------------------//
    // Theresa will join the voice channel of his creator and leave with him if she doing nothing
    if(oldState.channel == null && newState.channel != null && newState.id == 606684737611759628 && newState.guild.me.voice.channel == null) Theresa.joinVoice(servers[newState.guild.id], newState.member.voice.channel)
    if(oldState.channel != null && newState.channel == null && newState.id == 606684737611759628 && !servers[newState.guild.id].audio.isPlaying && !servers[newState.guild.id].audio.queue[0] && newState.guild.me.voice.channel != null) Theresa.leaveVoice(servers[oldState.guild.id], Audio);
    //---------------------------------------------//

    if(newState.channel != null && newState.id == client.user.id)
    {
        servers[newState.guild.id].global.lastVoiceChannelId = newState.channel.id;
        Tools.serverSave(servers[newState.guild.id]);
    }

    if(newState.channel == null && oldState.channel != null && newState.id == client.user.id)
    {
        servers[newState.guild.id].global.lastVoiceChannelId = null;
        Tools.serverSave(servers[newState.guild.id]);
    }

    if(newState.channel != null && oldState.channel != newState.channel) // voice tracking
    {
        servers[newState.guild.id].tracking.voice.forEach(userProfile => {
            userProfile.usersAndChannels.forEach(userAndChannel => {
                if(userAndChannel.userId == newState.id)
                {
                    userAndChannel.channelsId.forEach(channelId => {
                        if(newState.channel.id == channelId)
                        {
                            let trackedUserIndex = servers[newState.guild.id].tracking.voice.findIndex(value => {
                                if(value.userId == userAndChannel.userId) return value;
                            });

                            if(trackedUserIndex == -1) return;

                            for(let allowedUserId of servers[newState.guild.id].tracking.voice[trackedUserIndex].allowedUsers)
                            {
                                if(allowedUserId == userProfile.userId)
                                {
                                    let trackedMember = newState.guild.members.cache.get(userAndChannel.userId),
                                    masterMember = newState.guild.members.cache.get(userProfile.userId),
                                    trackedChannel = newState.guild.channels.cache.get(channelId);
                                    masterMember.user.send({
                                        embeds:[{
                                            color: '#000000',
                                            title: '🔊🔎 Voice tracking notification 🔔',
                                            description: `**${trackedMember.user.username}** is in a voice channel !\n\nChannel : **${trackedChannel.name}**\nServer : **${trackedChannel.guild.name}**`,
                                            thumbnail:{
                                                url: newState.guild.iconURL()
                                            }
                                        }]
                                    });
                                }
                            }

                        }
                    });
                }
            });
        });
    }
});

client.on('guildMemberSpeaking',(member,speaking) => { // will be executed when a member speak.
    if(speaking.bitfield == 1) {}
    else if(speaking.bitfield == 0) {}
    else {}
});

/* client.on('interactionCreate', i => {
    if(!i.isButton()) return;
    
    if(i.customId == 'nextBtn')
    {
        Audio.queueMgr(servers, i.message, 'queue', ['>']);
    }
    else if(i.customId == 'previousBtn')
    {
        Audio.queueMgr(servers, i.message, 'queue', ['<']);
    }
    else if(i.customId == 'stopBtn')
    {
        Audio.queueMgr(servers, i.message, 'queue', ['clear']);
    }
    else if(i.customId == 'pausePlayBtn')
    {
        if(!servers[i.guild.id].audio.pause) Audio.engineMgr(servers, i.message, 'p', ['pause']);
        else Audio.engineMgr(servers, i.message, 'p', ['play']);
    }
}); */

setInterval(function() { // each 10sec, change the activity of the bot (playing at : [message] in discord)
    if(changeStatus)
    {
        client.user.setActivity(clientActivity[selectedActivity]);
        selectedActivity++;
        if(selectedActivity == clientActivity.length) selectedActivity = 0;
    }
}, 10000);

setInterval(function() { // each minutes,
    // check the last update, and download data
    // check the date of the last backup

    if(Date.now() >= Number.parseInt(FS.readFileSync('./Servers Backup/lastBackup.ttime', 'utf-8')) + 1000 * 60 * 60 * 24) // 24h
    {
        Tools.serversBackup(servers, client);
        FS.writeFileSync('./Servers Backup/lastBackup.ttime', Date.now().toString());
        console.log('### Server backup completed');
    }
},60000);


// Need to replace Node Fetch : doesnt work with this version of NodeJS
/* try // log the bot if internet is available
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
} */

client.login(process.env.key);

console.log('### Login : OK');