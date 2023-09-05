const   Voice = require('@discordjs/voice'),
        Discord = require('discord.js'),
        { REST } = require('@discordjs/rest'),
        FS = require('fs'),
        Tools = require('./tools.js'),
        shell = require('shelljs');
const { PermissionFlagsBits, OAuth2Scopes } = require('discord.js');

module.exports = class About
{
    static cmd(servers, message, type, command, args, Audio)
    {
        message.delete();

        Tools.addIntoArray(command, 0, args);
        command = type;

        if(command.startsWith('!'))
        {
            command = command.substring(1);
            this.adminCommand(servers, command, args, message);
        }
        else
        {
            this.mainCommandMgr(servers, command, args, message, Audio);
        }
    }

    static async initSlashCommand(servers, token)
    {
        const rest = new REST({ version : '10'}).setToken(token);
        
        await rest.put(
            Discord.Routes.applicationCommands(servers[0].client.user.id),
            { body: servers[0].commands }
        );
    }

    /*
       +----------------------------+
       |    COMMAND MANAGEMENT      |
       +----------------------------+
    */

    static adminCommand(servers, command, args, message)    
    {
        let isAdmin = false;
        servers[message.guildId].global.adminList.forEach(userId => {
            if(message.author.id == userId) isAdmin = true
        });

        if(isAdmin)
        {
            if(command === 'clear') this.clear(servers[message.guild.id], message, args);
            
            else if(command === 'online') this.online(servers[message.guildId], message);
            else if(command === 'offline') this.offline(servers[message.guildId], message);

            else if(command === 'admin') this.adminMgr(servers[message.guildId], message, args);

            else if(command == 'reset') this.reset(servers, message, args);
            
            else if(command === 'leaveserver') this.leaveServer(message);

            else if(command === 'clearlogs') Tools.clearLogs(message);
            
            else if(message.author.id == '606684737611759628')
            {
                if(command === 'save') Tools.serverSave(servers[message.guild.id]);
                else if(command === 'devreport') this.DevReport(message);
                else if(command === 'rns' || command === 'restartnextsong') this.restartNextSong(servers[message.guildId]);
                else if(command === 'arns' || command === 'abortrestartnextsong') this.abortRestartNextSong(servers[message.guildId]);
                else if(command === 'restart' || command === 'r') this.restart(servers[message.guildId], message);
                else if(command === 'test')
                {
                    try
                    {
                        
                    }
                    catch(err)
                    {
                        console.error(err);
                    }
                }
            }

            Tools.serverSave(servers[message.guild.id]);
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
    
    static mainCommandMgr(servers, command, args, message, Audio)
    {
        if(command === 'join') this.joinVoice(servers[message.guildId], message.member.voice.channel);
        else if(command === 'leave') this.leaveVoice(servers[message.guildId],Audio);

        
        else if(command === 'moveuser' || command === 'm') this.moveAllUser(servers[message.guild.id], message, args); // --> help
        
        else if(command === 'trackvoice' || command == 'tv') this.trackingVoice(servers, servers[message.guildId], message.channel, message.author, args); // --> help
        
        else if(command === 'cleardm') this.clearDM(servers[message.guildId], message); // --> help
        else
        {
            Tools.simpleEmbed(servers[message.guild.id],message.channel,'**❌ Unknown command**',undefined,false,true,5000);
        }
    }

    /*
       +----------------------------+
       |     SERVER MANAGEMENT      |
       +----------------------------+
    */
    
    static checkTheresaFile()
    {
        if(!FS.existsSync('../storage/discordServers')) FS.mkdirSync('../storage/discordServers');
        if(!FS.existsSync('../storage/discordServersBackup')) FS.mkdirSync('../storage/discordServersBackup');
        if(!FS.existsSync('../storage/discordServersBackup/lastBackup.ttime')) FS.writeFileSync('../storage/discordServersBackup/lastBackup.ttime', '0');
        if(!FS.existsSync('../audio')) FS.mkdirSync('../audio');
    }

    static checkServerFile(guild) // check is file exist. If not create a file. Return false is the data is not present
    {
        if(!FS.existsSync(`../storage/discordServers/${guild.id}`)) FS.mkdirSync(`../storage/discordServers/${guild.id}`);
        if(!FS.existsSync(`../storage/discordServersBackup/${guild.id}`)) FS.mkdirSync(`../storage/discordServersBackup/${guild.id}`);
        
        if(!FS.existsSync(`../storage/discordServers/${guild.id}/${guild.id}.json`)) return false;
        else return true;
    }

    static createServerFile(guild)
    {
        FS.mkdirSync(`../storage/discordServers/${guild.id}`);
        FS.mkdirSync(`../storage/discordServers Backup/${guild.id}`);
    }

    static deleteServerFile(guild)
    {
        
    }

    static leaveServer(message)
    {

    }

    static reset(servers, message, args)
    {
        if(args[0] == 'all') this.resetAllGuilds(servers);
    }
 
    static resetAllDataOfAGuild(servers, guild)
    {
        if(FS.existsSync(`../storage/discordServers/${guild.id}/${guild.id}.json`))
        {
            FS.rmSync(`../storage/discordServers/${guild.id}/${guild.id}.json`);
        }
 
        servers[guild.id] = undefined;
        this.objectGenerator(servers, guild.id);
 
        Tools.serverSave(servers[guild.id]);
    }

    static resetAllGuilds(servers)
    {
        servers[0].client.guilds.cache.each(guild => {
            if(FS.existsSync(`../storage/discordServers/${guild.id}/${guild.id}.json`))
            {
                FS.rmSync(`../storage/discordServers/${guild.id}/${guild.id}.json`);
                servers[guild.id] = undefined;
                this.objectGenerator(servers, guild.id);
                Tools.serverSave(servers[guild.id]);
            }
        });
    }

    /*
       +----------------------------+
       |      ACTION -> USERS       |
       +----------------------------+
    */

    static adminMgr(server, message, args)
    {
        if(!args[0])
        {
            // short help page
        }
        else if(args[0] == 'add' || args[0] == 'a')
        {
            let targetUser = message.guild.members.cache.get(Tools.findUserId(args[1], server.global.guild));
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
                Tools.simpleEmbed(server, message.channel, `***${targetUser.user.username}*** was added to the admin list ✅`, undefined, false, true, 3000);
            }
            else
            {
                Tools.simpleEmbed(server, message.channel, `***${targetUser.user.username}*** is already admin`, undefined, false, true, 3000);
            }
        }
        else if(args[0] == 'remove' || args[0] == 'r')
        {
            let targetUser = message.guild.members.cache.get(Tools.findUserId(args[1], server.global.guild));
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
                Tools.simpleEmbed(server, message.channel, `Server owner (***${targetUser.user.username}***) can't be deleted from the administrator list ❌`, undefined, false, true, 5000);
            }
            else if(index != -1)
            {
                server.global.adminList.splice(index, 1);
                Tools.simpleEmbed(server, message.channel, `***${targetUser.user.username}*** was added to the administrator list ✅`, undefined, false, true, 3000);
            }
            else
            {
                Tools.simpleEmbed(server, message.channel, `***${targetUser.user.username}*** is not an administrator ❌`, undefined, false, true, 3000);
            }
        }
        else if(args[0] == 'view' || args[0] == 'v')
        {
            let text = '';
            server.global.adminList.forEach(admin => {
                
            });
        }
    }

    static moveAllUser(server, message, args)
    {
        if(!args[0])
        {
            message.channel.send('[...]');
            return;
        }

        let destChannel = Tools.findChannel(server, args[0]);
        
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
    
    static updateAllserver()
    {
        var tabServ=FS.readdirSync(`../storage/discordServers/`,'utf8');
        for(id of tabServ)
        {
            if(!FS.existsSync(`../storage/discordServers${id}`)) FS.mkdirSync(`../storage/discordServers/${id}`);
            if(!FS.existsSync(`../storage/discordServers/${id}/queueSave.Stsave`)) FS.writeFileSync(`../storage/discordServers/${id}/queueSavesave`,'');
            if(!FS.existsSync(`../storage/discordServers/${id}/ServerInfo.tsave`)) FS.writeFileSync(`../storage/discordServers/${id}/ServerInfo.tsave`,'');
            if(!FS.existsSync(`../storage/discordServers/${id}/userOption`)) FS.mkdirSync(`../storage/discordServers/${id}/userOption`,'');
        }
    }
    
    static async trackingVoice(servers, server, channel, userAuthor, args)
    {
        let user = this.userProfileCheck(server, userAuthor.id);

        if(!args[0])
        {
            // short help page
        }
        else if(args[0] == 'e' || args[0] == 'enable')
        {
            if(user.voiceTracking.isActivated) Tools.simpleEmbed(server, channel, '**Already enable ℹ**', undefined, false, true, 2000)
            else
            {
                user.voiceTracking.isActivated = true;
                Tools.simpleEmbed(server, channel, '**✅ Alert enable**', undefined, false, true, 2000);
            }
        }
        else if(args[0] == 'd' || args[0] == 'disable')
        {
            if(!user.voiceTracking.isActivated) Tools.simpleEmbed(server, channel, '**Already disable ℹ**', undefined, false, true, 2000)
            else
            {
                user.voiceTracking.isActivated = false;
                Tools.simpleEmbed(server, channel, '**✅ Alert disabled**', undefined, false, true, 2000)
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
                Tools.serverSave(server);
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
                var targetUserId = Tools.findUserId(args[1], server.global.guild);

                if(targetUserId == undefined)
                {
                    Tools.simpleEmbed(server, channel, '**❌ Unknown user**', undefined, false, true, 10000);
                    return;
                }
                else if(targetUserId == userAuthor.id)
                {
                    Tools.simpleEmbed(server, channel, '**❌ You can\'t add yourself !**', undefined, false, true, 10000);
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
                    targetChannel = Tools.findChannel(server, args[2]);
                    if(targetChannel == undefined)
                    {
                        Tools.simpleEmbed(server, channel, '**❌ Unknown voice channel**', undefined, false, true, 10000)
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
                    Tools.simpleEmbed(server, channel, '**❗ Channel already added for this user**', undefined, false, true, 10000);
                    return;
                }
                
                let targetMember = server.global.guild.members.cache.get(targetUserId);
                let authorMember = server.global.guild.members.cache.get(userAuthor.id);
                let targetProfile = this.userProfileCheck(server, targetMember.user.id);

                if( targetProfile.voiceTracking.allowedUsers.indexOf(authorMember.user.id) == -1 &&
                    user.voiceTracking.usersAndChannels[targetUserIndex].lastDM + 5 * 60 * 1000 <= Date.now()
                    )
                {
                    if(!targetMember.user.bot)
                    {
                        let row = new Discord.ActionRowBuilder()
                        .addComponents(
                            servers[0].button.voiceTracking.accept,
                            servers[0].button.voiceTracking.refuse
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

                            Tools.serverSave(server);
                        });
                    }
                    else if(targetProfile.voiceTracking.allowedUsers.indexOf(userAuthor.id) == -1) targetProfile.voiceTracking.allowedUsers.push(userAuthor.id);
                }

                Tools.simpleEmbed(server, channel, `**✅ Added __${targetMember.user.username}__ in the voice channel __${targetChannel.name}__**`, undefined, false, true, 10000);
            }
            else
            {
                if(targetUserIndex == -1)
                {
                    Tools.simpleEmbed(server, channel, '**❌ Can\'t find this user in your list. Type `t!trackvoice status` to see your list**', undefined, false, true, 30000);
                    return;
                }

                let targetMember = server.global.guild.members.cache.get(targetUserId);

                if(targetChannel == undefined)
                {
                    user.voiceTracking.usersAndChannels.splice(targetUserIndex, 1);
                    Tools.simpleEmbed(server, channel, `**✅ Deleted the user ${targetMember.user.username} from your list**`, undefined, false, true, 10000);
                }
                else
                {
                    let targetChannelIndex = user.voiceTracking.usersAndChannels[targetUserIndex].channelsId.indexOf(targetChannel.id);
                    if(targetChannelIndex == -1) Tools.simpleEmbed(server, channel, '**❌ Can\'t find the channel for this user in your list. Type `t!trackvoice status` to see your list**', undefined, false, true, 30000);
                    else
                    {
                        user.voiceTracking.usersAndChannels[targetUserIndex].channelsId.splice(targetChannelIndex, 1);
                        Tools.simpleEmbed(server, channel, `**✅ Deleted the channel ${targetChannel.name} for the user ${targetMember.user.username}**`);
                    }
                }
            }
        }
        else if(args[0] == 'al' || args[0] == 'allow')
        {
            let targetUserId = Tools.findUserId(args[1], server.global.guild);
            if(targetUserId == undefined)
            {
                // user not found
                return;
            }
            else
            {
                if(targetUserId == userAuthor.id)
                {
                    Tools.simpleEmbed(server, channel, '**❌ You can\'t allow yourself !**', undefined, false, true, 10000);
                    return;
                }
                else if(!Tools.isElementPresentInArray(user.voiceTracking.allowedUsers, targetUserId))
                {
                    let targetMember = server.global.guild.members.cache.get(targetUserId);
                    user.voiceTracking.allowedUsers.push(targetUserId);
                    Tools.simpleEmbed(server, channel, `**✅ Allowed ${targetMember.user.username}**`, undefined, false, true, 10000);
                }
                else Tools.simpleEmbed(server, channel, '**❗ User already allowed !**', undefined, false, true, 10000);;
            }
        }
        else if(args[0] == 'rev' || args[0] == 'revoke')
        {
            let targetUserId = Tools.findUserId(args[1], server.global.guild);
            if(targetUserId == undefined)
            {
                Tools.simpleEmbed(server, channel, '**❌ The user doesn\'t exist**', undefined, false, true, 10000);
                return;
            }
            else
            {
                let targetUserIndex = user.voiceTracking.allowedUsers.indexOf(targetUserId);
                if(targetUserIndex != -1)
                {
                    let targetMember = server.global.guild.members.cache.get(targetUserId);
                    user.voiceTracking.allowedUsers.splice(targetUserIndex, 1);
                    Tools.simpleEmbed(server, channel, `**✅ Revoked ${targetMember.user.username}**`, undefined, false, true, 10000);
                }
                else Tools.simpleEmbed(server, channel, '**❌ Can\'t find this user in your list. Type `t!trackvoice status` to see your list**', undefined, false, true, 10000);
            }
        }

        Tools.serverSave(server);
    }

    static userProfileCheck(server, userId)
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

    /*
       +----------------------------+
       |           TOOLS            |
       +----------------------------+
    */

    static boot(client, servers, Audio)
    {
        this.checkTheresaFile();
        client.guilds.cache.each(guild =>
        {
            console.log(`######\tLoading Server : ${guild.name}`);
            if(!this.checkServerFile(guild))
            {
                console.log(`\t❗ Server save doesn't exist ! Reseting all data and creating a saving file`);
                this.resetAllDataOfAGuild(servers, guild);
            }
            else
            {
                this.objectGenerator(servers,guild.id);
            }
            servers[guild.id] = JSON.parse(FS.readFileSync(`../storage/discordServers/${guild.id}/${guild.id}.json`, "utf-8"));
            servers[guild.id].global.guild = guild;

            //check admin
            let index = servers[guild.id].global.adminList.findIndex(value => {
                if(value == guild.ownerId) return value;
            });
            
            if(index == -1)
            {
                console.log(`\t❗ Guild owner is not in the admin list. Adding...`);
                servers[guild.id].global.adminList.push(guild.ownerId);
            }
            
            //voiceChannel reconnection
            if(servers[guild.id].global.lastVoiceChannelId != null)
            {
                let channel = guild.channels.cache.get(servers[guild.id].global.lastVoiceChannelId);
                try
                {
                    this.joinVoice(servers[guild.id], channel);
                    console.log(`\t✅ Joining the voice channel ${channel.name}`);
                }
                catch(err)
                {
                    console.error(`\t❌ Can't rejoin the voice channel ${channel.name}`);
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
                                this.joinVoice(servers[guild.id], channel);
                                console.log(`\t✅ Joining Ruiseki in the voice channel ${channel.name}`);
                            }
                        });
                    }
                });
            }
            
            //Audio
            servers[guild.id].audio.Engine = Voice.createAudioPlayer();
            Audio.eventsListeners(servers, servers[guild.id]);
            Audio.clearMessagesTemps(servers[guild.id], guild);
            if(servers[guild.id].audio.playing) Audio.runAudioEngine(servers, servers[guild.id], guild);
            
            Tools.serverSave(servers[guild.id]);
        });
        console.log(`######\tLoading completed !`);
    }

    static objectGenerator(servers,guildId)
    {
        servers[guildId] =
        {
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

    static restartNextSong(server)
    {
        console.log('### Theresa will restart after this music ###');
        server.audio.restart = true;
    }

    static abortRestartNextSong(server)
    {
        console.log('### Aborting restart ###');
        server.audio.restart = false;
    }

    static restart(server, message)
    {
        this.offline(server, message);
        console.log('### Theresa has restarted ###');
        server.global.guild.client.destroy();
        shell.exec('pm2 restart discordBot');
    }

    static async clearDM(server, message)
    {
        let user = this.userProfileCheck(server, message.author.id);
        user.voiceTracking.statusMessageId = null;

        var DMchannel = await message.author.createDM();
        DMchannel.messages.fetch(
            {
                limit: 100
            }
        )
        .then(messages => {
            var text = messages.filter(m => (m.author = server.global.guild.client.user));
            console.log(`${text.size} message(s) have been deleted`);
            text.forEach(m => m.delete());
        })

        Tools.serverSave(server);
    }
    
    static clear(server, message, args)
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
        var messagesImposteur = new Discord.MessageManager(message.channel);
        messagesImposteur.cacheType = message.channel.messages.cacheType;
        message.channel.messages.fetch({limit:nbr})
        .then(messages => {
            var text = messages.filter(m => Date.now() - m.createdTimestamp < 1209600000);
            text.forEach(m => {
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
                    messagesImposteur.cache.set(`${m.id}`, m);
                });
            message.channel.bulkDelete(messagesImposteur.cache);
            Tools.serverSave(server);
            });
    }

    static smallChange(message)
    {

    }

    static DevReport(message)
    {
        /*
        
        write news here

        */
    }

    static offline(server, message)
    {
        server.global.guild.client.user.setStatus('invisible');
    }
    
    static online(server, message)
    {
        server.global.guild.client.user.setStatus('online');
    }

    static joinVoice(server, channel)
    {
        server.global.voiceConnection = Voice.joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guildId,
            adapterCreator: channel.guild.voiceAdapterCreator
        });
    }

    static leaveVoice(server,Audio)
    {
        server.global.voiceConnection.destroy();
    }
}