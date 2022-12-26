require('dotenv').config();
const   Discord = require('discord.js'),  // Discord libraries
        FS = require('fs');

const   Audio = require('./audio.js'),
        Tools = require('./tools.js'),
        // RP = require('./rp.js'),
        Theresa = require('./Theresa.js'),
        Help = require('./help.js');

const   commandsFile = require('./commands.json');

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
    prefix : 't!', // prefix for CLI utilisation
    isConnected: null,
    connecting: false,
    previousNetworkState: null,
    login: false,
    button: {
        audio: {
            previousBtn :   new Discord.ButtonBuilder().setCustomId('previousBtn').setLabel('⏮').setStyle('Secondary'),
            nextBtn :       new Discord.ButtonBuilder().setCustomId('nextBtn').setLabel('⏭').setStyle('Secondary'),
            pausePlayBtn :  new Discord.ButtonBuilder().setCustomId('pausePlayBtn').setLabel('⏯').setStyle('Secondary'),
            stopBtn :       new Discord.ButtonBuilder().setCustomId('stopBtn').setLabel('⏹').setStyle('Secondary'),
            viewMore :      new Discord.ButtonBuilder().setCustomId('viewMore').setLabel('🔎').setStyle('Secondary'),
            loop :          new Discord.ButtonBuilder().setCustomId('loop').setLabel('🔂').setStyle('Secondary'),
            loopQueue :     new Discord.ButtonBuilder().setCustomId('loopQueue').setLabel('🔁').setStyle('Secondary'),
            replay :        new Discord.ButtonBuilder().setCustomId('replay').setLabel('⏪').setStyle('Secondary')
        },
        help: {
            main :          new Discord.ButtonBuilder().setCustomId('main').setLabel('Main Page').setStyle('Primary'),
            audio :         new Discord.ButtonBuilder().setCustomId('audio').setLabel('Audio 🎵').setStyle('Primary'),
            queueManager :  new Discord.ButtonBuilder().setCustomId('queueManager').setLabel('Queue Manager 🎼').setStyle('Primary'),
            debug :         new Discord.ButtonBuilder().setCustomId('debug').setLabel('reload').setStyle('Danger')
        },
        voiceTracking: {
            accept :        new Discord.ButtonBuilder().setCustomId('accept').setLabel('Accept').setStyle('Success'),
            refuse :        new Discord.ButtonBuilder().setCustomId('refuse').setLabel('Refuse').setStyle('Danger'),
        }
    },
    commands: commandsFile
};

networkCheck().then(networkState => {
    servers[0].isConnected = networkState;
    servers[0].pnreviousNetworkState = networkState;
});

var changeStatus = true;

var selectedActivity = 0;
var clientActivity = [
    `/play [title]`,
    `Version : BETA 0.5.0`
];

