const Tools = require('../../tools.js');
const FS = require('fs');
const { group } = require('console');
var groupArray = [];

module.exports = class Coding {
    static cmd(server, message, command, args)
    {
        message.delete();

        if(message.guild.id != '889416369567834112') return;
        else if(command == 'groupe') this.sprintGroup(message);
        else if(command == 'remane' || command == 'r') this.rename(message, args);
        else if(command == 'test') this.test();
    }

    static checkWord(message)
    {
        let mots = message.content.split(/ +/);
        let forbidenWords = [
            "censure",
            "dictature",
            "liberté",
            "liberte",
            "lepen",
            "zemmour",
            "poutine",
            "nazi",
            "gay",
            "dictateur"
        ];

        for (let mot of mots)
        {
            for (let forbidenWord of forbidenWords)
            {
                if (mot.toLocaleLowerCase() == forbidenWord || mot.toLocaleLowerCase().startsWith('pradi'))
                {
                    console.log(`Forbiden word detected : ${mot}. Writed by ${message.author.username}`);
                    message.delete();
                    message.channel.send("**FORBIDEN WORD DETECTED**\nI've send the message in the void.")
                        .then(msg => {
                            setTimeout(function () {
                                msg.delete();
                            }, 10000)
                        });
                    return;
                }
            }
        }
    }

    static sprintGroup(message)
    {
        /* let membersNameArray = [];
        message.guild.members.cache.each(member => {
            if (member.user.id != '735541067759353957' && member.user.id != '532642158231027722' && !member.user.bot) membersNameArray.push(member.user.username)
        }); */

        // ------------------------------------------------------------
        // shuffle the array of members

        let membersNameArray = [
            '606684737611759628',
            '260502791707951115',
            '301301940640546817',
            '286547841889861634',
            '215499737497862144',
            '764149560904777788',
            '409080031223218177',
            '310798191153119232'
        ];

        for(let i = 0; i < membersNameArray.length; i++)
        {
            let u = message.guild.members.cache.get(membersNameArray[i]);
            membersNameArray[i] = u.user.username;
        }

        let tabAlea = [];
        while (membersNameArray[0])
        {
            var indiceAlea = Tools.getRandomInt(membersNameArray.length - 1);
            tabAlea.push(membersNameArray[indiceAlea]);
            membersNameArray.splice(indiceAlea, 1);
        }
        membersNameArray = tabAlea;
        
        // ------------------------------------------------------------
        // creating the object and the embed
        
        groupArray = [];
        let groupe = 0, text = "", arrayTemp = [];
        while (membersNameArray.length >= 4)
        {
            text += `**Groupe ${groupe + 1} : **\n`;
            arrayTemp = [];
            
            for(let i = 0; i < 4; i++)
            {
                arrayTemp.push(membersNameArray[0]);
                text += `*${membersNameArray.shift()}*\n`;
            }

            text += "\n";
            let objectElement = {
                name: `groupe${groupe+1}`,
                users: arrayTemp
            };
            groupArray.push(objectElement);
            
            groupe++;
        }

        // ------------------------------------------------------------
        // Deleting the old channels and create news

        /* groupArray.forEach((element, index) => {

            if(index != groupArray.length-1) FS.appendFileSync('./customServices/codingFactory/channel.tlist',`${element.name}\n`);
            else if(index == 0) FS.writeFileSync('./customServices/codingFactory/channel.tlist',`${element.name}\n`);
            else FS.appendFileSync('./customServices/codingFactory/channel.tlist',`${element.name}`);

            message.guild.channels.create(element.name);
        });

        FS.writeFileSync('./customServices/codingFactory/channel.tlist','');
        FS.writeFileSync('./customServices/codingFactory/groupes.json',JSON.stringify(groupArray)); */
        
        // ------------------------------------------------------------

        message.channel.send(text);
    }

    static rename(message, args)
    {
        let userName = message.author.username;
        for(let group of groupArray)
        {
            for(let userOfGroup of group)
            {
                if(userName == userOfGroup)
                {
                    let previousName = group.name,
                    newName = args.join(' ');
                }
            }
        }
    }

    static test()
    {
        console.log(JSON.parse(FS.readFileSync('./customServices/codingFactory/groupes.json','utf-8')));
    }

    static judge(message)
    {

        message.channel.send(`Dear, here is the order of teams for the judgement, good luck to everyone !`);
        arrayIndex= [groupArray.length];
        x= Tools.getRandomInt(2);

        for (let i = 0; i < groupArray.length; i++)
        {
            message.channel.send(`Team : **${groupArray[arrayIndex[x]].name}**`);
            message.channel.send(`Team : **${groupArray[arrayIndex[x]].users}**`);     
        }
    }
}