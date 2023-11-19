import { joinVoiceChannel, createAudioPlayer } from '@discordjs/voice';
import dotenv from 'dotenv';
import Discord, { REST } from 'discord.js';
import FS from 'fs';
import DNS from 'dns';
import shelljs from 'shelljs';
import packageInfo from '../package.json' assert { type : 'json'};
import commandsFile from './json/commands.json' assert { type : 'json'};

import { clearMessagesTemps, eventsListeners, runAudioEngine } from './audio.mjs';
import { clearLogs, findChannel, findUserId, isElementPresentInArray, simpleEmbed } from './tools.mjs';

dotenv.config();
export var client;
export var servers = [];
export var prefix = 't!';
export var isConnected = false, previousNetworkState = null, login = false;
export var button = {
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
};
export var storageLocation = '../storage';

// client intents
client = new Discord.Client({
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
});

/*
 *   +----------------------------+
 *   |       MAIN FUNCTION        |
 *   +----------------------------+
 */

export async function startup()
{
    console.log('----- Waking up -----');

    // checklist

    // internet access
    console.log('\tNetwork access ...');
    if( !await checkInternetConnection() )
    {
        console.log('\t\t❌ Connection test failed. Retrying in 10 sec');
        let connectionTest = () => {
            return new Promise((resolve) => {
                let loopId = setInterval(async () => {
                    if( await checkInternetConnection() )
                    {
                        clearInterval(loopId);
                        resolve(true);
                    }
                    else
                        console.log('\t\t❌ Connection test failed. Retrying in 10 sec');
                }, 10000);
            });
        }

        await connectionTest();
    }
    console.log('\t\t✅ Connection test passed');

    // api access
    console.log('\tAPI access...');
    if( !await checkApiAccess() )
    {
        console.log('\t\t❌ API test failed. Retrying in 10 sec');
        let apiTest = () => {
            return new Promise((resolve) => {
                let loopId = setInterval(async () => {
                    if( await checkApiAccess() )
                    {
                        clearInterval(loopId);
                        resolve(true);
                    }
                    else
                        console.log('\t\t❌ API test failed. Retrying in 10 sec');
                }, 10000);
            });
        }

        await apiTest();
    }
    console.log('\t\t✅ API test passed');

    // login
    console.log('\tLogin ...');
    await client.login(process.env.key)
    .then(() => console.log('\t\t✅ Login successful'));

    // storage access and structure
    console.log('\tStructure...');
    let result = checkStorage();
    if(result.edited)
    {
        console.log('\t\tMissing folders/files has been detected and successfully created :');
        result.editedFolder.forEach(detail => console.log(`\t\t\t${detail}`));
    }
    console.log('\t\t✅ Structure check completed');

    // status
    // bot status variables
    let changeStatus = true; // use to cycle the status of the bot. Usually on true
    let selectedActivity = 0;
    let clientActivity = [
        `/play [title]`,
        `Version : ${packageInfo.version}`
    ];
    console.log('\tBot status...');
    setInterval(() => {
        if(changeStatus)
        {
            selectedActivity = selectedActivity % clientActivity.length;
            client.user.setActivity(clientActivity[selectedActivity]);
            selectedActivity++;
        }
    }, 10000);
    console.log('\t\t✅ Bot status set');

    console.log('----- Initialisation completed -----');
}

