import shell from 'shelljs';
import { rmSync } from 'fs';
import { client, serverSave } from './theresa.mjs';

export function reboot()
{
    shell.exec('pm2 restart dbot');
}

export function getRandomInt(max)
{
    var alea = Math.floor(Math.random() * (max+1));
    return alea;
}

export function sleep(milliseconds)
{
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

export function simpleEmbed(server, channel, text, image, needThumbnail, willDelete, time)
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
                serverSave(server);

                setTimeout(() => {
                    for(let i=0; i < server.global.messageTemp.length; i++)
                    {
                        if(server.global.messageTemp[i].messageId == msg.id)
                        {
                            server.global.messageTemp.splice(i,1);
                            msg.delete();
                            serverSave(server);
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
                serverSave(server);

                setTimeout(() => {
                    for(let i=0; i < server.global.messageTemp.length; i++)
                    {
                        if(server.global.messageTemp[i].messageId == msg.id)
                        {
                            server.global.messageTemp.splice(i,1);
                            msg.delete();
                            serverSave(server);
                            break;
                        }
                    }
                }, time)
            });
        }
        else channel.send(messageOption);
    }
}

export function findChannel(server, element) // return a channel. The function accepte the Id, a channel ping or the name.
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

export function clearLogs()
{
    rmSync(`${process.env.USERPROFILE}\\.pm2\\logs\\discordBot-error.log`);
    rmSync(`${process.env.USERPROFILE}\\.pm2\\logs\\discordBot-out.log`);
}

export function findUserId(element, guild)
{
    var id = undefined;
    if(element.startsWith('<@!')) return element.substring(3,element.length-1);
    else
    {
        if(guild.members.cache.get(element) != undefined) return element;
        guild.members.cache.find(member => {
            if(member.user.username == element || member.user.globalName == element) id=member.user.id
        });
        return id;
    }
}

export function isElementPresentInArray(array, element)
{
    let isPresent = false;
    if(array == undefined) return false;
    array.forEach(elementOfArray => {
        if(elementOfArray === element) isPresent = true;
        else isPresent = false;
    });
    return isPresent;
}

export function isUserPresentInVoiceChannel(userId, voiceChannelId)
{
    let channel = client.channels.cache.get(voiceChannelId);
    let member = channel.guild.members.cache.get(userId);

    if( member.voice.channel && member.voice.channel.id == channel.id ) return true;
    else return false;
}