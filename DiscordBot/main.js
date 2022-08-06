require('dotenv').config();
const   Discord = require('discord.js'),  // Discord libraries
        FS = require('fs');

const Audio = require('./audio.js'),
    Tools = require('./tools.js'),
    RP = require('./rp.js'),
    Theresa = require('./Theresa.js'),
    Help = require('./help.js');

var client = new Discord.Client( // The bot and what he can do
    {
        intents: [
            Discord.GatewayIntentBits.Guilds,
            Discord.GatewayIntentBits.GuildMembers,
            Discord.GatewayIntentBits.GuildEmojisAndStickers,
            Discord.GatewayIntentBits.GuildInvites,
            Discord.GatewayIntentBits.GuildVoiceStates,
            Discord.GatewayIntentBits.GuildPresences,
            Discord.GatewayIntentBits.GuildMessages,
            Discord.GatewayIntentBits.GuildMessageReactions,
            Discord.GatewayIntentBits.DirectMessages,
            Discord.GatewayIntentBits.DirectMessageReactions,
            Discord.GatewayIntentBits.MessageContent
        ]
    }
);

var servers = []; // Structure for all server. Watch at Theresa.objectGenerator()

servers[0] = {
    client,
    prefix : 't!', // All orders are going to have to start with this
    isConnected: null,
    connecting: false,
    previousNetworkState: null,
    login: false,
    button: {
        audio: {
            previousBtn :  new Discord.ButtonBuilder().setCustomId('previousBtn').setLabel('⏮').setStyle('Secondary'),
            nextBtn :      new Discord.ButtonBuilder().setCustomId('nextBtn').setLabel('⏭').setStyle('Secondary'),
            pausePlayBtn : new Discord.ButtonBuilder().setCustomId('pausePlayBtn').setLabel('⏯').setStyle('Secondary'),
            stopBtn :      new Discord.ButtonBuilder().setCustomId('stopBtn').setLabel('⏹').setStyle('Secondary'),
            viewMore :     new Discord.ButtonBuilder().setCustomId('viewMore').setLabel('🔎').setStyle('Secondary'),
            loop :         new Discord.ButtonBuilder().setCustomId('loop').setLabel('🔂').setStyle('Secondary'),
            loopQueue :    new Discord.ButtonBuilder().setCustomId('loopQueue').setLabel('🔁').setStyle('Secondary'),
            replay :       new Discord.ButtonBuilder().setCustomId('replay').setLabel('⏪').setStyle('Secondary')
        },
        help: {
            main :         new Discord.ButtonBuilder().setCustomId('main').setLabel('Main Page').setStyle('Primary'),
            audio :        new Discord.ButtonBuilder().setCustomId('audio').setLabel('Audio 🎵').setStyle('Primary'),
            queueManager : new Discord.ButtonBuilder().setCustomId('queueManager').setLabel('Queue Manager 🎼').setStyle('Primary'),
            debug :        new Discord.ButtonBuilder().setCustomId('debug').setLabel('reload').setStyle('Danger')
        },
        voiceTracking: {
            accept :       new Discord.ButtonBuilder().setCustomId('accept').setLabel('Accept').setStyle('Success'),
            refuse :       new Discord.ButtonBuilder().setCustomId('refuse').setLabel('Refuse').setStyle('Danger'),
        }
    }
};

networkCheck().then(networkState => {
    servers[0].isConnected = networkState;
    servers[0].previousNetworkState = networkState;
});

var changeStatus = true;

var selectedActivity = 0;
var clientActivity = [
    `t!help`,
    `t!help`,
    `t!a [music title]`,
    `Version : BETA 0.4.5`
];