export function load()
{
    console.log('----- Loading -----');
    client.guilds.cache.each(guild => {
        console.log(`\t${guild.name}`);
        servers[guild.id] = objectGenerator(guild.id);
        if( !FS.existsSync(`${storageLocation}/discordServers/${guild.id}/${guild.id}.json`) )
            FS.writeFileSync(`${storageLocation}/discordServers/${guild.id}/${guild.id}.json`, '');
        else servers[guild.id] = JSON.parse(FS.readFileSync(`${storageLocation}/discordServers/${guild.id}/${guild.id}.json`, "utf-8"));
        servers[guild.id].global.guild = guild;

        //check admin
        let index = servers[guild.id].global.adminList.findIndex(value => {
            if(value == guild.ownerId) return value;
        });
        
        if(index == -1)
        {
            console.log(`\t\t❗ Adding the guild owner in the admin list (was not in).`);
            servers[guild.id].global.adminList.push(guild.ownerId);
        }
        
        //voiceChannel reconnection
        if(servers[guild.id].global.lastVoiceChannelId != null)
        {
            let channel = guild.channels.cache.get(servers[guild.id].global.lastVoiceChannelId);
            try
            {
                joinVoice(servers[guild.id], channel);
                console.log(`\t\t✅ Joining the voice channel ${channel.name}`);
            }
            catch(err)
            {
                console.error(`\t\t❌ Can't rejoin the voice channel ${channel.name}`);
            }
        }
        
        //rejoining Ruiseki in voice channel
        if(servers[guild.id].global.lastVoiceChannelId == null)
        {
            servers[guild.id].global.guild.channels.cache.each(channel => {
                if(channel.isVoiceBased())
                {
                    channel.members.each(member => {
                        if(member.id == '606684737611759628')
                        {
                            joinVoice(servers[guild.id], channel);
                            console.log(`\t\t✅ Joining Ruiseki in the voice channel ${channel.name}`);
                        }
                    });
                }
            });
        }
        
        //Audio
        servers[guild.id].audio.Engine = createAudioPlayer();
        eventsListeners(servers[guild.id]);
        clearMessagesTemps(servers[guild.id], guild);
        if(servers[guild.id].audio.playing) runAudioEngine(servers[guild.id], guild);
        
        serverSave(servers[guild.id]);
    });
    console.log(`----- Loading completed -----`);
}

export function cmd(message, type, command, args)
{
    message.delete();

    args.splice(0, 0, command);
    command = type;

    if(command.startsWith('!'))
    {
        command = command.substring(1);
        adminCommand(command, args, message);
    }
    else mainCommandMgr(command, args, message);
}

/*
 *   +----------------------------+
 *   |     COMMAND MANAGEMENT     |
 *   +----------------------------+
 */

function adminCommand(command, args, message)    
{
    let isAdmin = false;
    let server = servers[message.guildId];
    server.global.adminList.forEach(userId => isAdmin = message.author.id == userId ? true : false );

    if(isAdmin)
    {
        switch(command)
        {
            case 'clear':
                clear(servers[message.guildId], message, args);
                break;
                offline(server, message);
                break;
            case 'admin':
                adminMgr(server, message, args);
                break;
            case 'reset':
                reset(message, args);
                break;
            case 'leaveserver':
                leaveServer(message);
                break;

            default:
                if(message.author.id == '606684737611759628');
                
                switch(command)
                {
                    case 'clearlogs':
                        clearLogs();
                        break;
                    case 'devreport':
                        DevReport(message);
                        break;
                    case 'rns':
                    case 'restartnextsong':
                        restartNextSong(server);
                        break;
                    case 'arns':
                    case 'abortrestartnextsong':
                        abortRestartNextSong(server);
                        break;
                    case 'r':
                    case 'restart':
                        restart();
                        break;
                    case 'online':
                        online();
                        break;
                    case 'offline':
                        offline();
                        break;
                    case 'test':
                }
        }

        serverSave(servers[message.guildId]);
    }
    else
    {
        message.channel.send(`You don't have acces to admin commands.`)
        .then(msg => {
            setTimeout(function() {
                msg.delete();
            }, 10000);
        });
    }
}

function mainCommandMgr(command, args, message)
{
    switch(command)
    {
        case 'join':
            joinVoice(servers[message.guildId], message.member.voice.channel);
            break;
        case 'leave':
            leaveVoice(servers[message.guildId]);
            break;
        case 'm':
        case 'moveuser':
            moveAllUser(servers[message.guildId], message, args);
            break;
        case 'tv':
        case 'trackvoice':
            trackingVoice(servers[message.guildId], message.channel, message.author, args);
            break;
        case 'cleardm':
            clearDM(servers[message.guildId], message);
            break;
        default:
            simpleEmbed(servers[message.guildId],message.channel,'**❌ Unknown command**',undefined,false,true,5000);
    }
}

