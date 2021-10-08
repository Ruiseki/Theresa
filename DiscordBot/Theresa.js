const Discord = require('discord.js');
const FS = require('fs');

const Help = require('./help.js');

module.exports = class About
{



    static cmd(servers,command,client,message,args,Audio)
    {
        if(command === 'join') this.join(message);
        else if(command === 'leave') this.leave(servers,message,Audio);
        else if(command === 'down') this.down(message,client);
        else if(command === 'moveuser' || command === 'm') this.moveAllUser(args,message); // --> help
        else if(command === 'me') this.me(message);
        else if(command === 'devreport') this.DevReport(message);

        else if(command === 'rec' || command == 'recall') this.recallPing(servers,message,args);
        else if(command === 'recv' || command == 'recallvoice') this.recallVoicePing(servers,message,args); // --> help

        else if(command === 'showservers') this.showServers(servers,message);
        else if(command === 'leaveserver') this.leaveServer(message);
        else if(command === 'invitelink') this.inviteLink(client,message); // --> help
        else if(command === 'save') this.savePlace(message);
        
        else if(command === 'dr') this.decoReco(servers,message)

        else return false;
        return true;
    }

    static serverSave()
    {
        JSON.stringify(servers,function(key,value){

        });
    }

    static decoReco(servers,message)
    {
        let server = servers[message.guild.id];
    }

    static moveAllUser(args,message)
    {
        message.delete();
        if(!args[0]) {message.channel.send(`[...]`); return;}
        if(message.guild.me.voice.channel == null) {message.channel.send(`[...]`); return;}
        var channel=this.findChannel(args[0],message);
        if(channel=='#undefined#') {message.channel.send(`[...]`); return;}
        channel=message.guild.channels.cache.get(channel);
        var userInVoiceChannel=message.guild.me.voice.channel.members.array();
        if(userInVoiceChannel==null) {message.channel.send(`[...]`); return;}
        for(var i=0;i<userInVoiceChannel.length;i++)
        {
            userInVoiceChannel[i].voice.setChannel(channel)
        }
    }
    
    static updateAllserver()
    {
        var tabServ=FS.readdirSync(`./Servers/`,'utf8');
        for(id of tabServ)
        {
            if(!FS.existsSync(`./Servers${id}`)) FS.mkdirSync(`./Servers/${id}`);
            if(!FS.existsSync(`./Servers/${id}/queueSave.Stsave`)) FS.writeFileSync(`./Servers/${id}/queueSave.tsave`,'');
            if(!FS.existsSync(`./Servers/${id}/ServerInfo.tsave`)) FS.writeFileSync(`./Servers/${id}/ServerInfo.tsave`,'');
            if(!FS.existsSync(`./Servers/${id}/userOption`)) FS.mkdirSync(`./Servers/${id}/userOption`,'');
        }
    }

    static savePlace(message)
    {
        FS.writeFileSync(`./Servers/${message.guild.id}/ServerInfo.tsave`,message.channel.name+`\n`);
        if(message.guild.me.voice.channel) FS.appendFileSync(`./Servers/${message.guild.id}/ServerInfo.tsave`,message.guild.me.voice.channel.name);
        else FS.appendFileSync(`./Servers/${message.guild.id}/ServerInfo.tsave`,`---`);
    }

    static recallPing(servers,message,args)
    {
        message.delete();
        console.log(`Command -recallping detected. Executed by ${message.author.username}. Parameter : ${args[0]} and ${args[1]}`);
        var link=`./Servers/${message.guild.id}/userOption/${message.author.id}/`;
        var server=servers[message.guild.id].recallPingUser;
        if(!args[0]) return;
        else if(args[0] == 'enable')
        {
            for(var i=0;i<server.user.length;i++) if(server.user[i] == message.author.id) {message.channel.send('You are already in the user list !'); return;}
            server.user.push(message.author.id);
            try {FS.mkdirSync(link);} catch {}
            FS.writeFileSync(link+'userList.tuser','');
            message.channel.send(`${message.author.username}, You have now a personnal alerte !`);
        }
        else if(args[0] == 'disable')
        {
            for(var i=0;i<server.user.length;i++) if(server.user[i] == message.author.id) 
            {
                message.channel.send(`${message.author.username}, Your personnal alerte has been disable.`);
                server.user.splice(i,1);
                FS.unlinkSync(link+'userList.tuser');
                try {FS.rmdirSync(link);} catch {}
                return;
            }
            message.channel.send(`${message.author.username}, your custom alerte is currently disable !`);
        }
        else if(args[0] == 'add' || args[0] == 'a')
        {
            for(var id of server.user)
            {
                if(id != message.author.id) continue;
                if(!args[1]) {message.channel.send('I need to know who is the user you want to add to your personal alerte !'); return;}
                var tab=FS.readFileSync(link+'userList.tuser','utf8').split(/\n/);
                if(tab.length == 1 && tab[0] == '') tab.shift();
                if(args[1] == 'allmembers')
                {
                    tab.splice(0,tab.length);
                    message.guild.members.cache.forEach(member => {
                        if(!member.user.bot && member.user.id != message.author.id) tab.push(member.user.id);
                    })
                    for(var x=0;x<tab.length;x++)
                    {
                        if(x==tab.length-1 && x==0) FS.writeFileSync(link+'userList.tuser',tab[x]);
                        else if(x==tab.length-1) FS.appendFileSync(link+'userList.tuser',tab[x]);
                        else if(x==0) FS.writeFileSync(link+'userList.tuser',tab[x]+'\n');
                        else FS.appendFileSync(link+'userList.tuser',tab[x]+'\n');
                    }
                    message.channel.send(`${message.author.username}, you have added **all members of this server** to your custom alerte !`);
                    return;
                }
                var userID = this.findUserID(args[1],message);
                if(userID == '#undefined#') {message.channel.send(`The specified user doesn't exist.`); return;}
                tab.push(userID);
                for(var x=0;x<tab.length;x++)
                {
                    if(x==tab.length-1 && x==0) FS.writeFileSync(link+'userList.tuser',tab[x]);
                    else if(x==tab.length-1) FS.appendFileSync(link+'userList.tuser',tab[x]);
                    else if(x==0) FS.writeFileSync(link+'userList.tuser',tab[x]+'\n');
                    else FS.appendFileSync(link+'userList.tuser',tab[x]+'\n');
                }
                var u=message.guild.members.cache.get(userID);
                message.channel.send(`You have added **${u.user.username}** to your custom alerte !`);
                return;
            }
            message.channel.send(`${message.author.username}, your custom alerte is currently disable !`);
        }
        else if(args[0] == 'remove' || args[0] == 'r')
        {
            for(var id of server.user)
            {
                if(id != message.author.id) continue;
                if(!args[1]) {message.channel.send('I need to know who is the user you want to add to your personal alerte !'); return;}
                
                var tab=FS.readFileSync(link+'userList.tuser','utf8').split(/\n/);
                if(tab.length == 1 && tab[0] == '') tab.shift();
                var userID = this.findUserID(args[1],message);
                if(userID == '#undefined#') {message.channel.send(`The specified user doesn't exist.`); return;}
                for(var i=0;i<tab.length;i++)
                {
                    if(tab[i] == userID)
                    {
                        var u=message.guild.members.cache.get(userID);
                        message.channel.send(`You have removed **${u.user.username}** to your custom alerte !`);
                        tab.splice(i,1);
                        if(tab.length==0)
                        {
                            FS.writeFileSync(link+'userList.tuser','');
                            return;
                        }
                        for(var x=0;x<tab.length;x++)
                        {
                            if(x==tab.length-1 && x==0) FS.writeFileSync(link+'userList.tuser',tab[x]);
                            else if(x==tab.length-1) FS.appendFileSync(link+'userList.tuser',tab[x]);
                            else if(x==0) FS.writeFileSync(link+'userList.tuser',tab[x]+'\n');
                            else FS.appendFileSync(link+'userList.tuser',tab[x]+'\n');
                        }
                        return;
                    }
                }
                message.channel.send('The specified user isn\'t in your list !');
                return;
            }
            message.channel.send(`${message.author.username}, your custom alerte is currently disable !`);
        }
        else if(args[0] == 'view')
        {
            for(var id of server.user)
            {
                if(id != message.author.id) continue;
                var tab=FS.readFileSync(link+'userList.tuser','utf8').split(/\n/);
                if(tab.length == 1 && tab[0] == '') tab.shift();
                for(var i=0;i<tab.length;i++)
                {
                    var u=message.guild.members.cache.get(tab[i]);
                    tab[i]=u.user.username;
                }
                message.channel.send('Here is the list of users you have added : ');
                message.channel.send(tab);
                return;
            }
            message.channel.send(`${message.author.username}, your custom alerte is currently disable !`);
        }
    }

    static recallVoicePing(servers,message,args)
    {
        message.delete();
        console.log(`Command -recallvoice detected. Executed by ${message.author.username}.`);
        var server=servers[message.guild.id].recallVoicePingUser;
        var link=`./Servers/${message.guild.id}/userOption/${message.author.id}/`;
        if(!args[0])
        {
            message.channel.send(`[...]`);
            return;
        }
        else if(args[0] == 'enable' || args[0] == 'e')
        {
            for(var user of server.user) 
            {
                if(user == message.author.id) 
                {
                    message.channel.send(`*[**${message.author.username}**]* Your custom alerte is already enable !`); 
                    return;
                }
            }

            try {FS.mkdirSync(link)} catch {}
            FS.writeFileSync(link+`userVoiceList.tuser`,'');
            FS.writeFileSync(link+`channelVoiceList.tchn`,'');
            server.usersAndChannels[message.author.id]={
                userID:[],
                channel:[]
            };
            server.user.push(message.author.id);
            message.channel.send(`*[**${message.author.username}**]* Your custom alerte is now enable !`);
        }
        else if(args[0] == 'disable' || args[0] == 'd')
        {
            for(var user of server.user)
            {
                if(user == message.author.id)
                {
                    FS.unlinkSync(link+'userVoiceList.tuser');
                    FS.unlinkSync(link+`channelVoiceList.tchn`);
                    try {FS.rmdirSync(link);} catch {}
                    for(var i=0;i<server.user.length;i++)
                    {
                        if(server.user[i] != message.author.id) continue;
                        server.user.splice(i,1);
                        break;
                    }
                    server.usersAndChannels.splice(message.author.id,1);
                    message.channel.send(`*[**${message.author.username}**]*  Your personnal alerte has been disable.`);
                    return;
                }
            }
            message.channel.send(`*[**${message.author.username}**]* Please enable your custom alerte first !`);
        }
        else if(args[0] == 'add' || args[0] == 'a')
        {
            if(server.user.length==0) {message.channel.send(`Please enable your custom alerte first !`); return;}
            for(var i=0;i<server.user.length;i++)
            {
                if(server.user[i]!=message.author.id && i==server.user.length-1) {message.channel.send(`Please enable your custom alerte first !`); return;}
                else if(server.user[i]!=message.author.id && i!=server.user.length-1) continue;
            }
            if(!args[1]) {message.channel.send('I need to know who is the user you want to add to your personal alerte !'); return;}
            else if(!args[2]) {message.channel.send('I need to know what is the voice channel !'); return;}
            var id=this.findUserID(args[1],message),channelID=this.findChannel(args[2],message);
            if(id == '#undefined#') {message.channel.send(`The specified user doesn't exist !`); return};
            if(channelID == '#undefined#') {message.channel.send(`The specified channel doesn't exist !`); return};
            server.usersAndChannels[message.author.id].userID.push(id);
            server.usersAndChannels[message.author.id].channel.push(channelID);
            for(var i=0;i<server.usersAndChannels[message.author.id].userID.length;i++)
            {
                if(i==server.usersAndChannels[message.author.id].userID.length-1)
                {
                    FS.appendFileSync(`${link}userVoiceList.tuser`,`${server.usersAndChannels[message.author.id].userID[i]}`);
                    FS.appendFileSync(`${link}channelVoiceList.tchn`,`${server.usersAndChannels[message.author.id].channel[i]}`);
                }
                else if(i==0)
                {
                    FS.writeFileSync(`${link}userVoiceList.tuser`,`${server.usersAndChannels[message.author.id].userID[i]}\n`);
                    FS.writeFileSync(`${link}channelVoiceList.tchn`,`${server.usersAndChannels[message.author.id].channel[i]}\n`);
                }
                else
                {
                    FS.appendFileSync(`${link}userVoiceList.tuser`,`${server.usersAndChannels[message.author.id].userID[i]}\n`);
                    FS.appendFileSync(`${link}channelVoiceList.tchn`,`${server.usersAndChannels[message.author.id].channel[i]}\n`);
                }
            }
            let u=message.guild.members.cache.get(id),c=message.guild.channels.cache.get(channelID);
            message.channel.send(`*[**${message.author.username}**]* Successfully added : ***${u.user.username}*** -> __${c.name}__`);
        }
        else if(args[0] == 'view' || args[0] == 'v')
        {
            if(server.user.length==0) {message.channel.send(`*[**${message.author.username}**]* Please enable your custom alerte first !`); return;}
            for(var i=0;i<server.user.length;i++)
            {
                if(server.user[i]!=message.author.id && i==server.user.length-1) {message.channel.send(`*[**${message.author.username}**]* Please enable your custom alerte first !`); return;}
                else if(server.user[i]==message.author.id) break;
                else if(server.user[i]!=message.author.id && i!=server.user.length-1) continue;
            }

            let tab=FS.readFileSync(link+'userVoiceList.tuser','utf-8').split(/\n/);
            if(tab.length==1 && tab[0]=='')
            {
                message.channel.send('*[**${message.author.username}**]* You have nobody in your list.');
                return;
            }

            let userName,channelName,tabChannels=[],final='',currentID,serverUserID=[],serverChannel=[];
            for(let i=0;i<server.usersAndChannels[message.author.id].userID.length;i++)
            {
                serverUserID.push(server.usersAndChannels[message.author.id].userID[i]);
                serverChannel.push(server.usersAndChannels[message.author.id].channel[i]);
            }

            while(serverUserID.length!=0)
            {
                currentID=serverUserID[0];
                userName=message.guild.members.cache.get(currentID); userName=userName.user.username;
                channelName=message.guild.channels.cache.get(serverChannel[0]); channelName=channelName.name; tabChannels.push(channelName);
                serverUserID.splice(0,1);
                serverChannel.splice(0,1);
                for(let i=0;i<serverUserID.length;i++)
                {
                    if(serverUserID[i]==currentID)
                    {
                        channelName=message.guild.channels.cache.get(serverChannel[i]); channelName=channelName.name; tabChannels.push(channelName);
                        serverUserID.splice(i,1);
                        serverChannel.splice(i,1);
                        i--;
                    }
                }
                channelName='';
                for(let name of tabChannels)
                {
                    channelName+=`${name}\n`;
                }
                console.log();
                final+='***'+userName+'***'+' :\n'+channelName+'\n';
                tabChannels.splice(0,tabChannels.length);
            }

            message.channel.send(`***${message.author.username}***, here are the corresponding users and channels that you added : \n\n${final}`);
        }
        else if(args[0] == 'remove' || args[0] == 'r')
        {
            if(server.user.length==0) {message.channel.send(`*[**${message.author.username}**]* Please enable your custom alerte first !`); return;}
            for(var i=0;i<server.user.length;i++)
            {
                if(server.user[i]!=message.author.id && i==server.user.length-1) {message.channel.send(`*[**${message.author.username}**]* Please enable your custom alerte first !`); return;}
                else if(server.user[i]!=message.author.id && i!=server.user.length-1) continue;
            }

            if(!args[1]) {message.channel.send('[...]'); return;}
            if(args[1] == 'reset')
            {
                server.usersAndChannels[message.author.id].userID=[];
                server.usersAndChannels[message.author.id].channel=[];
                FS.writeFileSync(link+'userVoiceList.tuser','');
                FS.writeFileSync(link+'channelVoiceList.tchn','');
                message.channel.send(`***${message.author.username}***, your selected users and channels have been reset.`);
                return;
            }
            else
            {
                let id=this.findUserID(args[1],message);
                if(id == '#undefined#') {message.channel.send(`*[**${message.author.username}**]* The specified user doesn't exist !`); return};
                let u=message.guild.members.cache.get(id);
                let userID=server.usersAndChannels[message.author.id].userID,channel=server.usersAndChannels[message.author.id].channel;

                if(args[2])
                {
                    let channelID=this.findChannel(args[2],message);
                    if(channelID == '#undefined#') {message.channel.send(`*[**${message.author.username}**]* The specified channel doesn't exist !`); return};
                    let c=message.guild.channels.cache.get(channelID);
                    for(let i=0;i<userID.length;i++)
                    {
                        if(userID[i]==id && channel[i]==channelID)
                        {
                            userID.splice(i,1);
                            channel.splice(i,1);
                            for(var x=0;x<userID.length;x++)
                            {
                                if(x==userID.length-1)
                                {
                                    FS.appendFileSync(`${link}userVoiceList.tuser`,`${userID[x]}`);
                                    FS.appendFileSync(`${link}channelVoiceList.tchn`,`${channel[x]}`);
                                }
                                else if(x==0)
                                {
                                    FS.writeFileSync(`${link}userVoiceList.tuser`,`${userID[x]}\n`);
                                    FS.writeFileSync(`${link}channelVoiceList.tchn`,`${channel[x]}\n`);
                                }
                                else
                                {
                                    FS.appendFileSync(`${link}userVoiceList.tuser`,`${userID[x]}\n`);
                                    FS.appendFileSync(`${link}channelVoiceList.tchn`,`${channel[x]}\n`);
                                }
                            }
                            message.channel.send(`*[**${message.author.username}**]* Successfully delete : ***${u.user.username}*** -> __${c.name}__`);
                            return;
                        }
                    }
                    message.channel.send(`*[**${message.author.username}**]* Can't delete ***${u.user.username}*** -> __${c.name}__. Maybe you don't have added this.`);
                    return;
                }

                if(userID.find(element => element==id) == undefined) {message.channel.send(`*[**${message.author.username}**]* You don't add this user to your list ! (***${u.user.username}***)`); return;}
                for(let i=0;i<userID.length;i++)
                {
                    if(userID[i]==id)
                    {
                        userID.splice(i,1);
                        channel.splice(i,1);
                        i--;
                    }
                }
                FS.writeFileSync(`${link}userVoiceList.tuser`,'');
                FS.writeFileSync(`${link}channelVoiceList.tchn`,'');
                for(var i=0;i<userID.length;i++)
                {
                    if(i==userID.length-1)
                    {
                        FS.appendFileSync(`${link}userVoiceList.tuser`,`${userID[i]}`);
                        FS.appendFileSync(`${link}channelVoiceList.tchn`,`${channel[i]}`);
                    }
                    else if(i==0)
                    {
                        FS.writeFileSync(`${link}userVoiceList.tuser`,`${userID[i]}\n`);
                        FS.writeFileSync(`${link}channelVoiceList.tchn`,`${channel[i]}\n`);
                    }
                    else
                    {
                        FS.appendFileSync(`${link}userVoiceList.tuser`,`${userID[i]}\n`);
                        FS.appendFileSync(`${link}channelVoiceList.tchn`,`${channel[i]}\n`);
                    }
                }
                message.channel.send(`*[**${message.author.username}**]* Succssfully delete the user ***${u.user.username}*** from your custom alerte`);
            }
        }
        else
        {

        }
    }

    static specialChannelCreation(guild)
    {
        guild.channels.create(`Theresa'sTemporaryChannel`,{type : 'text'});
        //  channel = guild.channels.cache.find()
    }

    static boot(client,servers)
    {
        var serversTab = client.guilds.cache.array();
        for(var i=0;i<serversTab.length;i++)
        {
            var guildID = serversTab[i].id;
            var path = `./Servers/${guildID}/queueSave.tsave`;
            var oldQueue = FS.readFileSync(path,'utf8').split(/\n/);
            this.objectGenerator(servers,guildID);
            
            //voiceChannel reconnection
            var tab = FS.readFileSync(`./Servers/${guildID}/ServerInfo.tsave`,'utf8').split(/\n/);
            if(tab[1] != undefined && tab[1] != '---')
            {
                var channel = serversTab[i].channels.cache.find(channel => channel.name==tab[1]);
                try{
                    channel.join();
                }
                catch(error){
                    console.log(`Can not join the channel ${tab[1]} on the server ${serversTab[i].name}.`);
                    console.log(tab[1]);
                    console.error(error);
                }
            }
            
            //recallPingUser
            tab = FS.readdirSync(`./Servers/${guildID}/userOption`,'utf8');
            var server = servers[guildID].recallPingUser;
            for(var id of tab)
            {
                if(FS.existsSync(`./Servers/${guildID}/userOption/${id}/userList.tuser`)) server.user.push(id);
            }

            //recallVoicePingUser
            server=servers[guildID].recallVoicePingUser;
            var tabUser=[],tabID=[],tabChannel=[],link=`./Servers/${guildID}/userOption/`;
            tabUser=FS.readdirSync(link,'utf8');
            for(var id of tab)
            {
                if(FS.existsSync(`${link}${id}/userVoiceList.tuser`) && FS.existsSync(`${link}${id}/channelVoiceList.tchn`))
                {
                    server.user.push(id);
                    tabID=FS.readFileSync(`${link}${id}/userVoiceList.tuser`,'utf8').split(/\n/);
                    tabChannel=FS.readFileSync(`${link}${id}/channelVoiceList.tchn`,'utf8').split(/\n/);
                    server.usersAndChannels[id]={
                        userID:[],
                        channel:[]
                    }
                    server.usersAndChannels[id].userID=tabID;
                    server.usersAndChannels[id].channel=tabChannel;
                }
            }
            
            /* //Audio
            server = servers[guildID].audio;
            if(oldQueue[oldQueue.length-1] !== 'inPlaying') continue;
            for(var music of oldQueue) server.queue.push(music);
            channel = client.channels.cache.find(channel => channel.name == FS.readFileSync(`./Servers/${guildID}/ServerInfo.tsave`,'utf8').split(/\n/)[0]);
            channel.send(`I'm back !`); */

            console.log(`### Server ${serversTab[i].name} load ###`);
        }
    }

    static objectGenerator(servers,id)
    {
        servers[id]=
        {
            global:{
                lastTextChannelID:undefined,
                lastVoiceChannelID:undefined
            },
            recallVoicePingUser:{
                user:[],
                usersAndChannels:[/*
                    {
                        userID:[],
                        channel:[]
                    }
                */]
            },
            recallPingUser:{
                user:[]
            },
            audio:{
                Engine:undefined,
                queue:[],
                lastQueue:{
                    messageID:undefined,
                    channelID:undefined
                },
                messageTemp:[],
                currentPlayingSong:undefined,
                isPlaying:false,
                pause:false,
                loop:false,
                queueLoop:false,
                leave:false,
                arret:false,
                restart:false,
            },
            elite:{
                downloading:false,
                user:[],
                userOption:[
                    /*
                    position:undefined,
                    */
                ],
            }
        };
    }

    static me(message)
    {
        message.delete();
        console.log(`Command -me detected. Executed by ${message.author.username}.`);
        if(message.author.username === 'Ruiseki')
        {
            message.channel.send('Ohayō Goshujin-sama ! You don\'t remember me ?! Sad...');
        }
        else
        {
            message.channel.send('Hello ! I am **Theresa**, a bot created by __Ruiseki__.'
            +'I am currently in development, so be patient ! I will be here in a short time.');
        }
    }

    static smallChange(message)
    {

    }

    static DevReport(message)
    {
        message.delete();
        if(message.author.id != '606684737611759628') return;
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
        message.channel.send(embed);
        message.channel.send('@everyone');

        /*
        
        Ecrire ici les nouveautées

        */
    }

    static down(message,client)
    {
        console.log(`command -down detected. Executed by ${message.author.username}.`);
        if(message.author.id != '606684737611759628') return;
        message.delete();
        client.user.presence.status='offline';
    }

    static join(message)
    {
        console.log(`command -join detected. Executed by ${message.author.username}.`);
        message.delete();
        message.member.voice.channel.join();
    }

    static leave(servers,message,Audio)
    {
        console.log(`command -leave detected. Executed by ${message.author.username}.`);
        message.delete();
        if(!message.guild.me.voice.channel) return;
        var server=servers[message.guild.id];
        server.audio.leave=true,server.audio.restart=false;
        if(server.audio.Engine != undefined) server.audio.Engine.end();
        message.guild.me.voice.channel.leave();
    }

    static leaveServer(message)
    {
        message.delete();
        if(message.author.id != '606684737611759628') return;
        else message.guild.leave();
    }

    static findUserID(element,message)
    {
        var id='#undefined#';
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

    static findChannel(element,message)
    {
        var channel;
        if(element.startsWith('<#'))
        {
            channel=message.guild.channels.cache.get(element.substring(2,element.length-1));
            if(channel==undefined) {return '#undefined#';}
            else if(channel.type!='voice') {return '#undefined#';}
            return channel.id;
        }
        else if(element.length==18 && !Number.isNaN(element))
        {
            channel=message.guild.channels.cache.get(element);
            if(channel==undefined) {return '#undefined#';}
            else if(channel.type!='voice') {return '#undefined#';}
            return channel.id;
        }
        else
        {
            var tab=[];
            message.guild.channels.cache.forEach(c => {
                if(c.type == 'voice') tab.push(c.name);
            });
            var results=[];
            for(var channelName of tab) if(channelName.toLocaleLowerCase().startsWith(element.toLocaleLowerCase())) results.push(channelName);
            if(results.length==0) {return '#undefined#';}
            else if(results.length>1) {return '#undefined#';}
            message.guild.channels.cache.forEach(c => {
                if(c.name==results[0]) channel=c.id;
            });
            return channel;
        }
    }

    static async inviteLink(client,message)
    {
        message.delete();
        message.author.send(await client.generateInvite());
    }

    static showServers(servers,message)
    {
        message.delete();
        console.log(servers);
    }
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------//

    
}