client.once('ready', () => {
    console.log(`######\tPowering...`);
    servers[0].connecting = false;
    servers[0].login = true;

    Theresa.boot(client, servers, Audio);

    console.log(`\n######\tONLINE`);
});

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

    if(message.content == `<@${client.user.id}>`) // if the message is @Theresa
    {
        Help.help(servers, message);
    }
    
    if(!message.content.startsWith(servers[0].prefix)) return; // if the message doesnt start with the prefix, exit. The reste of the code is for the commands
    
    
    /* ---------- BOT COMMAND STRUCTURE ---------- 
    
        [prefix][type]    [command]    [arguments]

    */

    
    // New command


    let type, command;
    const args = message.content.slice(servers[0].prefix.length).split(/ +/);  // delete the prefix and split all word of message
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
        Audio.cmd(servers, servers[0].prefix, command, args, message);
        return;
    }

    else if(type == 'ed' || type == 'elite '|| type == 'elitedangerous') // Class for elite dangerous database on discord
    {
        EliteDangerous.cmd(message, command, args);
        return;
    }

    // Help obsolete
    else if((type == 'help' || type == 'h' || type == 'command' || type == 'commands') && message.author.id == '606684737611759628')
    {
        Help.help(servers, message);
        return;
    }

    else // Main Class of the bot. Contains the admin manager, the joining or leaving command, voice tracking ...
    {
        Theresa.cmd(servers, message, type, command, args, Audio);
    }

});

client.on('interactionCreate', i => {
    if( !i.isButton() ) return;

    // ----- Audio -----
    if(i.customId == 'nextBtn') Audio.queueMgr(          servers, i.message, 'queue', ['skip']);
    else if(i.customId == 'previousBtn') Audio.queueMgr( servers, i.message, 'queue', ['previous']);
    else if(i.customId == 'stopBtn') Audio.queueMgr(     servers, i.message, 'queue', ['clear']);
    else if(i.customId == 'pausePlayBtn')
    {
        if(servers[i.guild.id].audio.Engine._state.status == 'playing') Audio.engineMgr(servers, i.message, 'player', ['pause']);
        else Audio.engineMgr(servers, i.message, 'player', ['play']);
        Audio.queueDisplay(servers, servers[i.guildId], 16, true);
    }
    else if(i.customId == 'viewMore') Audio.queueDisplay(   servers, servers[i.guildId], 40, false);
    else if(i.customId == 'loop') Audio.queueMgr(           servers, i.message, 'queue', ['loop']);
    else if(i.customId == 'loopQueue') Audio.queueMgr(      servers, i.message, 'queue', ['loopqueue']);
    else if(i.customId == 'replay') Audio.engineMgr(        servers, i.message, 'player', ['replay']);
    // -----------------

    // ----- Help ------
    else if(i.customId == 'main') Help.help(servers, i.message);
    else if(i.customId == 'audio') Help.audioMain(servers, i.message);
    else if(i.customId == 'queueManager') Help.audioQueueManager(servers, i.message);
    // -----------------

    i.deferUpdate();
});