/*
 *   +----------------------------+
 *   |          CHECKS            |
 *   +----------------------------+
 */

function checkStorage()
{
    let info = {
        edited : false,
        editedFolder : []
    }
    let clientServersIdList = [];
    client.guilds.cache.each(guild => clientServersIdList.push(guild.id));

    if( !FS.existsSync(`${storageLocation}/discordServers`) )
    {
        FS.mkdirSync(`${storageLocation}/discordServers`);
        info.edited = true;
        info.editedFolder.push('Servers data');
        clientServersIdList.forEach(guildId => {
            FS.mkdirSync(`${storageLocation}/discordServers/${guildId}`);
            info.editedFolder.push(`Server ${guildId} data folder`);
        });
    }
    if( !FS.existsSync(`${storageLocation}/discordServersBackup`) )
    {
        FS.mkdirSync(`${storageLocation}/discordServersBackup`);
        info.edited = true;
        info.editedFolder.push('Servers backup');
        clientServersIdList.forEach(guildId => {
            FS.mkdirSync(`${storageLocation}/discordServersBackup/${guildId}`);
            info.editedFolder.push(`Server ${guildId} backup folder`);
        });
    }
    if( !FS.existsSync(`${storageLocation}/audio`) )
    {
        FS.mkdirSync(`${storageLocation}/audio`);
        info.edited = true;
        info.editedFolder.push('Audio folder');
    }

    let existingFolder = FS.readdirSync(`${storageLocation}/discordServers`);
    let existingBackupFolder = FS.readdirSync(`${storageLocation}/discordServersBackup`);
    clientServersIdList.forEach(guildId => {
        if (!existingFolder.find(element => element == guildId))
        {
            FS.mkdirSync(`${storageLocation}/discordServers/${guildId}`);
            info.edited = true;
            info.editedFolder.push(`Server ${guildId} data folder`);
        }
        if (!FS.existsSync(`${storageLocation}/discordServers/${guildId}/${guildId}.json`))
        {
            FS.writeFileSync( `${storageLocation}/discordServers/${guildId}/${guildId}.json`, JSON.stringify(objectGenerator(guildId)) );
            info.edited = true;
            info.editedFolder.push(`Server ${guildId} data file`);
        }

        if (!existingBackupFolder.find(element => element == guildId))
        {
            FS.mkdirSync(`${storageLocation}/discordServersBackup/${guildId}`);
            info.edited = true;
            info.editedFolder.push(`Server ${guildId} backup folder`);
        }
    });

    if (!FS.existsSync(`${storageLocation}/discordServersBackup/lastBackup.ttime`))
    {
        FS.writeFileSync(`${storageLocation}/discordServersBackup/lastBackup.ttime`, '0');
        info.edited = true;
        info.editedFolder.push(`Server backup time file`);
    }
    
    return info;
}

function checkInternetConnection()
{
    return new Promise((resolve, error) => {
        DNS.resolve('www.google.com', err => {
            if(err) // no internet (or no google, but less likely to happen)
                error(err);
            else // internet available
                resolve(true);
        });
    });
}

async function checkApiAccess()
{
    return await fetch(`http://${process.env.apiUrl}:${process.env.apiPort}/check`)
    .then(result => {
        switch(result.status)
        {
            case 200:
                return true;
            case 500:
            case 400:
            default:
                return false;
        }
    })
    .catch(err => {
        return false;
    });
}

/*
 *   +----------------------------+
 *   |          STORAGE           |
 *   +----------------------------+
 */

