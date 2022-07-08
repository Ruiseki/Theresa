const Discord = require('discord.js');

module.exports = class Help
{
    static help(servers, message)
    {
        let embed = {
                color: '#000000',
                title: '❓  **__Help__**  ❓',
                description: `**Welcome to the help page~ !**\n\nIn the following commands,
                    **[]** is for a **neededed** argument
                    **()** is for an **optional** argument
                    **[()]** for a **needed** argument If you have filled in an **optional argument before**

                    A command maybe have a simplified version of his syntaxe. \`${servers[0].prefix}a = ${servers[0].prefix}audio\` for exemple. In the help page, It will be write \`${servers[0].prefix}audio | a\`

                    The current prefix is : __**${servers[0].prefix}**__.
                    __One command may be have several variation.__`,
                thumbnail: {
                    url: 'attachment://Theresa.jpg'
                }
            };
        
        if(message.author.id == '762501363086524416')
        message.edit(
            {
                embeds: [
                    embed
                ],
                components: [
                    new Discord.MessageActionRow().addComponents(
                        servers[0].button.help.audio
                    )
                ]
            }
        );
        else
        {
            message.delete();
            message.channel.send(
                {
                    embeds: [
                        embed
                    ],
                    components: [
                        new Discord.MessageActionRow().addComponents(
                            servers[0].button.help.audio
                        )
                    ]
                }
            );
        }
    }

    static audioMain(servers, message)
    {

        message.edit({
            embeds: [
                {
                    color: '#000000',
                    title: '🎵 __**Quick Audio Help Page**__ 🎵',
                    description: `
                    \`${servers[0].prefix}audio | a\`
                    Audio player base command.
                    All commands in relation to the audio player must begin by that.

                    ▶ \`${servers[0].prefix}audio | a [music title]\` \`(>>[queue selector])\`
                    Play music in your voice channel. Music will be found on YouTube.
                    *Exemple : ${servers[0].prefix}a Eternal Anamnesis >>5*
                    This command will add a music at the 5th position of the queue.
                    
                    🎼 \`${servers[0].prefix}audio queue | a q\`
                    Queue Manager base command. Skip song, go to a position, pause and more.`
                }
            ],
            components: [
                new Discord.MessageActionRow().addComponents(
                    servers[0].button.help.queueManager,
                    servers[0].button.help.main
                )
            ]
        });
    }
    
    static audioQueueManager(servers, message)
    {
        message.edit({
            embeds: [
                {
                    color: '#000000',
                    title: '🎵 __**Audio Queue Manager**__ 🎵',
                    description: `
                    🎼 \`${servers[0].prefix}audio queue | a q\`
                    Queue Manager base command.

                    ***Basics***

                    ⏹ \`${servers[0].prefix}audio queue clear | a q c\`
                    Clear the queue and stop the player.

                    ⏭ \`${servers[0].prefix}audio queue skip | a q s\`
                    Skip to the next song. Will delete the queue if no other song in the queue.
                    
                    ⏮ \`${servers[0].prefix}audio queue previous | a q p\`
                    Go to the previous song.

                    ⏸ \`${servers[0].prefix}audio queue pause | a q p\`
                    Pause the audio player

                    ▶ \`${servers[0].prefix}audio queue play | a q pl\`
                    Unpause the audio player

                    🔂 \`${servers[0].prefix}audio queue loop | a q l\`
                    Enable or disable the loop.

                    🔁 \`${servers[0].prefix}audio queue loopqueue | a q lq\`
                    Enable or disable the loop queue.


                    ***Queue selector***

                    The queue selector is used to select a song in the queue.

                    \`Number\`                   The element at this position
                    \`current | c\`              The current song.
                    \`final | f | end | e\`      The last element of the queue.
                    \`previous | p | befor | b\` The previous element relative to the current song.
                    \`after | a | next | n\`     The next element relative to the current song.


                    ***Advanced***

                    🚮 \`${servers[0].prefix}audio queue delete | a q d\` \`[queue selector] (queue selector) (queue selector) (queue selector) ...\`
                    Will delete song in the queue.
                    **1 argument** : __Single mode__. Will delete the selected song
                    **2 arguments** : __Range mode__. Will delete all song between the selectors.
                    **More than 2 arguments** : __Selection mode__. Same as the single mode, but with multiple selection.

                    ⤴ \`${servers[0].prefix}audio queue swap | a q sw\` \`[queue selector] [queue selector]\`
                    Will swap 2 position in the queue

                    ➡ \`${servers[0].prefix}audio queue go | a q go\` \`[queue selector]\`
                    Move to the selected song

                    🔀 \`${servers[0].prefix}audio queue shuffle | a q sh\`
                    Stop the player and shuffle the queue. Resume at the last position.
                    `
                }
            ],
            components: [
                new Discord.MessageActionRow().addComponents(
                    servers[0].button.help.audio,
                    servers[0].button.help.main
                )
            ]
        });
    }
}