const   Voice = require('@discordjs/voice'),
        Discord = require('discord.js'),
        FS = require('fs'),
        Tools = require('./tools.js'),
        shell = require('shelljs'),
        ytdl = require('ytdl-core');

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

            else if(command == 'reset') this.resetServerOption(servers[message.guildId], message, args);
            
            else if(command === 'leaveserver') this.leaveServer(message);

            else if(command === 'clearlogs') Tools.clearLogs(message);
            
            else if(message.author.id == '606684737611759628')
            {
                if(command === 'save') Tools.serverSave(servers[message.guild.id]);
                else if(command === 'devreport') this.DevReport(message);
                else if(command === 'rns' || command === 'restartnextsong') this.restartNextSong(servers[message.guildId]);
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
        
        // else if(command === 'rec' || command == 'recall') this.recallPing(servers[message.guildId], message, args);
        else if(command === 'trackvoive' || command == 'tv') this.trackingVoice(servers[message.guildId], message, args); // --> help
        
        else if(command === 'cleardm') this.clearDM(servers[message.guildId], message); // --> help
        else if(command === 'invitelink') this.inviteLink(servers[message.guildId] ,message); // --> help
        else
        {
            Tools.simpleEmbed(servers[message.guild.id],message,'**❌ Unknown command**',undefined,false,true,5000);
        }
    }

    /*
       +----------------------------+
       |     SERVER MANAGEMENT      |
       +----------------------------+
    */
    
    static checkTheresaFile()
    {
        if(!FS.existsSync('./Servers')) FS.mkdirSync('./Servers');
        if(!FS.existsSync('./Servers Backup')) FS.mkdirSync('./Servers Backup');
        if(!FS.existsSync('./Servers Backup/lastBackup.ttime')) FS.writeFileSync('./Servers Backup/lastBackup.ttime', '0');
        if(!FS.existsSync('./audio')) FS.mkdirSync('./audio');
        if(!FS.existsSync('./audio/buttonImg')) FS.mkdirSync('./audio/buttonImg');
        // mettre les images en base de donnée et les ajouter

        // if(!FS.existsSync('./audio/playslist')) FS.writeFileSync('./audio/playlist', '');
        if(!FS.existsSync('./customServices')) FS.mkdirSync(''); 
    }

    static checkServerFile(guild) // check is file exist. If not create a file. Return false is the data is not present
    {
        if(!FS.existsSync(`./Servers/${guild.id}`)) FS.mkdirSync(`./Servers/${guild.id}`);
        if(!FS.existsSync(`./Servers Backup/${guild.id}`)) FS.mkdirSync(`./Servers Backup/${guild.id}`);
        
        if(!FS.existsSync(`./Servers/${guild.id}/${guild.id}.json`)) return false;
        else return true;
    }

    static createServerFile(guild)
    {
        FS.mkdirSync(`./Servers/${guild.id}`);
        FS.mkdirSync(`./Servers Backup/${guild.id}`);
    }

    static deleteServerFile(guild)
    {
        
    }

    static decoReco(servers,message)
    {
        
    }

    static leaveServer(message)
    {

    }

    static resetServerOption(server, message, args)
    {
        if(args[0] == 'voiceTracking')
        {
            server.tracking.voice = [];
        }
    }
 
    static resetAllDataOfAGuild(servers, guild)
    {
        if(FS.existsSync(`./Servers/${guild.id}/${guild.id}.json`))
        {
            FS.rmSync(`./Servers/${guild.id}/${guild.id}.json`);
        }
 
        servers[guild.id] = undefined;
        this.objectGenerator(servers, guild.id);
 
        Tools.serverSave(servers[guild.id]);
    }

    /*
       +----------------------------+
       |  ACTION WITH / ON USERS    |
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
                Tools.simpleEmbed(server, message, `***${targetUser.user.username}*** was added to the admin list ✅`, undefined, false, true, 3000);
            }
            else
            {
                Tools.simpleEmbed(server, message, `***${targetUser.user.username}*** is already admin`, undefined, false, true, 3000);
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
                Tools.simpleEmbed(server, message, `Server owner (***${targetUser.user.username}***) can't be deleted from the administrator list ❌`, undefined, false, true, 5000);
            }
            else if(index != -1)
            {
                server.global.adminList.splice(index, 1);
                Tools.simpleEmbed(server, message, `***${targetUser.user.username}*** was added to the administrator list ✅`, undefined, false, true, 3000);
            }
            else
            {
                Tools.simpleEmbed(server, message, `***${targetUser.user.username}*** is not an administrator ❌`, undefined, false, true, 3000);
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

        let destChannel = Tools.findChannel(args[0], message);
        
        if(destChannel == undefined)
        {
            message.channel.send('[...]');
            return;
        }

        if(destChannel.type != "GUILD_VOICE")
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
        var tabServ=FS.readdirSync(`./Servers/`,'utf8');
        for(id of tabServ)
        {
            if(!FS.existsSync(`./Servers${id}`)) FS.mkdirSync(`./Servers/${id}`);
            if(!FS.existsSync(`./Servers/${id}/queueSave.Stsave`)) FS.writeFileSync(`./Servers/${id}/queueSavesave`,'');
            if(!FS.existsSync(`./Servers/${id}/ServerInfo.tsave`)) FS.writeFileSync(`./Servers/${id}/ServerInfo.tsave`,'');
            if(!FS.existsSync(`./Servers/${id}/userOption`)) FS.mkdirSync(`./Servers/${id}/userOption`,'');
        }
    }

    static specialChannelCreation(guild)
    {
        guild.channels.create(`Theresa'sTemporaryChannel`,{type : 'text'});
        //  channel = guild.channels.cache.find()
    }
    
    static trackingVoice(server, message, args)
    {
        let isOn, index;

        index = server.tracking.voice.findIndex(value => {
            if(value.userId == message.author.id) return value;
        });

        if(index != -1 && server.tracking.voice[index].isActivated) isOn = true
        else isOn = false;


        if(!args[0])
        {
            // short help page
        }
        else if(args[0] == 'e' || args[0] == 'enable')
        {
            if(isOn) Tools.simpleEmbed(server, message, '**Already enable ℹ**', undefined, false, true, 2000)
            else
            {
                index = server.tracking.voice.findIndex(value => {
                    if(value.userId == message.author.id) return value;
                });

                if(index == -1)
                {
                    server.tracking.voice.push(
                        {
                            userId: message.author.id,
                            isActivated: true,
                            allowedUsers:[],
                            usersAndChannels:[]
                        }
                    );
                }
                else
                {
                    server.tracking.voice[index].isActivated = true;
                }
                Tools.simpleEmbed(server, message, '**✅ Alert enable**', undefined, false, true, 2000);
            }
        }
        else if(args[0] == 'd' || args[0] == 'disable')
        {
            if(!isOn) Tools.simpleEmbed(server, message, '**Already disable ℹ**', undefined, false, true, 2000)
            else
            {
                server.tracking.voice[index].isActivated = false;
                Tools.simpleEmbed(server, message, '**✅ Alert disabled**', undefined, false, true, 2000)
            }
        }
        else if(args[0] == 's' || args[0] == 'status')
        {
            if(index != -1)
            {
                let text = `*Voice tracking status for __**${message.author.username}**__*\n\n`;

                if(server.tracking.voice[index].isActivated) text += '**✅ Service is ON**';
                else text += '**❎ Service is OFF**';
                text += '\n\n';

                let voice = server.tracking.voice;
                let arrayOfObject = [];

                let authorIndex = voice.findIndex(value => {
                    if(value.userId == message.author.id) return value;
                });

                voice[authorIndex].usersAndChannels.forEach(userAndChannel => {
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
                    let channel = server.global.guild.channels.cache.get(object.id);
                    text += `**${channel.name}**\n`;
                    for(let userId of object.usersId)
                    {
                        let member = server.global.guild.members.cache.get(userId);
                        text += `${member.user.username}\n`;
                    }
                    text += '\n';
                }

                text += '**👍 You have allowed : \n**';

                for(let allowedUserId of voice[authorIndex].allowedUsers)
                {
                    let allowedMember = server.global.guild.members.cache.get(allowedUserId);
                    text += `${allowedMember.user.username}\n`
                }

                Tools.simpleEmbed(server, message, text);
            }
            else Tools.simpleEmbed(server, message, '**❎ Profile unknown\nEnable with `t!trackvoice enable` to create your profile**', undefined, false, true, 60000);
        }
        else if(args[0] == 'a' || args[0] == 'add' || args[0] == 'r' || args[0] == 'remove')
        {
            var isRemoving = false;
            if(args[0] == 'r' || args[0] == 'remove') isRemoving = true;

            if(index == -1) // check if the user profil existe
            {
                Tools.simpleEmbed(server, message, '**❌ Please create your profile first with `t!trackvoice enable`**', undefined, false, true, 30000);
                return;
            }

            if(!args[1]) // get the targeted user (can be all members of the guild if the user is removing users)
            {
                // short help page
                return;
            }
            else
            {
                var targetUserId = Tools.findUserId(args[1], server.global.guild);

                if(targetUserId == undefined)
                {
                    Tools.simpleEmbed(server, message, '**❌ Unknown user**', undefined, false, true, 10000);
                    return;
                }
                else if(targetUserId == message.author.id)
                {
                    Tools.simpleEmbed(server, message, '**❌ You can\'t add yourself !**', undefined, false, true, 10000);
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
                    targetChannel = Tools.findChannel(args[2], message);
                    if(targetChannel == undefined)
                    {
                        Tools.simpleEmbed(server, message, '**❌ Unknown voice channel**', undefined, false, true, 10000)
                        return;
                    }
                }
            }

            let voice = server.tracking.voice[index],
            targetUserIndex = voice.usersAndChannels.findIndex(value => {
                if(value.userId == targetUserId) return value;
            });

            if(!isRemoving)
            {
                if(targetUserIndex == -1)
                {
                    let newUsersAndChannelsObject = {
                        "userId": targetUserId,
                        "lastDM": 0,
                        "channelsId": []
                    };
                    voice.usersAndChannels.push(newUsersAndChannelsObject);
                    targetUserIndex = voice.usersAndChannels.length - 1;
                }

                let targetChannelIndex = voice.usersAndChannels[targetUserIndex].channelsId.findIndex(value => {
                    if(value == targetChannel.id) return value;
                });

                if(targetChannelIndex == -1) voice.usersAndChannels[targetUserIndex].channelsId.push(targetChannel.id);
                else
                {
                    Tools.simpleEmbed(server, message, '**❗ Channel already added for this user**', undefined, false, true, 10000);
                    return;
                }
                
                let targetMember = server.global.guild.members.cache.get(targetUserId);
                let authorMember = server.global.guild.members.cache.get(message.author.id);

                let targetIndex = server.tracking.voice.findIndex(value => {
                    if(value.userId == targetMember.user.id) return value;
                });

                if(targetIndex != -1 && server.tracking.voice[targetIndex].allowedUsers.indexOf(authorMember.user.id) == -1 && voice.usersAndChannels[targetUserIndex].lastDM + 5 * 60 * 1000 <= Date.now())
                {
                    if(!targetMember.user.bot)
                    {
                        targetMember.user.send({
                            embeds:[{
                                color:'#000000',
                                description:`***${authorMember.user.username}*** want to know when you are connected to a voice channel. Type \`t!trackvoice allow ${authorMember.user.username}\` in the server **${message.guild.name}** to allow this user.`,
                                title:`Authorization for voice tracking (from ${authorMember.user.username} in ${server.global.guild.name})`,
                                thumbnail:{
                                    url: targetMember.user.avatarURL()
                                }
                            }]
                        });
                        voice.usersAndChannels[targetUserIndex].lastDM = Date.now();
                    }
                }

                Tools.simpleEmbed(server, message, `**✅ Added __${targetMember.user.username}__ in the voice channel __${targetChannel.name}__**`, undefined, false, true, 10000);
            }
            else
            {
                if(targetUserIndex == -1)
                {
                    Tools.simpleEmbed(server, message, '**❌ Can\'t find this user in your list. Type `t!trackvoice status` to see your list**', undefined, false, true, 30000);
                    return;
                }

                let targetMember = server.global.guild.members.cache.get(targetUserId);

                if(targetChannel == undefined)
                {
                    voice.usersAndChannels.splice(targetUserIndex, 1);
                    Tools.simpleEmbed(server, message, `**✅ Deleted the user ${targetMember.user.username} from your list**`, undefined, false, true, 10000);
                }
                else
                {
                    let targetChannelIndex = voice.usersAndChannels[targetUserIndex].channelsId.indexOf(targetChannel.id);
                    if(targetChannelIndex == -1) Tools.simpleEmbed(server, message, '**❌ Can\'t find the channel for this user in your list. Type `t!trackvoice status` to see your list**', undefined, false, true, 30000);
                    else
                    {
                        voice.usersAndChannels[targetUserIndex].channelsId.splice(targetChannelIndex, 1);
                        Tools.simpleEmbed(server, message, `**✅ Deleted the channel ${targetChannel.name} for the user ${targetMember.user.username}**`);
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
                if(targetUserId == message.author.id)
                {
                    Tools.simpleEmbed(server, message, '**❌ You can\'t allow yourself !**', undefined, false, true, 10000);
                    return;
                }
                else if(!Tools.isElementPresentInArray(server.tracking.voice[index].allowedUsers, targetUserId))
                {
                    let targetMember = server.global.guild.members.cache.get(targetUserId);
                    server.tracking.voice[index].allowedUsers.push(targetUserId);
                    Tools.simpleEmbed(server, message, `**✅ Allowed ${targetMember.user.username}**`, undefined, false, true, 10000);
                }
                else Tools.simpleEmbed(server, message, '**❗ User already allowed !**', undefined, false, true, 10000);;
            }
        }
        else if(args[0] == 'rev' || args[0] == 'revoke')
        {
            let targetUserId = Tools.findUserId(args[1], server.global.guild);
            if(targetUserId == undefined)
            {
                Tools.simpleEmbed(server, message, '**❌ The user doesn\'t exist**', undefined, false, true, 10000);
                return;
            }
            else
            {
                let targetUserIndex = server.tracking.voice[index].allowedUsers.indexOf(targetUserId);
                if(targetUserIndex != -1)
                {
                    let targetMember = server.global.guild.members.cache.get(targetUserId);
                    server.tracking.voice[index].allowedUsers.splice(targetUserIndex, 1);
                    Tools.simpleEmbed(server, message, `**✅ Revoked ${targetMember.user.username}**`, undefined, false, true, 10000);
                }
                else Tools.simpleEmbed(server, message, '**❌ Can\'t find this user in your list. Type `t!trackvoice status` to see your list**', undefined, false, true, 10000);
            }
        }

        Tools.serverSave(server);
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
            servers[guild.id] = JSON.parse(FS.readFileSync(`./Servers/${guild.id}/${guild.id}.json`, "utf-8"));
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
                    if(channel.isVoice())
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
            Audio.clearMessagesTemps(servers[guild.id], guild);
            if(servers[guild.id].audio.isPlaying) Audio.runAudioEngine(servers, servers[guild.id], guild);
            
            Tools.serverSave(servers[guild.id]);
            console.log(`\tLoading completed`);
        });
    }

    static objectGenerator(servers,guildId)
    {
        servers[guildId] =
        {
            global:{
                guild:null,
                guildId,
                voiceConnection:null,
                lastTextChannelId:null,
                lastVoiceChannelId:null,
                messageTemp:[],
                adminList:[]
            },
            tracking:{
                voice:[
                    /*
                    userId,                 // the id of the user who had activate the service
                    isActivated: true,      // if the service is turn off. When turn off, user dont lose his parameters
                    allowedUsers:[],        // accepted user. Not everyone can track you
                    usersAndChannels:
                    [           
                        {           
                            userId,         // id of a targeted user
                            lastDM,         // time in ms from the last DM to the targeted user
                            channelsId:[]   // list of the channel for this user
                        }
                    ]
                    */
                ],
                ping:[],
                status:[]
            },
            audio:{
                Engine:null,
                queue:[],
                lastQueue:{
                    messageId:null,
                    channelId:null
                },
                lastMusicTextchannelId:null,
                currentPlayingSong:null,
                isPlaying:false,
                pause:false,
                loop:false,
                queueLoop:false,
                leave:false,
                arret:false,
                restart:false,
            }
        };
    }

    static restartNextSong(server)
    {
        console.log('### Theresa will restart after this music ###');
        server.audio.restart=true;
    }

    static restart(server, message)
    {
        this.offline(server, message);
        console.log('### Theresa has restarted ###');
        server.global.guild.client.destroy();
        shell.exec('pm2 restart main.js');
    }

    static async clearDM(server, message)
    {
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
        var embed = new Discord.MessageEmbed()
        .setColor('#000000')
        .setTitle('🗒  Theresa\'s Changelog  💻')
        .attachFiles(['./Picture/Theresa.jpg'])
        .setThumbnail('attachment://Theresa.jpg')
        .setDescription('*An allias for the __Coding Factory__ has just been created !\Now, there is the list of new available commands **(only in the server "L1 Alt Cergy - Coding Factory")** :*')
        .addFields(
            {name:`**New allias**`,value:`Write \`t!coding\` or \`t!c\` to access to the special commands of the Coding Factory`,inline:false},
            {name:'\u200B',value:'\u200B'},
            {name:`**New command**`,value:`*The new command is **groupe**. Execute this command to make random groupe !*`},
            {name:`**Exemple : **`,value:`\`t!coding groupe\``}
        );
        message.channel.send({embeds :[embed]});
        message.channel.send('@everyone');

        /*
        
        write news here

        */
    }

    static offline(server, message)
    {
        server.global.guild.client.user.setStatus('invisible');
        //On peut pas mettre "offline"(parceque ça existe pas) donc on met "invisible"
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

    static async inviteLink(server, message)
    {
        message.author.send(await server.global.guild.client.generateInvite());
    }
}