export function serverSave(server)
{
    // if we do var data = servers[guild.id], data will be a reference to servers[guild.id]
    // so we made backup to restor the data
    let voiceConnectionBackup = server.global.voiceConnection;
    let guildBackup = server.global.guild;
    let engineBackup = server.audio.Engine;
    let resourceBackup = server.audio.resource;

    server.global.voiceConnection = null;
    server.global.guild = null;
    server.audio.Engine = null;
    server.audio.resource = null;
    
    FS.writeFileSync(`${storageLocation}/discordServers/${server.global.guildId}/${server.global.guildId}.json`, JSON.stringify(server));
    
    server.global.voiceConnection = voiceConnectionBackup;
    server.global.guild = guildBackup;
    server.audio.Engine = engineBackup;
    server.audio.resource = resourceBackup;
}

export function serversBackup()
{
    client.guilds.cache.each(guild => {
        let voiceConnectionBackup = servers[guild.id].global.voiceConnection;
        let guildBackup = servers[guild.id].global.guild;
        let engineBackup = servers[guild.id].audio.Engine;
        let resourceBackup = servers[guild.id].audio.resource;

        servers[guild.id].global.voiceConnection = null;
        servers[guild.id].global.guild = null;
        servers[guild.id].audio.Engine = null;
        servers[guild.id].audio.resource = null;

        FS.writeFileSync(`${storageLocation}/discordServersBackup/${guild.id}/${Date.now()}.json`, JSON.stringify(servers[guild.id]));

        servers[guild.id].global.voiceConnection = voiceConnectionBackup;
        servers[guild.id].global.guild = guildBackup;
        servers[guild.id].audio.Engine = engineBackup;
        servers[guild.id].audio.resource = resourceBackup;
    });
}

function resetServer(guild)
{
    if(FS.existsSync(`${storageLocation}/discordServers/${guild.id}/${guild.id}.json`))
    {
        FS.rmSync(`${storageLocation}/discordServers/${guild.id}/${guild.id}.json`);
    }

    servers[guild.id] = objectGenerator(guild.id);

    serverSave(servers[guild.id]);
}

function createServerFile(guild)
{
    FS.mkdirSync(`../storage/discordServers/${guild.id}`);
    FS.mkdirSync(`../storage/discordServers Backup/${guild.id}`);
}

function deleteServerFile(guild)
{
    
}

/*
 *   +----------------------------+
 *   |  BOT FEATURES (NON ADMIN)  |
 *   +----------------------------+
 */

export function joinVoice(server, channel)
{
    server.global.voiceConnection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guildId,
        adapterCreator: channel.guild.voiceAdapterCreator
    });
}

export function leaveVoice(server)
{
    server.global.voiceConnection.destroy();
}

function moveAllUser(server, message, args)
{
    if(!args[0])
    {
        message.channel.send('[...]');
        return;
    }

    let destChannel = findChannel(server, args[0]);
    
    if(destChannel == undefined)
    {
        message.channel.send('[...]');
        return;
    }

    if(destChannel.type != 2) // 2 = voice channel
    {
        message.channel.send('[...]');
        return;
    }

    message.member.voice.channel?.members.each(member => {
        member.voice.setChannel(destChannel);
    });
}