client.on('voiceStateUpdate',(oldState, newState) => { // will be call when a user change his state in a voice channel (join, leave, mute, unmute...)
    
    let theresaMember = newState.guild.members.cache.get(client.user.id);

    //---------------------------------------------//
    // Theresa will join the voice channel of his creator and leave with him if she doing nothing
    if(
        oldState.channel == null &&
        newState.channel != null &&
        newState.id == '606684737611759628' &&
        theresaMember.voice.channel == null
        ) Theresa.joinVoice(servers[newState.guild.id], newState.member.voice.channel)

    if(
        oldState.channel != null &&
        newState.channel == null &&
        newState.id == '606684737611759628' &&
        servers[newState.guild.id].audio.Engine._state.status != 'playing' &&
        !servers[newState.guild.id].audio.queue[0] &&
        theresaMember.voice.channel != null
        ) Theresa.leaveVoice(servers[oldState.guild.id], Audio);
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
        servers[newState.guild.id].users.forEach(userProfile => {      // for each user profile...
            userProfile.voiceTracking.usersAndChannels.forEach(userAndChannel => {            // in each usersAndChannels object (that containt the tracked user id and all the channels for this user)
                if(userAndChannel.userId == newState.id)    // user found !
                {
                    userAndChannel.channelsId.forEach(channelId => {
                        if(newState.channel.id == channelId)    // channel found !
                        {
                            let trackedUserIndex = servers[newState.guild.id].users.findIndex(value => {   // searching the index of the tracked user to check if he has allowed the master user
                                if(value.userId == userAndChannel.userId) return value;
                            });

                            if(trackedUserIndex == -1) return;  // checking if the tracked user have a profile

                            for(let allowedUserId of servers[newState.guild.id].users[trackedUserIndex].voiceTracking.allowedUsers)
                            {
                                if(allowedUserId == userProfile.userId)     // allowed !
                                {
                                    let trackedMember = newState.guild.members.cache.get(userAndChannel.userId),
                                    masterMember = newState.guild.members.cache.get(userProfile.userId),
                                    trackedChannel = newState.guild.channels.cache.get(channelId);

                                    if(masterMember.voice.channel != undefined && masterMember.voice.channel.id == trackedMember.voice.channel.id) return; // final check, dont DM if the tracked user is in the same channel as the master user

                                    masterMember.user.send({
                                        embeds:[{
                                            color: '000000',
                                            title: '🔊🔎 Voice tracking notification 🔔',
                                            description: `**${trackedMember.user.username}** is in a voice channel !\n\nChannel : **${trackedChannel.name}**\nServer : **${trackedChannel.guild.name}**`,
                                            thumbnail:{
                                                url: newState.guild.iconURL()
                                            }
                                        }]
                                    });

                                    console.log(`######\tVoice Tracking\n\t\tDirect message send to ${masterMember.user.username} (${trackedMember.user.username} in ${trackedChannel.name} in ${trackedChannel.guild.name})`);
                                }
                            }

                        }
                    });
                }
            });
        });
    }
});

client.on('guildMemberSpeaking',(member, speaking) => { // will be executed when a member speak.
    if(speaking.bitfield == 1) {}
    else if(speaking.bitfield == 0) {}
    else {}
});

// status
setInterval(function() { // each 10 sec

    if(servers[0].isConnected && servers[0].login && changeStatus) // change the activity of the bot (playing at : [message] in discord)
        {
            client.user.setActivity(clientActivity[selectedActivity]);
            selectedActivity++;
            if(selectedActivity == clientActivity.length) selectedActivity = 0;
        }

}, 10000);

//backup
setInterval(function() {
                        // each minutes,
                        // check the last update, and download data
                        // check the date of the last backup
    
    if(Date.now() >= Number.parseInt(FS.readFileSync('./Servers Backup/lastBackup.ttime', 'utf-8')) + 1000 * 60 * 60 * 24) // 24h
    {
        Tools.serversBackup(servers, client);
        FS.writeFileSync('./Servers Backup/lastBackup.ttime', Date.now().toString());
        console.log('### Server backup completed');
    }
},60000);

// connection management
setInterval(function() {
    networkCheck().then(connectionState => {

        /* console.log(`connection state : ${connectionState}`);
        console.log(`theresa's connection : ${servers[0].isConnected}`);
        console.log(`theresa's last state : ${servers[0].previousNetworkState}\n\n`); */
    
        // login
        if(servers[0].isConnected && !servers[0].login && !servers[0].connecting)
        {
            servers[0].connecting = true;
            console.log("######\tLogin ...");
            client.login(process.env.key);
        }
    });
}, 2000);

async function networkCheck()
{
    // console.log("checking ...");
    return new Promise(result => {
        // console.log("asking the dns ...");
        require('dns').resolve('www.google.com', function(err) {
            // console.log("dns response ...");
            if(err)
            {
                if(servers[0].previousNetworkState == null || servers[0].previousNetworkState == true)
                {
                    servers[0].isConnected = false;
                    servers[0].previousNetworkState = false;
                    console.log("❌📶 Network not available.");
                }
                result(false);
            }
            else
            {
                if(servers[0].previousNetworkState == null || servers[0].previousNetworkState == false)
                {
                    servers[0].isConnected = true;
                    servers[0].previousNetworkState = true;
                    console.log("✅📶 Network available");
                }
                result(true);
            }
        });
    });
}