client.once('ready', () => {
    console.log(`######\tPowering...`);
    servers[0].connecting = false;
    servers[0].login = true;

    Theresa.boot(client, servers, Audio);
    Theresa.initSlashCommand(servers, process.env.key);

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

    // ----- Slash Command -----
    if(i.isCommand())
    {
        if(i.options.data[1]) i.options.data[1].value = `>>${i.options.data[1]?.value}`;

        let array = [];
        switch(i.commandName)
        {
            case 'play' :
                servers[i.guild.id].audio.lastMusicTextchannelId = i.channel.id;
                Audio.audioMaster(servers, i.member, i.channel, i.options.data[0].value, [i.options.data[1]?.value]);
                break;
            
            case 'go' :
                Audio.engineMgr(servers, i.channel, ['go', i.options.data[0]?.value]);
                break;
            
            case 'stop' :
                servers[i.guild.id].audio.lastMusicTextchannelId = i.channel.id;
                Audio.queueMgr(servers, i.channel, ['clear']);
                break;

            case 'queue' :
                servers[i.guild.id].audio.lastMusicTextchannelId = i.channel.id;
                array.push(i.options.data[0].name);

                if(array[0] == 'delete') i.options.data[0].options[0].value.split(/ +/).forEach(element => array.push(element));
                else if(array[0] == 'display') array.pop();

                Audio.queueMgr(servers, i.channel, array);
                break;

            case 'voicetracking' :
                array.push(i.options.data[0].name)
                
                if(array[0] == 'add')
                {
                    array.push(i.options.data[0].options[0].value);
                    array.push(i.options.data[0].options[1].value);
                }
                if(array[0] == 'remove')
                {
                    array.push(i.options.data[0].options[0].value);
                    if(i.options.data[0].options[1]) array.push(i.options.data[0].options[1].value);
                    else array.push(undefined);
                }

                Theresa.trackingVoice(servers, servers[i.guildId], i.channel, i.user, array);
                break;
        }
        
        i.reply(
            {
                embeds : [
                    {
                        color: '000000',
                        description: '**Done ✅**',
                    }
                ],
                ephemeral : true
            }
        )
    }
    // -------------------------
    
    
    // --------- Button --------
    if( i.isButton() )
    {
        // ----- Audio -----
        if(i.customId == 'nextBtn')             Audio.engineMgr(servers, i.message.channel, ['skip']);
        else if(i.customId == 'previousBtn')    Audio.engineMgr(servers, i.message.channel, ['previous']);
        else if(i.customId == 'stopBtn')        Audio.queueMgr(servers, i.message.channel, ['clear']);
        else if(i.customId == 'pausePlayBtn')
        {
            if(servers[i.guild.id].audio.Engine._state.status == 'playing') Audio.engineMgr(servers, i.message.channel, ['pause']);
            else Audio.engineMgr(servers, i.message.channel, ['play']);
            Audio.queueDisplay(servers, servers[i.guildId], 16, true);
        }
        else if(i.customId == 'viewMore')   Audio.queueDisplay(servers, servers[i.guildId], 40, false);
        else if(i.customId == 'loop')       Audio.engineMgr(servers, i.message.channel, ['loop']);
        else if(i.customId == 'loopQueue')  Audio.engineMgr(servers, i.message.channel, ['loopqueue']);
        else if(i.customId == 'replay')     Audio.engineMgr(servers, i.message.channel, ['replay']);
        // -----------------
    
        // ----- Help ------
        else if(i.customId == 'main') Help.help(servers, i.message);
        else if(i.customId == 'audio') Help.audioMain(servers, i.message);
        else if(i.customId == 'queueManager') Help.audioQueueManager(servers, i.message);
        // -----------------
    
        i.deferUpdate();
    }
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

    // voice tracking
    if(newState.channel != null && oldState.channel != newState.channel)
    {
        // for each user profile...
        servers[newState.guild.id].users.forEach(userProfile => {
            // in each usersAndChannels object (that containt the tracked user id and all the channels for this user)
            userProfile.voiceTracking.usersAndChannels.forEach(userAndChannel => {
                // user found !
                if(userAndChannel.userId == newState.id)
                {
                    userAndChannel.channelsId.forEach(channelId => {
                        // channel found !
                        if(newState.channel.id == channelId)
                        {
                            // searching the index of the tracked user to check if he has allowed the master user
                            let trackedUserIndex = servers[newState.guild.id].users.findIndex(value => {
                                if(value.userId == userAndChannel.userId) return value;
                            });

                            // checking if the tracked user have a profile
                            if(trackedUserIndex == -1) return;

                            for(let allowedUserId of servers[newState.guild.id].users[trackedUserIndex].voiceTracking.allowedUsers)
                            {
                                // allowed !
                                if(allowedUserId == userProfile.userId)
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
    
    if(Date.now() >= Number.parseInt(FS.readFileSync('../storage/discordServersBackup/lastBackup.ttime', 'utf-8')) + 1000 * 60 * 60 * 24) // 24h
    {
        Tools.serversBackup(servers, client);
        FS.writeFileSync('../storage/discordServersBackup/lastBackup.ttime', Date.now().toString());
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