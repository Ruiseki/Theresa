const Tools = require('../../tools.js');
const FS = require('fs');
var groupeArray = [];

module.exports = class Coding {
    static cmd(server, message, command, args)
    {
        message.delete();

        /* if(message.guild.id != '889416369567834112') return;
        else  */if (command == 'groupe') this.makeRandomGroupe(message)
    }

    static checkWord(message)
    {
        let mots = message.content.split(/ +/);
        let forbidenWords = [
            "censure",
            "dictature",
            "liberté",
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

    static makeRandomGroupe(message)
    {
        let membersNameArray = [];
        message.guild.members.cache.each(member => {
            if (member.user.id != '735541067759353957' && member.user.id != '532642158231027722' && !member.user.bot) membersNameArray.push(member.user.username)
        });

        // ------------------------------------------------------------
        // shuffle the array of members

        let tabAlea = [];
        while (membersNameArray[0])
        {
            var indiceAlea = Tools.getRandomInt(membersNameArray.length - 1);
            tabAlea.push(membersNameArray[indiceAlea]);
            membersNameArray.splice(indiceAlea, 1);
        }
        membersNameArray = tabAlea;
        
        // ------------------------------------------------------------

        let groupe = 0, text = "", arrayTemp = [];
        while (membersNameArray.length >= 4)
        {
            text += `**Groupe ${groupe + 1} : **\n`;
            arrayTemp = [];

            for (let i = 0; i < 4; i++) {
                arrayTemp[i] = membersNameArray[membersNameArray.length - 1];
                text += `*${membersNameArray.shift()}*\n`;
            }
            text += "\n";
            this.generateStruct(groupeArray, groupe, `groupe${groupe+1}`, arrayTemp);

            groupe++;
        }
        message.channel.send(text);
    }

    static generateStruct(object, index, name, users)
    {
        object[index] = {
            name,
            users
        };
    }

    static editGroupe()
    {
        JSON.stringify
    }

    static test()
    {
        let args = [];
    }

    static judge(message)
    {

        message.channel.send(`Dear, here is the order of teams for the judgement, good luck to everyone !`);
        arrayIndex= [groupeArray.length];
        x= Tools.getRandomInt(2);

        for (let i = 0; i < groupeArray.length; i++)
        {
            message.channel.send(`Team : **${groupeArray[arrayIndex[x]].name}**`);
            message.channel.send(`Team : **${groupeArray[arrayIndex[x]].users}**`);     
        }
    }
}