export async function trackingVoice(server, channel, userAuthor, args)
{
    let user = userProfileCheck(server, userAuthor.id);

    if(!args[0])
    {
        // short help page
    }
    else if(args[0] == 'e' || args[0] == 'enable')
    {
        if(user.voiceTracking.isActivated) simpleEmbed(server, channel, '**Already enable ℹ**', undefined, false, true, 2000)
        else
        {
            user.voiceTracking.isActivated = true;
            simpleEmbed(server, channel, '**✅ Alert enable**', undefined, false, true, 2000);
        }
    }
    else if(args[0] == 'd' || args[0] == 'disable')
    {
        if(!user.voiceTracking.isActivated) simpleEmbed(server, channel, '**Already disable ℹ**', undefined, false, true, 2000)
        else
        {
            user.voiceTracking.isActivated = false;
            simpleEmbed(server, channel, '**✅ Alert disabled**', undefined, false, true, 2000)
        }
    }
    else if(args[0] == 's' || args[0] == 'status')
    {
        let text = `**${userAuthor.username}, here is your voice tracking status**\n\n`;

        if(user.voiceTracking.isActivated) text += '**✅ Service is ON**';
        else text += '**❎ Service is OFF**';
        text += '\n\n';

        let arrayOfObject = [];

        user.voiceTracking.usersAndChannels.forEach(userAndChannel => {
            userAndChannel.channelsId.forEach(channelId => {
                let index = -1;
                arrayOfObject.forEach((channelObject, i) => { // selecting the index
                    if(channelObject.id == channelId) index = i;
                });

                if(index == -1)
                {
                    arrayOfObject.push({
                        "id":channelId,
                        "usersId":[]
                    });
                    index = arrayOfObject.length - 1;
                }

                arrayOfObject[index].usersId.push(userAndChannel.userId);
            });
        });

        for(let object of arrayOfObject)
        {
            let trackingChannel = server.global.guild.channels.cache.get(object.id);
            text += `**${trackingChannel.name}**\n`;
            for(let userId of object.usersId)
            {
                let member = server.global.guild.members.cache.get(userId);
                text += `${member.user.username}\n`;
            }
            text += '\n';
        }

        text += '**👍 You have allowed : \n**';

        for(let allowedUserId of user.voiceTracking.allowedUsers)
        {
            let allowedMember = server.global.guild.members.cache.get(allowedUserId);
            text += `${allowedMember.user.username}\n`
        }

        if(user.voiceTracking.statusMessageId != null)
        {
            let dmChannel = await userAuthor.createDM();
            dmChannel.messages.cache.get(user.voiceTracking.statusMessageId)?.delete();
        }

        userAuthor.send({
            embeds: [
                {
                    color: '000000',
                    description: text
                }
            ]
        }).then(msg => {
            user.voiceTracking.statusMessageId = msg.id
            msg.pin();
            serverSave(server);
        });
    }
    else if(args[0] == 'a' || args[0] == 'add' || args[0] == 'r' || args[0] == 'remove')
    {
        var isRemoving = false;
        if(args[0] == 'r' || args[0] == 'remove') isRemoving = true;

        // get the targeted user (can be all members of the guild if the user is removing users)
        if(!args[1])
        {
            // short help page
            return;
        }
        else
        {
            var targetUserId = findUserId(args[1], server.global.guild);

            if(targetUserId == undefined)
            {
                simpleEmbed(server, channel, '**❌ Unknown user**', undefined, false, true, 10000);
                return;
            }
            else if(targetUserId == userAuthor.id)
            {
                simpleEmbed(server, channel, '**❌ You can\'t add yourself !**', undefined, false, true, 10000);
                return;
            }
        }

        var targetChannel;
        if(!args[2] && !isRemoving) // the the targeted channel (can be nothing is removing)
        {
            // short help page
            return;
        }
        else
        {
            if(targetChannel == undefined && !isRemoving)
            {
                targetChannel = findChannel(server, args[2]);
                if(targetChannel == undefined)
                {
                    simpleEmbed(server, channel, '**❌ Unknown voice channel**', undefined, false, true, 10000)
                    return;
                }
            }
        }

        let targetUserIndex = user.voiceTracking.usersAndChannels.findIndex(value => {
            if(value.userId == targetUserId) return value;
        });

        if(targetUserIndex == -1)
        {
            user.voiceTracking.usersAndChannels.push({
                "userId": targetUserId,
                "lastDM": 0,
                "channelsId": []
            });
            targetUserIndex = user.voiceTracking.usersAndChannels.length - 1;
        }

        let targetUser = user.voiceTracking.usersAndChannels[targetUserIndex];

        if(!isRemoving)
        {
            let targetChannelIndex = targetUser.channelsId.findIndex(value => {
                if(value == targetChannel.id) return value;
            });

            // Dernièrement : Remplacement des variable voice et index, et amélioration visuel (avec targetUser par exemple)

            if(targetChannelIndex == -1) targetUser.channelsId.push(targetChannel.id);
            else
            {
                simpleEmbed(server, channel, '**❗ Channel already added for this user**', undefined, false, true, 10000);
                return;
            }
            
            let targetMember = server.global.guild.members.cache.get(targetUserId);
            let authorMember = server.global.guild.members.cache.get(userAuthor.id);
            let targetProfile = userProfileCheck(server, targetMember.user.id);

            if( targetProfile.voiceTracking.allowedUsers.indexOf(authorMember.user.id) == -1 &&
                user.voiceTracking.usersAndChannels[targetUserIndex].lastDM + 5 * 60 * 1000 <= Date.now()
                )
            {
                if(!targetMember.user.bot)
                {
                    let row = new Discord.ActionRowBuilder()
                    .addComponents(
                        button.voiceTracking.accept,
                        button.voiceTracking.refuse
                    );

                    targetMember.user.send({
                        embeds: [
                            {
                                color:'000000',
                                description:`***${authorMember.user.username}*** want to know when you are connected to a voice channel.`,
                                title:`Authorization for voice tracking (from ${authorMember.user.username} in ${server.global.guild.name})`,
                                thumbnail: {
                                    url: authorMember.user.avatarURL()
                                }
                            }
                        ],
                        components: [row]
                    });
                    user.voiceTracking.usersAndChannels[targetUserIndex].lastDM = Date.now();
                    servers[0].client.on('interactionCreate', i => {
                        if( !i.isButton() ) return;

                        if(i.customId == 'accept')
                        {
                            i.message.delete();
                            targetProfile.voiceTracking.allowedUsers.push(userAuthor.id);
                        }
                        else if(i.customId == 'refuse') i.message.delete();

                        serverSave(server);
                    });
                }
                else if(targetProfile.voiceTracking.allowedUsers.indexOf(userAuthor.id) == -1) targetProfile.voiceTracking.allowedUsers.push(userAuthor.id);
            }

            simpleEmbed(server, channel, `**✅ Added __${targetMember.user.username}__ in the voice channel __${targetChannel.name}__**`, undefined, false, true, 10000);
        }
        else
        {
            if(targetUserIndex == -1)
            {
                simpleEmbed(server, channel, '**❌ Can\'t find this user in your list. Type `t!trackvoice status` to see your list**', undefined, false, true, 30000);
                return;
            }

            let targetMember = server.global.guild.members.cache.get(targetUserId);

            if(targetChannel == undefined)
            {
                user.voiceTracking.usersAndChannels.splice(targetUserIndex, 1);
                simpleEmbed(server, channel, `**✅ Deleted the user ${targetMember.user.username} from your list**`, undefined, false, true, 10000);
            }
            else
            {
                let targetChannelIndex = user.voiceTracking.usersAndChannels[targetUserIndex].channelsId.indexOf(targetChannel.id);
                if(targetChannelIndex == -1) simpleEmbed(server, channel, '**❌ Can\'t find the channel for this user in your list. Type `t!trackvoice status` to see your list**', undefined, false, true, 30000);
                else
                {
                    user.voiceTracking.usersAndChannels[targetUserIndex].channelsId.splice(targetChannelIndex, 1);
                    simpleEmbed(server, channel, `**✅ Deleted the channel ${targetChannel.name} for the user ${targetMember.user.username}**`);
                }
            }
        }
    }
    else if(args[0] == 'al' || args[0] == 'allow')
    {
        let targetUserId = findUserId(args[1], server.global.guild);
        if(targetUserId == undefined)
        {
            // user not found
            return;
        }
        else
        {
            if(targetUserId == userAuthor.id)
            {
                simpleEmbed(server, channel, '**❌ You can\'t allow yourself !**', undefined, false, true, 10000);
                return;
            }
            else if(!isElementPresentInArray(user.voiceTracking.allowedUsers, targetUserId))
            {
                let targetMember = server.global.guild.members.cache.get(targetUserId);
                user.voiceTracking.allowedUsers.push(targetUserId);
                simpleEmbed(server, channel, `**✅ Allowed ${targetMember.user.username}**`, undefined, false, true, 10000);
            }
            else simpleEmbed(server, channel, '**❗ User already allowed !**', undefined, false, true, 10000);;
        }
    }
    else if(args[0] == 'rev' || args[0] == 'revoke')
    {
        let targetUserId = findUserId(args[1], server.global.guild);
        if(targetUserId == undefined)
        {
            simpleEmbed(server, channel, '**❌ The user doesn\'t exist**', undefined, false, true, 10000);
            return;
        }
        else
        {
            let targetUserIndex = user.voiceTracking.allowedUsers.indexOf(targetUserId);
            if(targetUserIndex != -1)
            {
                let targetMember = server.global.guild.members.cache.get(targetUserId);
                user.voiceTracking.allowedUsers.splice(targetUserIndex, 1);
                simpleEmbed(server, channel, `**✅ Revoked ${targetMember.user.username}**`, undefined, false, true, 10000);
            }
            else simpleEmbed(server, channel, '**❌ Can\'t find this user in your list. Type `t!trackvoice status` to see your list**', undefined, false, true, 10000);
        }
    }

    serverSave(server);
}

