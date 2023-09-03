const Voice = require('@discordjs/voice');
const shell = require('shelljs'),
    FS = require('fs'),
    Discord = require('discord.js'),
    ytdl = require('ytdl-core'),
    YTSearch = require('yt-search');

module.exports = class tools
{
    static cmd(servers, command, message)
    {
        if(command === 'logerror') this.logError(message);
        else if(command === 'log') this.log(message);

        else return false;
        return true;
    }

    static reboot()
    {
        shell.exec('pm2 restart discordBot');
    }

    static getRandomInt(max)
    {
        var alea = Math.floor(Math.random() * (max+1));
        return alea;
    }

    static sleep(milliseconds)
    {
        const date = Date.now();
        let currentDate = null;
        do {
            currentDate = Date.now();
        } while (currentDate - date < milliseconds);
    }
    
    static addIntoArray(element,place,array)
    {
       /* for(let i=array.length; i >= place; i--) array[i] = array [i-1]
        array[place] = element;
        return array; */

        array.splice(place, 0, element);
        return array;
    }

    static insertArrayIntoArray(arrayToInsert, place, array)
    {
        array.splice(place, 0, ...arrayToInsert);
        return array;
    }

    static simpleEmbed(server, channel, text)
    {
        this.simpleEmbed(server, channel, text, undefined, false, false, undefined);
    }

    static simpleEmbed(server, channel, text, image, needThumbnail)
    {
        this.simpleEmbed(server, channel, text, image, needThumbnail, false, undefined);
    }
    
    static simpleEmbed(server, channel, text, image, needThumbnail, willDelete, time)
    {
        if(needThumbnail)
        {

            let messageOption = {
                    embeds: [
                        {
                            color: '000000',
                            description: text,
                            thumbnail: {
                                url: 'attachment://file.jpg'
                            }
                        }
                    ],
                    files: [image]
                };

            if(willDelete)
            {
                channel.send(messageOption).then(msg => {
                    server.global.messageTemp.push(
                        {
                            messageId:msg.id,
                            channelId:msg.channel.id
                        }
                    );
                    this.serverSave(server);

                    setTimeout(() => {
                        for(let i=0; i < server.global.messageTemp.length; i++)
                        {
                            if(server.global.messageTemp[i].messageId == msg.id)
                            {
                                server.global.messageTemp.splice(i,1);
                                msg.delete();
                                this.serverSave(server);
                                break;
                            }
                        }
                    }, time)
                });
            }
            else channel.send(messageOption);
        }
        else
        {
            let messageOption = {
                embeds: [
                    {
                        color: '000000',
                        description: text
                    }
                ]
            };

            if(willDelete)
            {
                channel.send(messageOption).then(msg => {
                    let object = {
                        messageId:msg.id,
                        channelId:msg.channel.id
                    };
                    server.global.messageTemp.push(object);
                    this.serverSave(server);

                    setTimeout(() => {
                        for(let i=0; i < server.global.messageTemp.length; i++)
                        {
                            if(server.global.messageTemp[i].messageId == msg.id)
                            {
                                server.global.messageTemp.splice(i,1);
                                msg.delete();
                                this.serverSave(server);
                                break;
                            }
                        }
                    }, time)
                });
            }
            else channel.send(messageOption);
        }
    }

    static findUserId(element, guild)
    {
        var id = undefined;
        if(element.startsWith('<@!')) return element.substring(3,element.length-1);
        else
        {
            if(guild.members.cache.get(element) != undefined) return element;
            guild.members.cache.find(member => {
                if(member.user.username == element) id=member.user.id
            });
            return id;
        }
    }

    static findChannel(server, element) // return a channel. The function accepte the Id, a channel ping or the name.
    {
        var channel;
        if( element.startsWith('<#') )
        {
            channel = server.global.guild.channels.cache.get( element.substring(2, element.length - 1) );
            if(channel == undefined) return undefined;
            else if(channel.type != 'voice') return undefined;
            return channel.id;
        }
        else if( element.length == 18 && !Number.isNaN(element) )
        {
            channel = server.global.guild.channels.cache.get(element);
            if(channel == undefined) return undefined;
            else if(channel.type != 2) return undefined;
            return channel;
        }
        else
        {
            server.global.guild.channels.cache.each(chn => {
                    if(chn.name.toLocaleLowerCase().startsWith( element.toLocaleLowerCase() ))
                    {
                        channel = chn;
                    }
                });
            return channel;
        }
    }

    static isElementPresentInArray(array, element)
    {
        let isPresent = false;
        if(array == undefined) return false;
        array.forEach(elementOfArray => {
            if(elementOfArray === element) isPresent = true;
            else isPresent = false;
        });
        return isPresent;
    }

    static serverSave(server)
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
        
        FS.writeFileSync(`../storage/discordServers/${server.global.guildId}/${server.global.guildId}.json`, JSON.stringify(server));
        
        server.global.voiceConnection = voiceConnectionBackup;
        server.global.guild = guildBackup;
        server.audio.Engine = engineBackup;
        server.audio.resource = resourceBackup;
    }

    static serversBackup(servers, client)
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

            FS.writeFileSync(`../storage/discordServersBackup/${guild.id}/${Date.now()}.json`, JSON.stringify(servers[guild.id]));

            servers[guild.id].global.voiceConnection = voiceConnectionBackup;
            servers[guild.id].global.guild = guildBackup;
            servers[guild.id].audio.Engine = engineBackup;
            servers[guild.id].audio.resource = resourceBackup;
        });
    }
    
    static clearLogs(message)
    {
        if(message.author.id !== '606684737611759628') return;
        FS.writeFileSync(`c:/users/ruiseki/.pm2/logs/main-error.log`, '');
        FS.writeFileSync(`c:/users/ruiseki/.pm2/logs/main-out.log`, '');
    }
}