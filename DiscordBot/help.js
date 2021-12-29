const Discord = require('discord.js');

module.exports = class Help
{
    static cmd(command,prefix,message,args)
    {
        if(command === 'help') this.help(prefix,message,args);
        else return false;
        return true;
    }

    static help(prefix,message,args)
    {
        message.delete();
        console.log(`Command -help detected. Executed by ${message.author.username}`);
        if(args[0] == 'audio')
        {
            if(message.author.id != '606684737611759628')
            {
                message.channel.send('\`Work in progress\`');
                return;
            }

            if(args[1] == 'detail') this.audio(prefix,message);
            else if(!args[1]) this.audioShort(prefix,message);
            else message.channel.send(`[...]`);
        }
        else if(args[0] == 'rp')
        {
            if(args[1] == 'detail') this.RP(prefix,message);
            else if(!args[1]) this.RPShort(prefix,message);
            else message.channel.send(`[...]`);
        }
        else if(args[0] == 'theresa')
        {
            if(args[1] == 'detail') this.Theresa(prefix,message);
            else if(!args[1]) this.TheresaShort(prefix,message);
            else message.channel.send(`[...]`);
        }
        else
        {
            var embed = new Discord.MessageEmbed()
            .setColor('#000000')
            .setTitle('❓  **__Help__**  ❓')
            .attachFiles(['./Picture/Theresa.jpg'])
            .setThumbnail('attachment://Theresa.jpg')
            .setDescription(`**Welcome to the help page~ !**\n\nIn the following commands,`
            +`**[]** is for a **neededed** argument
            **()** is for an **optional** argument.
            **[()]** for a **needed** argument If you have filled in an **optional argument before**
            \nA command maybe have a simplified version of his syntaxe. \`${prefix}a = ${prefix}audio\` for exemple. In the help page, It will be write \`-audio|a\``
            +`\nThe prefix is currently __**${prefix}**__.\n`
            +`One command may be have several variation. Please be careful !`)
            .addFields(
                {name:'\u200B',value:'\u200B'},
                {name:`**Switch to a Help Page**`,value:`\`-help (name_of_the_menu)\` | *If you want to see all the command from Audio, just write \`${prefix}help audio\`*`,inline:false},
                {name:'**Switch to a detailed Help Page**',value:`\`-help (name_of_the_menu) detail\` | *Don't understand a command ? The detailed Help Page explain to you how to use it.\n
                For exemple : \`${prefix}help audio detail\` will display the detailed Help Page of the Audio section.*`},
                {name:'\u200B',value:'\u200B'},
                {name:`**Audio**`,value:`*Play music in a voice channel*`,inline:true},
                {name:`**Playlist**`,value:`*You can create playlist and play it*`,inline:true},
                //{name:`**Elite Dangerous**`,value:`*All about the data in the game !*`,inline:true},
                //{name:`**Coding Factory**`,value:`*Manage a group of undisplined developers*`,inline:true},
                {name:`**Theresa**`,value:`*I can do many thing, like custom DM and more*`,inline:true},
                /*{name:``,value:``,inline:true},
                {name:'\u200B',value:'\u200B'},
                {name:'\u200B',value:'\u200B'},
                {name:'\u200B',value:'\u200B'},
                {name:'\u200B',value:'\u200B'},
                {name:``,value:``,inline:true},
                {name:``,value:``,inline:true},
                {name:``,value:``,inline:true},*/
            );
            message.channel.send({embeds :[embed]});
        }
    }
    
    static audioShort(prefix,message)
    {
        var embed = new Discord.MessageEmbed()
        .setColor('#000000')
        .setTitle('🎼  **__Audio Help Page__**  🎼')
        .setDescription(`**Command strucutre : [Prefix][Type]\t[Command]\t[Arguments]**
        __Prefix : ${prefix}__
        __Type : audio|a__\n
        The Audio Manager can play music from YouTube and from the Ruiseki music directory.\n
        Keep this in mind : The Ruiseki's directory contain largely Japanese Song and many OtakuThings.mp3
        \n\n**Commands :**\n
        \`a|audio [music title] (>>queue_position)\`\n__Queue position__ = **integer** OR **'current|c'** OR **'after|aft'**  ▶\n
        \`-queue|q\`\n**__Queue Manager__** (will display the queue without arguments)\n
        \`-player|p\`\n**__Audio Engine Manager__** (doesn't work without arguments)\n
        \`-miscellaneous|m\`\nOther commands\n
        
        \t\`clear|c\`  🚮\n

        \`-skip|s|> (music's_position) OR (>>music_name) OR (>>>to music_name)\`  ⏭\n
        \`-audiodelete|ad [music's_position OR first_position] [(final_position)]\`  🚮✏\n
        \`-audiodeleteselect|ads (music's_position) (music's_position) (music's_position) ...\`  🚮✏\n
        \`-audioqueueshuffle|aqs (play|p)\`  🔀\n
        \`-ash\`  ▶🔀\n
        \`-audioqueuemove|aqm [first_position] [final_position]\`  ➡✏\n
        \`-audioqueueswap|aqw [first_position] [final_position] (second_position) [(second_position)] (third_position) [(third_position)] ...\`  ➡✏\n
        \`-audiofind|af\`  🔎\n
        \`-audioloopqueue|aql\` 🔁\n
        \`-audioloop|al\`  🔂\n
        \`-audioreplay|ar\`  ⏪\n
        \`-audiolyrics|aly\`  🎙\n
        \`-audiocurrent|ac\`  🎵\n
        `);
        message.channel.send({embeds :[embed]});
    }

    static audio(prefix,message)
    {
        var embed = new Discord.MessageEmbed()
        .setColor('#000000')
        .setTitle('🎼  **__Detailed Audio Help Page__**  🎼')
        .setDescription(`**Base Key : ${prefix}a**\nThe Audio Manager can play music from YouTube and from the Ruiseki music directory.\n
        Keep this in mind : The Ruiseki's directory contain largely Japanese Song and many OtakuThings.mp3`)
        .addFields(
            {name:`\`-a|audio (music title) (>>position_in_the_queue)\``,value:`*With a specified song, Theresa will connect herself to your voice channel and play the music.
            \nIf you don't precise the position in the queue, the music will be add in the last position of the queue.
            \nIf the song is present in Ruiseki's directory, you don't have to write his name entirely. 
            If you don't write a name that is detailed enough, Theresa will send the names of the musics whose beginning of the names are identical.\n
            If the song doesnt exist in the Ruiseki's directory, Theresa will shearch the name on YouTube and play the first result.\n Without argument, Theresa will resume the music.*`,inline:false},
            {name:`\`-audiopause|ap\``,value:`*Pause the music.*`,inline:true},
            {name:`\`-astop\``,value:`*Stop the music. Don't forget to resume with \`-a\` after !*`,inline:true},
            {name:`\`-audioqueue|aq\``,value:`*Display the entier queue. Only the current song and the next 40 will be displayed.*`,inline:true},
            {name:`\`-audioskip|as (music's_position) OR (>>music_name) OR (>>>to music_name)\``,value:`
            Skip the current song. Without argument, go to the next track.\nWith the 1st argument, write the
            wanted song position in the queue to jump to it.\nWith the second argument, skip to a wanted music.
            This action will just remplace the current song and dont delete the queue.\nThe third argument allow you
            to skip a certain number of song in the queue to match the target music.`,inline:false},
            {name:`\`-audioqueueclear|aqc\``,value:`Clear the queue and stop the current song.`,inline:true},
            {name:`\`-audiodelete|ad [music's_position OR first_position] [(final_position)]\``,value:`*Remove a song from the queue.
            If two argument are specified, Theresa will delete all song between this numbers. **The arguement 0 is the final line of the queue, so \`-ad 1 0\`
            will delete all the queue and keep playing the current song.***`,inline:false},
            {name:`\`-audiodeleteselect|ads (music's_position) (music's_position) (music's_position) ...\``,value:`
            Delete the selected song(s).`,inline:true},
            {name:`\`-audioqueueshuffle|aqs (play|p)\``,value:`*Shuffle the queue. With the argument "play" or "p", the current song will not stop.*`,inline:true},
            //{name:``,value:``,inline:true},
            //{name:``,value:``,inline:true},
            //{name:``,value:``,inline:true},
            //{name:``,value:``,inline:true},
            {name:'\u200B',value:'\u200B'},
        );
        message.channel.send({embeds :[embed]});
    }
    static playlistShort(prefix,message)
    {message.channel.send(`\`Work in progresse\``);}
    static playlist(prefix,message)
    {message.channel.send(`\`Work in progresse\``);}
    static RPShort(prefix,message)
    {message.channel.send(`\`Work in progresse\``);}
    static RP(prefix,message)
    {message.channel.send(`\`Work in progresse\``);}
    static Theresa(prefix,message)
    {}
    static TheresaShort(prefix,message)
    {}
}