async function clearDM(server, message)
{
    let user = userProfileCheck(server, message.author.id);
    user.voiceTracking.statusMessageId = null;

    var DMchannel = await message.author.createDM();
    DMchannel.messages.fetch({ limit: 100 })
    .then(messages => {
        var text = messages.filter(m => (m.author = server.global.guild.client.user));
        console.log(`${text.size} message(s) have been deleted`);
        text.forEach(m => m.delete());
    })

    serverSave(server);
}

/*
 *   +----------------------------+
 *   |    BOT FEATURES (ADMIN)    |
 *   +----------------------------+
 */

function clear(server, message, args)
{
    var nbr;
    if(!args[0]) nbr = 100;
    else
    {
        nbr = Number.parseInt(args[0]);
        if(Number.isNaN(nbr))
        {
            message.channel.send('[...]');
            return;
        }
        nbr++;
        if(nbr < 0) nbr *= -1;
        if(nbr > 100) nbr = 100;
    }

    let messageToDelete = [];
    message.channel.messages.fetch({limit:nbr})
    .then(messages => {
        var filtredMessages = messages.filter(m => Date.now() - m.createdTimestamp < 1209600000); // 1209600000 = 14 days
        filtredMessages.forEach(m => {
                if(server.audio.lastQueue.messageId != null)
                {
                    if(server.audio.lastQueue.messageId == m.id)
                    {
                        server.audio.lastQueue.messageId = null;
                        server.audio.lastQueue.channelId = null;
                    }
                }
                else
                {
                    for(let i = 0; i < server.global.messageTemp.length; i++)
                    {
                        if(m.id == server.global.messageTemp[i].messageId)
                        {
                            server.global.messageTemp.splice(i, 1);
                            break;
                        }
                    }
                }
                messageToDelete.push(m);
            });
        message.channel.bulkDelete(messageToDelete, true);
        serverSave(server);
        });
}

