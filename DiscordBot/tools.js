const shell = require('shelljs'),
    FS = require('fs'),
    Discord = require('discord.js');

module.exports = class tools
{
    static cmd(server,command,message,args,client,Audio,Theresa)
    {
        if(command === 'clear') this.clear(server,message,args);
        else if(command === 'cleardm') this.clearDM(client,message);
        else if(command === 'rns' || command === 'restartnextsong') this.restartNextSong(server,message);
        else if(command === 'restart' || command === 'r') this.restart(message,Theresa);
        else if(command === 'logerror') this.logError(message);
        else if(command === 'log') this.log(message);
        else if(command === 'clearlogs') this.clearLogs(message);


        else if(command === 'test' || command==='t') this.test(server,client,message,args,Audio);


        else return false;
        return true;
    }

    static async test(server,client,message,args,Audio)
    {
        console.log(`Test detected (${message.author.username})`);
        if(message.author.id != '606684737611759628') return;
        message.delete();

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

    static restartNextSong(server,message)
    {
        message.delete();
        console.log('### Theresa will restart after this music ###');
        server.audio.restart=true;
    }

    static restart(message,Theresa)
    {
        message.delete().then(() => {
            console.log('### Theresa has restarted ###');
            Theresa.savePlace(message);
            shell.exec('pm2 restart main');
        });
    }

    static async clearDM(client,message)
    {
        message.delete();
        console.log(`command -cleardm detected. Executed by ${message.author.username}.`);
        var DMchannel= await message.author.createDM();
        DMchannel.messages.fetch({limit:100}).then(messages => {
            var text=messages.filter(m => (m.author=client.user));
            console.log(`${text.size} message(s) have been deleted`);
            text.forEach(m => m.delete());
        });
    }
    
    static clear(server,message,args)
    {
        console.log(`command -clear detected. Executed by ${message.author.username}.`);
        if(message.author.id != '606684737611759628') {message.channel.send('Only my creator can do that'); return;}
        var nbr;
        if(!args[0]) nbr=100;
        else
        {
            nbr=Number.parseInt(args[0]);
            if(Number.isNaN(nbr))
            {
                message.channel.send('[...]');
                return;
            }
            nbr++;
            if(nbr < 0) nbr*=-1;
            if(nbr > 100) nbr=100;
        }
        var messagesImposteur=new Discord.MessageManager(message.channel);
        messagesImposteur.cacheType=message.channel.messages.cacheType;
        message.channel.messages.fetch({limit:nbr}).then(messages => {
            var text=messages.filter(m => Date.now()-m.createdTimestamp<1209600000);
            console.log(`${text.size} message(s) have been deleted`);
            text.forEach(m => 
                {
                    if(server.audio.lastQueue.messageID != undefined) // speed
                    {
                        if(server.audio.lastQueue.messageID == m.id)
                        {
                            server.audio.lastQueue.messageID = undefined;
                            server.audio.lastQueue.channelID = undefined;
                        }
                    }
                    for(let i=0; i < server.audio.messageTemp.length; i++)
                    {
                        if(m.id == server.audio.messageTemp[i].messageID)
                        {
                            server.audio.messageTemp.splice(i,1);
                        }
                    }
                    messagesImposteur.cache.set(`${m.id}`,m);
                });
            message.channel.bulkDelete(messagesImposteur.cache);
        });
    }

    static clearLogs(message)
    {
        message.delete();
        if(message.author.id !== '606684737611759628') return;
        FS.writeFileSync(`../../.pm2/logs/main-error.log`,'');
        FS.writeFileSync(`../../.pm2/logs/main-out.log`,'');
    }

    static logError(message)
    {
        message.delete();
        console.log(`command -logerror detected. Executed by ${message.author.username}.`);
        var log = FS.readFileSync(`../.pm2/logs/main-error.log`,'utf8').split(/\n/);
        log.splice(0,log.length-15);
        var Embed = new Discord.MessageEmbed()
            .setColor('#000000')
            .setTitle(`**:keyboard:  Logs from main-error  :keyboard:**`)
            .attachFiles([`./Picture/Theresa.jpg`])
            .setThumbnail(`attachment://Theresa.jpg`)
            .setDescription(log);
        message.channel.send(Embed);
    }

    static log(message)
    {
        message.delete();
        console.log(`command -log detected. Executed by ${message.author.username}.`);
        var log = FS.readFileSync(`../.pm2/logs/main-out.log`,'utf8').split(/\n/);
        log.splice(0,log.length-15);
        var Embed = new Discord.MessageEmbed()
            .setColor('#000000')
            .setTitle(`**:keyboard:  Logs from main-out  :keyboard:**`)
            .attachFiles([`./Picture/Theresa.jpg`])
            .setThumbnail(`attachment://Theresa.jpg`)
            .setDescription(log);
        message.channel.send(Embed);
    }
}