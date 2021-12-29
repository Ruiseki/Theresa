const Voice = require('@discordjs/voice');
const Discord = require('discord.js');
const FS = require('fs');

const Tools = require('./tools.js');

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

    static async test(message)
    {
        let array = [54653,231,654,1,864,63514,685,35,46,5463]
        array.forEach((element, index) => {
            console.log(index);
        });
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
            
            else if(command === 'leaveserver') this.leaveServer(message);
            
            else if(message.author.id == 606684737611759628)
            {
                if(command === 'save') Tools.serverSave(servers[message.guild.id]);
                else if(command === 'devreport') this.DevReport(message);
                else if(command === 'rns' || command === 'restartnextsong') this.restartNextSong(servers[message.guildId]);
                else if(command === 'restart' || command === 'r') this.restart(servers[message.guildId], message);
                else if(command === 'test')
                {
                    try
                    {
                        message.member.roles.cache.each(role => {
                            console.log(role.name);
                            console.log(role.permissions);
                            console.log(role.hoist);
                        });
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
        else if(command === 'trackv' || command == 'userTrackingVoice') this.trackingVoice(servers[message.guildId], message, args); // --> help
        
        else if(command === 'cleardm') this.clearDM(servers[message.guildId], message); // --> help
        else if(command === 'invitelink') this.inviteLink(servers[message.guildId] ,message); // --> help
        else
        {
            Tools.simpleEmbed(servers[message.guild.id],message,'**Unknown command ❌**',undefined,false,true,3000);
        }
    }

    /*
       +----------------------------+
       |     SERVER MANAGEMENT      |
       +----------------------------+
    */
    
    static checkServerFile(guild) // check is file exist. If not create a file. Return false is the data is not present
    {
        if(!FS.existsSync('./Servers')) FS.mkdirSync('./Servers')
        if(!FS.existsSync('./Servers Backup')) FS.mkdirSync('./Servers Backup')

        if(!FS.existsSync(`./Servers/${guild.id}`)) FS.mkdirSync(`./Servers/${guild.id}`);
        if(!FS.existsSync(`./Servers Backup/${guild.id}`)) FS.mkdirSync(`./Servers Backup/${guild.id}`)
        
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
                Tools.simpleEmbed(server, message, `***${targetUser.username}*** was added to the admin list ✅`, undefined, false, true, 1500);
            }
            else
            {
                Tools.simpleEmbed(server, message, `***${targetUser.username}*** is already admin`, undefined, false, true, 1500);
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
                Tools.simpleEmbed(server, message, `Server owner (***${targetUser.username}***) can't be deleted from the administrator list ❌`, undefined, false, true, 1500);
            }
            else if(index != -1)
            {
                server.global.adminList.splice(index, 1);
                Tools.simpleEmbed(server, message, `***${targetUser.username}*** was added to the administrator list ✅`, undefined, false, true, 1500);
            }
            else
            {
                Tools.simpleEmbed(server, message, `***${targetUser.username}*** is not an administrator ❌`, undefined, false, true, 1500);
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
                            authorizedUsers:[],
                            usersAdded:[],
                            inChannel:[]
                        }
                    );
                }
                else
                {
                    server.tracking.voice[index].isActivated = true;
                }
                Tools.simpleEmbed(server, message, '**Done ✅**', undefined, false, true, 2000)
            }
        }
        else if(args[0] == 'd' || args[0] == 'disable')
        {
            if(!isOn) Tools.simpleEmbed(server, message, '**Already disable ℹ**', undefined, false, true, 2000)
            else
            {
                server.tracking.voice[index].isActivated = false;
                Tools.simpleEmbed(server, message, '**Done ✅**', undefined, false, true, 2000)
            }
        }
        else if(args[0] == 's' || args[0] == 'status')
        {
            if(index != -1)
            {
                let text = `**Voice tracking status for *${message.author.username}***\n\n`;

                if(server.tracking.voice[index].isActivated) text += '**Service is ON**';
                else text += '**Service is OFF**';
                text += '\n\n';

                let arrayOfChannel = [];
                server.tracking.voice[index].inChannel.forEach(channel => { // get all added channel
                    if(!isElementPresentInArray(arrayOfChannel, channel)) arrayOfChannel.push(channel);
                });

                arrayOfChannel.forEach(channelId => { // find all corresponding user
                    let channel = server.guild.channels.cache.get(channelId);
                    text += `**${channel.name}**\n`;
                    
                    server.tracking.voice[index].usersAdded.forEach((userId, i) => {
                        if(server.tracking.voice[index].inChannel[i] == channelId)
                        {
                            let user = server.guild.members.cache.get(userId);
                            text += `***${user.username}***`;
                        }
                    });
                });
            }
        }
        else if(args[0] == 'a' || args[0] == 'add')
        {
            if(!isOn) Tools.simpleEmbed(server, message, '**Enable tracking first ❌**', undefined, false, true, 2000)
            else
            {
                if(!args[1]) // get the targeted user (can be all members of the guild)
                {
                    // short help page
                    return;
                }
                else
                {
                    var targetUserId;
                    if(args[1] == 'all') targetUserId = 'all';
                    else targetUserId = Tools.findUserId(args[1], server.guild);

                    if(targetUserId == undefined)
                    {
                        Tools.simpleEmbed(server, message, '**Unknown user ❌**', undefined, false, true, 2000)
                        return;
                    }
                }

                if(!args[2]) // the the targeted channel (can be all the channels of the guild)
                {
                    // short help page
                }
                else
                {
                    if(args[2] == "all")
                    {
                        // select all channels
                    }
                    else
                    {
                        var targetChannel;
                        if(args[2] == 'all') targetChannel = 'all'
                        else targetChannel = Tools.findChannel(args[2], message);

                        if(targetChannel == undefined)
                        {
                            Tools.simpleEmbed(server, message, '**Unknown voice channel ❌**', undefined, false, true, 2000)
                            return;
                        }
                    }
                }

                if(targetUserId != 'all' && targetChannel != 'all')
                {
                    let targetChannelIndex, targetUserIndex;
                    targetUserIndex = server.tracking.voice[index].usersAdded.findIndex(value => {
                        if(value == targetUserId) return value;
                    });
                    targetChannelIndex = server.tracking.voice[index].inChannel.findIndex(value => {
                        if(value == targetChannel.id) return value;
                    });

                    if(targetChannelIndex == -1 || targetUserIndex == -1)
                    {
                        server.tracking.voice[index].usersAdded.push(targetUserId);
                        server.tracking.voice[index].inChannel.push(targetChannel.id);
                    }
                    else
                    {
                        Tools.simpleEmbed(server, message, '**User and channel already added ℹ**', undefined, false, true, 2000)
                    }
                }
                else if(targetUserId == 'all' && targetChannel != 'all')
                {
                    targetUserId = [];
                    server.global.guild.members.cache.each(member => {
                        targetUserId.push(member.id);
                    });

                    targetUserId.forEach(element => {
                        let targetChannelIndex, targetUserIndex;
                        targetUserIndex = server.tracking.voice[index].usersAdded.findIndex(value => {
                            if(value == element) return value;
                        });
                        targetChannelIndex = server.tracking.voice[index].inChannel.findIndex(value => {
                            if(value == targetChannel.id) return value;
                        });

                        if(targetChannelIndex == -1 || targetUserIndex == -1)
                        {
                            server.tracking.voice[index].usersAdded.push(element);
                            server.tracking.voice[index].inChannel.push(targetChannel.id);
                        }
                    });
                }
                else if(targetUserId != 'all' && targetChannel == 'all')
                {
                    targetChannel = [];
                    server.global.guild.channels.cache.each(channel => {
                        targetChannel.push(channel.id);
                    });

                    targetChannel.forEach(element => {
                        let targetChannelIndex, targetUserIndex;
                        targetUserIndex = server.tracking.voice[index].usersAdded.findIndex(value => {
                            if(value == targetUserId) return value;
                        });
                        targetChannelIndex = server.tracking.voice[index].inChannel.findIndex(value => {
                            if(value == element) return value;
                        });

                        if(targetChannelIndex == -1 || targetUserIndex == -1)
                        {
                            server.tracking.voice[index].usersAdded.push(targetUserId);
                            server.tracking.voice[index].inChannel.push(element);
                        }
                    });
                }
                else if(targetUserId == 'all' && targetChannel == 'all')
                {
                    targetUserId = [];
                    targetChannel = [];
                    server.global.guild.members.cache.each(member => {
                        targetUserId.push(member.id);
                    });
                    server.global.guild.channels.cache.each(channel => {
                        targetChannel.push(channel.id);
                    });
                    
                    targetUserId.forEach(elementUser => {
                        targetChannel.forEach(elementChannel => {
                            let targetChannelIndex, targetUserIndex;
                            targetUserIndex = server.tracking.voice[index].usersAdded.findIndex(value => {
                                if(value == elementUser) return value;
                            });
                            targetChannelIndex = server.tracking.voice[index].inChannel.findIndex(value => {
                                if(value == elementChannel) return value;
                            });
    
                            if(targetChannelIndex == -1 || targetUserIndex == -1)
                            {
                                server.tracking.voice[index].usersAdded.push(elementUser);
                                server.tracking.voice[index].inChannel.push(elementChannel);
                            }
                        });
                    });
                }
            }
        }
        else if(args[0] == 'r' || args[0] == 'remove')
        {
            if(!isOn) Tools.simpleEmbed(server, message, '**Enable tracking first ❌**', undefined, false, true, 2000)
            else
            {
                if(!args[1]) // get the targeted user (can be all members of the guild)
                {
                    // short help page
                    return;
                }
                else
                {
                    var targetUserId;
                    if(args[1] == 'all') targetUserId = 'all';
                    else targetUserId = Tools.findUserId(args[1], server.guild);

                    if(targetUserId == undefined)
                    {
                        Tools.simpleEmbed(server, message, '**Unknown user ❌**', undefined, false, true, 2000)
                        return;
                    }
                }

                if(!args[2]) // the the targeted channel (can be all the channels of the guild)
                {
                    // short help page
                }
                else
                {
                    if(args[2] == "all")
                    {
                        // select all channels
                    }
                    else
                    {
                        var targetChannel;
                        if(args[2] == 'all') targetChannel = 'all'
                        else targetChannel = Tools.findChannel(args[2], message);

                        if(targetChannel == undefined)
                        {
                            Tools.simpleEmbed(server, message, '**Unknown voice channel ❌**', undefined, false, true, 2000)
                            return;
                        }
                    }
                }

                if(targetUserId != 'all' && targetChannel != 'all')
                {
                    let targetChannelIndex, targetUserIndex;
                    targetUserIndex = server.tracking.voice[index].usersAdded.findIndex(value => {
                        if(value == targetUserId) return value;
                    });
                    targetChannelIndex = server.tracking.voice[index].inChannel.findIndex(value => {
                        if(value == targetChannel.id) return value;
                    });

                    if(targetChannelIndex == -1 || targetUserIndex == -1)
                    {
                        server.tracking.voice[index].usersAdded.push(targetUserId);
                        server.tracking.voice[index].inChannel.push(targetChannel.id);
                    }
                    else
                    {
                        Tools.simpleEmbed(server, message, '**User and channel already added ℹ**', undefined, false, true, 2000)
                    }
                }
                else if(targetUserId == 'all' && targetChannel != 'all')
                {
                    targetUserId = [];
                    server.global.guild.members.cache.each(member => {
                        targetUserId.push(member.id);
                    });

                    targetUserId.forEach(element => {
                        let targetChannelIndex, targetUserIndex;
                        targetUserIndex = server.tracking.voice[index].usersAdded.findIndex(value => {
                            if(value == element) return value;
                        });
                        targetChannelIndex = server.tracking.voice[index].inChannel.findIndex(value => {
                            if(value == targetChannel.id) return value;
                        });

                        if(targetChannelIndex == -1 || targetUserIndex == -1)
                        {
                            server.tracking.voice[index].usersAdded.push(element);
                            server.tracking.voice[index].inChannel.push(targetChannel.id);
                        }
                    });
                }
                else if(targetUserId != 'all' && targetChannel == 'all')
                {
                    targetChannel = [];
                    server.global.guild.channels.cache.each(channel => {
                        targetChannel.push(channel.id);
                    });

                    targetChannel.forEach(element => {
                        let targetChannelIndex, targetUserIndex;
                        targetUserIndex = server.tracking.voice[index].usersAdded.findIndex(value => {
                            if(value == targetUserId) return value;
                        });
                        targetChannelIndex = server.tracking.voice[index].inChannel.findIndex(value => {
                            if(value == element) return value;
                        });

                        if(targetChannelIndex == -1 || targetUserIndex == -1)
                        {
                            server.tracking.voice[index].usersAdded.push(targetUserId);
                            server.tracking.voice[index].inChannel.push(element);
                        }
                    });
                }
                else if(targetUserId == 'all' && targetChannel == 'all')
                {
                    server.tracking.voice[index].usersAdded = [];
                    server.tracking.voice[index].inChannel = [];
                }
            }
        }
        else if(args[0] == 'aut' || args[0] == 'authorize')
        {
            let targetUser = Tools.findUserId(args[1], server.guild);
            if(targetUser == undefined)
            {
                // user not found
                return;
            }
            else
            {
                if(!Tools.isElementPresentInArray(server.tracking.voice[index].authorizedUsers, targetUser.id)) server.tracking.voice[index].authorizedUsers.push(targetUser.id);
                else /* already added */;
            }
        }
        else if(args[0] == 'rev' || args[0] == 'revoke')
        {
            let targetUser = Tools.findUserId(args[1], server.guild);
            if(targetUser == undefined)
            {
                // user not found
                return;
            }
            else
            {
                if(Tools.isElementPresentInArray(server.tracking.voice[index].authorizedUsers, targetUser.id))
                {
                    server.tracking.voice[index].authorizedUsers.forEach((element, i) => {
                        if(element == targetUser.id) server.tracking.voice[index].authorizedUsers.splice(i, 1);
                    });
                }
                else /* already added */;
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
        client.guilds.cache.each(guild =>
        {
            console.log(`### Loading Server : ${guild.name}`);
            if(!this.checkServerFile(guild))
            {
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
                console.log(`    ❗ Guild owner is not in the admin list. Adding...`);
                servers[guild.id].global.adminList.push(guild.ownerId);
            }

            //voiceChannel reconnection
            if(servers[guild.id].global.lastVoiceChannelId != null)
            {
                let channel = guild.channels.cache.get(servers[guild.id].global.lastVoiceChannelId);
                try
                {
                    this.joinVoice(servers[guild.id], channel);
                    console.log(`    ✅ Joining the voice channel ${channel.name}`);
                }
                catch(err)
                {
                    console.error(`    ❌ Can't rejoin the voice channel ${channel.name}`);
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
                                console.log(`    ✅ Joining Ruiseki in the voice channel ${channel.name}`);
                            }
                        });
                    }
                });
            }

            //Audio
            Audio.clearMessagesTemps(servers[guild.id], guild);
            if(servers[guild.id].audio.isPlaying) Audio.runAudioEngine(servers, servers[guild.id], guild);
            
            Tools.serverSave(servers[guild.id]);
            console.log(`    Loading completed ###`);
        });
    }

    static objectGenerator(servers,guildId)
    {
        servers[guildId]=
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
                    userId,             // the id of the user who had activate the service
                    isActivated: true,  // if the service is turn off. When turn off, user dont lose his parameters
                    authorizedUsers:[],  // accepted user. Not everyone can track you
                    usersAdded:[],      // list of user the user track
                    inChannel:[]        // list of corresponding channel
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
        Theresa.offline(server, message);
        console.log('### Theresa has restarted ###');
        client.destroy();
        shell.exec('pm2 restart 0');
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
            var text = messages.filter(m => (m.author = server.guild.client.user));
            console.log(`${text.size} message(s) have been deleted`);
            text.forEach(m => m.delete());
        });
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
        server.global.guild.client.user.presence.status='offline';
    }
    
    static online(server, message)
    {
        server.global.guild.client.user.presence.status='online';
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