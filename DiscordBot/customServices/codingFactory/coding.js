const Tools = require('../../tools.js');
const FS = require('fs');
var groupeArray = [];

module.exports = class Coding {
    static cmd(server, message, command, args)
    {
        message.delete();

        /* if(message.guild.id != '889416369567834112') return;
        else  */if (command == 'groupe') this.randomGroupe(message)
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
            "dictateur",
            "pradish"
        ];

        for (let mot of mots)
        {
            for (let forbidenWord of forbidenWords)
            {
                if (mot.toLocaleLowerCase() == forbidenWord)
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

    static randomGroupe(message, name, users)
    {
        let memberArray = [];
        message.guild.members.cache.each(member => {
            if (member.user.id != '735541067759353957' && member.user.id != '532642158231027722' && !member.user.bot) memberArray.push(member.user.username)
        });

        let tabAlea = [];
        while (memberArray[0])
        {
            var indiceAlea = Tools.getRandomInt(memberArray.length - 1);
            tabAlea.push(memberArray[indiceAlea]);
            memberArray.splice(indiceAlea, 1);
        }
        memberArray = tabAlea;

        groupeArray = [];

        let groupe = 0, text = "", arrayTemp = [];
        while (memberArray.length >= 4)
        {
            text += `**Groupe ${groupe+1} : **\n`;
            arrayTemp = [];

            for (let i = 0; i < 4; i++) {
                arrayTemp[i] = memberArray[memberArray.length - 1];
                text += `*${memberArray.shift()}*\n`;
            }
            text += "\n";
            this.generateStruct(groupeArray,groupe,name,arrayTemp);
            
            groupe++;
        }
        message.channel.send(text);
    }

    static generateStruct(object, index,name, users)
    {
        object[index] = {
            name,
            users
        };
    }

    static editGroupe()
    {

    }

    static judge(message)
    {

        let index = Tools.getRandomInt(groupeArray.length - 1);
        let Arrayindex = [];

        for (let i = 0; i < groupeArray.length; i++)
        {
                switch (index) 
                {
                    case 0:
                        message.channel.send(groupeArray[index].name);
                        Arrayindex[i] = index;
                        break;
                    case 1:
                        message.channel.send(groupeArray[index].name);
                        Arrayindex[i] = index;
                        break;
                    case 2:
                        message.channel.send(groupeArray[index].name);
                        Arrayindex[i] = index;
                        break;
                }
            

        }
    }
}