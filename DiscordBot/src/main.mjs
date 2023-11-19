import { client, initSlashCommand, joinVoice, leaveVoice, load, prefix, serverSave, servers, serversBackup, startup, storageLocation, cmd as theresaCmd, trackingVoice } from './theresa.mjs';
import { cmd as audioCmd, audioMaster, engineMgr, queueDisplay, queueMgr } from './audio.mjs';
import { readFileSync, writeFileSync } from 'fs';

startup();

client.once('ready', () => {
    initSlashCommand();
    load();
    console.log('----- Theresa is online -----');
    setInterval(makeServerBackup, 60000);
});

client.on('messageCreate', (message) => {
    if(message.guild == null) return; // no guild
    if(!message.content.startsWith(prefix)) return; // no prefix

    servers[message.guildId].global.lastTextChannelId = message.channelId; // save the channel
    serverSave(servers[message.guildId]);
    

    /*
     * COMMANDS DETAILS
     *
     * [prefix][type] [command] (args1) (args2) (argsN)
     *
     */


    const args = message.content.slice(prefix.length).split(/ +/);
    let type = args.shift().toLocaleLowerCase();
    let command = args[0] != undefined ? args.shift() : null;

    switch(type)
    {
        case 'a':
        case 'audio':
            console.log(`----- 🎵 ${servers[message.guildId].global.guild.name} 🎵 -----`);
            audioCmd(message, command, args);
            break;
        default:
            console.log(`----- ${servers[message.guildId].global.guild.name} -----`);
            theresaCmd(message, type, command, args);
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
        ) joinVoice(servers[newState.guild.id], newState.member.voice.channel)

    if(
        oldState.channel != null &&
        newState.channel == null &&
        newState.id == '606684737611759628' &&
        servers[newState.guild.id].audio.Engine._state.status != 'playing' &&
        !servers[newState.guild.id].audio.queue[0] &&
        theresaMember.voice.channel != null
        ) leaveVoice(servers[oldState.guild.id]);
    //---------------------------------------------//

    if(newState.channel != null && newState.id == client.user.id)
    {
        servers[newState.guild.id].global.lastVoiceChannelId = newState.channel.id;
        serverSave(servers[newState.guild.id]);
    }

    if(newState.channel == null && oldState.channel != null && newState.id == client.user.id)
    {
        servers[newState.guild.id].global.lastVoiceChannelId = null;
        serverSave(servers[newState.guild.id]);
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

client.on('interactionCreate', i => {

    // ----- Slash Command -----
    if(i.isCommand())
    {
        if(i.options.data[1]) i.options.data[1].value = `>>${i.options.data[1]?.value}`;

        console.log(`----- // ${servers[i.guildId].global.guild.name} // -----`);

        let array = [];
        switch(i.commandName)
        {
            case 'play' :
                servers[i.guild.id].audio.lastMusicTextchannelId = i.channelId;
                audioMaster(i.member, i.channel, i.options.data[0].value, [i.options.data[1]?.value]);
                break;
            
            case 'go' :
                engineMgr(i.channel, ['go', i.options.data[0]?.value]);
                break;
            
            case 'stop' :
                servers[i.guildId].audio.lastMusicTextchannelId = i.channelId;
                queueMgr(i.channel, ['clear']);
                break;

            case 'queue' :
                servers[i.guildId].audio.lastMusicTextchannelId = i.channelId;
                array.push(i.options.data[0].name);

                if(array[0] == 'delete') i.options.data[0].options[0].value.split(/ +/).forEach(element => array.push(element));
                else if(array[0] == 'display') array.pop();

                queueMgr(i.channel, array);
                break;

            case 'voicetracking' :
                array.push(i.options.data[0].name)
                
                if(array[0] == 'add')
                {
                    array.push(i.options.data[0].options[0].value);
                    array.push(i.options.data[0].options[1].value);
                }
                if(array[0] == 'remove' || array[0] == 'revoke')
                {
                    array.push(i.options.data[0].options[0].value);
                    if(i.options.data[0].options[1]) array.push(i.options.data[0].options[1].value);
                    else array.push(undefined);
                }

                trackingVoice(servers[i.guildId], i.channel, i.user, array);
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
        console.log(`----- [<] ${servers[i.guildId].global.guild.name} [>] -----`);
        // ----- Audio -----
        if(i.customId == 'nextBtn')             engineMgr(i.message.channel, ['skip']);
        else if(i.customId == 'previousBtn')    engineMgr(i.message.channel, ['previous']);
        else if(i.customId == 'stopBtn')        queueMgr(i.message.channel, ['clear']);
        else if(i.customId == 'pausePlayBtn')
        {
            if(servers[i.guild.id].audio.Engine._state.status == 'playing') engineMgr(i.message.channel, ['pause']);
            else engineMgr(i.message.channel, ['play']);
            queueDisplay(servers[i.guildId], 16, true);
        }
        else if(i.customId == 'viewMore')   queueDisplay(servers[i.guildId], 40, false);
        else if(i.customId == 'loop')       engineMgr(i.message.channel, ['loop']);
        else if(i.customId == 'loopQueue')  engineMgr(i.message.channel, ['loopqueue']);
        else if(i.customId == 'replay')     engineMgr(i.message.channel, ['replay']);
        // -----------------
    
        // ----- Help ------
        // else if(i.customId == 'main') Help.help(servers, i.message);
        // else if(i.customId == 'audio') Help.audioMain(servers, i.message);
        // else if(i.customId == 'queueManager') Help.audioQueueManager(servers, i.message);
        // -----------------
    
        i.deferUpdate();
    }
});

function makeServerBackup()
{
    if(Date.now() >= Number.parseInt(readFileSync(`${storageLocation}/discordServersBackup/lastBackup.ttime`, 'utf-8')) + 1000 * 60 * 60) // 1h
    {
        console.log('----- Saving data -----');
        serversBackup(servers, client);
        writeFileSync(`${storageLocation}/discordServersBackup/lastBackup.ttime`, Date.now().toString());
        console.log('\tDone');
    }
}