function adminMgr(server, message, args)
{
    if(!args[0])
    {
        // short help page
    }
    else if(args[0] == 'add' || args[0] == 'a')
    {
        let targetUser = message.guild.members.cache.get(findUserId(args[1], server.global.guild));
        if(targetUser == undefined)
        {
            // user not found
            return;
        }
        let index = server.global.adminList.findIndex(value => {
            if(value == targetUser.id) return value;
        });
        if(index == -1)
        {
            server.global.adminList.push(targetUser.id);
            simpleEmbed(server, message.channel, `***${targetUser.user.username}*** was added to the admin list ✅`, undefined, false, true, 3000);
        }
        else
        {
            simpleEmbed(server, message.channel, `***${targetUser.user.username}*** is already admin`, undefined, false, true, 3000);
        }
    }
    else if(args[0] == 'remove' || args[0] == 'r')
    {
        let targetUser = message.guild.members.cache.get(findUserId(args[1], server.global.guild));
        if(targetUser == undefined)
        {
            // user not found
            return;
        }
        let index = server.global.adminList.findIndex(value => {
            if(value == targetUser.id) return value;
        });

        if(targetUser.id == server.global.guild.ownerId)
        {
            simpleEmbed(server, message.channel, `Server owner (***${targetUser.user.username}***) can't be deleted from the administrator list ❌`, undefined, false, true, 5000);
        }
        else if(index != -1)
        {
            server.global.adminList.splice(index, 1);
            simpleEmbed(server, message.channel, `***${targetUser.user.username}*** was added to the administrator list ✅`, undefined, false, true, 3000);
        }
        else
        {
            simpleEmbed(server, message.channel, `***${targetUser.user.username}*** is not an administrator ❌`, undefined, false, true, 3000);
        }
    }
    else if(args[0] == 'view' || args[0] == 'v')
    {
        let text = '';
        server.global.adminList.forEach(admin => {
            
        });
    }
}

