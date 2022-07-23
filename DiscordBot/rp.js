const FS = require('fs');
const Discord = require('discord.js');
const { compileFunction } = require('vm');
const Tools = require('./tools.js');

module.exports = class RP
{
    static cmd(server,message,command,args)
    {
        message.delete();
        if(command === 'tankrq') this.tankrq(command,message,args)
        else if(command === 'planerq') this.planerq(command,message,args)
        else if(command === 'elimin' || command === 'elimination') this.elimination(command,message,args);
        else if(command === 'bomb') this.bomb(command,message,args);
        else if(command === 'strafing' || command === 'straf') this.strafing(command,message,args);
        else if(command === 'neko') this.neko(command,message);
        else return false;
        return true;
    }

    static planerq(command,message,args)
    {
        console.log(`command -planerq detected. Executed by ${message.author.username}.`);
        if(args[0])
        {
            var u=Tools.findUserId(args[0],message);
            if(u == undefined) message.channel.send(`[...]`);
            else u=message.guild.members.cache.get(u);
            this.embedPingGif(`**PLANE REQUEST**`,`${u.user.username}, ***${message.author.username} IS WAITING YOU TO THE BATTLEFIELD***`,this.getGifPath(command),message,u.user.username);
        }
        else
        {
            message.channel.send(`It's ok Goshujin-sama, but I need a target.`);
        }
    }

    static tankrq(command,message,args)
    {
        console.log(`command -tankrq detected. Executed by ${message.author.username}.`);
        if(args[0])
        {
            var u=Tools.findUserId(args[0],message);
            if(u == undefined) message.channel.send(`[...]`);
            else u=message.guild.members.cache.get(u);
            this.embedPingGif(`**TANK REQUEST**`,`${u.user.username}, ***${message.author.username} IS WAITING YOU TO THE BATTLEFIELD***`,this.getGifPath(command),message,u.user.username);
        }
        else
        {
            message.channel.send(`It's ok Goshujin-sama, but I need a target.`);
        }
    }

    static bomb(command,message,args)
    {
        console.log(`command -bomb detected. Executed by ${message.author.username}.`);
        if(args[0])
        {
            this.embedPingGif(`**BOMB ATTACK**`,`*${args[0]}* **was bombed by** *${message.author.username}*`,this.getGifPath(command),message,args[0]);
        }
        else message.channel.send(`It's ok Goshujin-sama, but I need a target.`);
    }

    static strafing(command,message,args)
    {
        command = 'strafing';
        console.log(`command -strafing detected. Executed by ${message.author.username}.`);
        if(args[0])
        {
            this.embedPingGif(`CLOSE AIR SUPPORT`,`*${args[0]}* **was destroyed by** *${message.author.username}*`,this.getGifPath(command),message,args[0]);
        }
        else message.channel.send(`It's ok Goshujin-sama, but I need a target.`);
    }

    static battleship()
    {

    }

    static nuke()
    {

    }

    static elimination(command,message,args)
    {
        command = 'elimination';
        if(args[0])
        {
            console.log(`command -elimination detected. Executed by ${message.author.username}.`);
            this.embedPingGif(`**Make way, peasant**`,`**${message.author.username} move** *${args[0]}* **out of the way.**`,this.getGifPath(command),message,args[0]);
        }
        else message.channel.send(`It's ok Goshujin-sama, but I need a target.`);
    }

    static neko(command,message)
    {
        console.log(`command -neko detected. Executed by ${message.author.username}.`);
        this.embedGif('',command,message);
    }

    static getGifPath(command)
    {
        var files = this.getGifsOfFolder(`./Picture/rp/${command}`);
        var gifID = Tools.getRandomInt(files.length-1);
        return `./Picture/rp/${command}/${files[gifID]}`;
    }

    static embedGif(title,command,message)
    {
        var imgPath = this.getGifPath(command);
        var imgName = imgPath.split('/')
        var embed = new Discord.MessageEmbed()
            .setColor(`000000`)
            .setTitle(title)
            .setImage(`attachment://${imgName[imgName.length-1]}`);
        message.channel.send({
            embeds :[embed],
            file : [imgPath]
        });
    }

    static embedPingGif(title,text,imgPath,message,targetName)
    {
        message.channel.send(`${targetName}-sama, ${message.author.username} is pinging you.`)
        var embed = new Discord.MessageEmbed()
            .setColor('000000')
            .setTitle(title)
            .setDescription(text)
            .setImage(`attachment://file.gif`);
        message.channel.send({
            embeds: [embed],
            files: [imgPath]
        });
    }

    static getGifsOfFolder(folder)
    {
        var files = FS.readdirSync(folder);
        var result = [];
        for(var file of files)
        {
            if(file.substring(file.length-4) === ".gif") result.push(file);
        }
        return result;
    }

    static findUserID(element,message)
    {
        var id=undefined;
        if(element.startsWith('<@!')) return element.substring(3,element.length-1);
        else
        {
            if(message.guild.members.cache.get(element) != undefined) return element;
            message.guild.members.cache.find(member => {
                if(member.user.username == element) id=member.user.id
            });
            return id;
        }
    }
}