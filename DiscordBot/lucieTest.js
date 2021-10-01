const Tools = require('./tools');
const Discord = require('discord.js');

module.exports = class Test
{
    static randomnum(max, message)
    {
        message.channel.send(`Your number is : ${Tools.getRandomInt(max)}`);
    }
}