function reset(message, args)
{
    if(args[0] == 'all') resetAllGuilds();
}

function leaveServer(message)
{

}

/*
*   +----------------------------+
*   |           OWNER            |
*   +----------------------------+
*/

function DevReport(message)
{
    /*
    
    write news here

    */
}

function restartNextSong(server)
{
    console.log('### Theresa will restart after this music ###');
    server.audio.restart = true;
}

function abortRestartNextSong(server)
{
    console.log('### Aborting restart ###');
    server.audio.restart = false;
}

function restart()
{
    offline();
    console.log('### Theresa has restarted ###');
    client.destroy();
    shelljs.exec('pm2 restart discordBot');
}

/*
*   +----------------------------+
*   |           OTHER            |
*   +----------------------------+
*/

function objectGenerator(guildId)
{
    return {
        global: {
            guild: null,
            guildId,
            voiceConnection: null,
            lastTextChannelId: null,
            lastVoiceChannelId: null,
            messageTemp: [],
            adminList: []
        },
        audio: {
            Engine: null,
            resource: null,
            queue: [],
            lastQueue: {
                messageId: null,
                channelId: null
            },
            lastMusicTextchannelId: null,
            currentPlayingSong: null,
            nextPlayingSong: null,
            playing:    false,
            pause:      false,
            loop:       false,
            loopQueue:  false,
            leave:      false,
            arret:      false,
            restart:    false,
        },
        users: [
            /*
            Shema of the user profile object
            {
                userId,                     // the id of the user who had activate the service
                voiceTracking: {
                    statusMessageId,
                    isActivated,            // if the voice tracking service is activated
                    allowedUsers:[],        // accepted user. Not everyone can track you
                    usersAndChannel: [
                        {
                            userId,         // id of a targeted user
                            lastDM,         // time in ms from the last DM to the targeted user
                            channelsId: []  // list of the channel for this user
                        }
                    ]
                }
            }
            */
        ]
    };
}

function userProfileCheck(server, userId)
{
    let index = server.users.findIndex(value => {
        if(value.userId == userId) return value;
    });

    if(index == -1)
    {
        server.users.push({
            userId,
            voiceTracking: {
                statusMessageId: null,
                isActivated: false,
                allowedUsers: [],
                usersAndChannels: []
            }
        });
        return server.users[server.users.length - 1];
    }
    else return server.users[index];
}

function resetAllGuilds()
{
    servers[0].client.guilds.cache.each(guild => {
        if(FS.existsSync(`../storage/discordServers/${guild.id}/${guild.id}.json`))
        {
            FS.rmSync(`../storage/discordServers/${guild.id}/${guild.id}.json`);
            servers[guild.id] = objectGenerator(guild.id);
            serverSave(servers[guild.id]);
        }
    });
}

function offline()
{
    client.user.setStatus('invisible');
}

function online()
{
    client.user.setStatus('online');
}

export async function initSlashCommand()
{
    const rest = new REST({ version : '10'}).setToken(process.env.key);
    
    await rest.put(
        Discord.Routes.applicationCommands(client.user.id),
        { body: commandsFile }
    );
}