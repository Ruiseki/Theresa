import dotenv from 'dotenv';
import Discord from 'discord.js';
import FS from 'fs';
import DNS from 'dns';
import commandsFile from './json/commands.json' assert { type : 'json'};
import packageInfo from '../package.json' assert { type : 'json'};

dotenv.config();
export var client;
export var servers = [];
export var prefix = 't!';
export var isConnected = false, previousNetworkState = null, login = false;
export var button = {
    audio: {
        previousBtn :   new Discord.ButtonBuilder().setCustomId('previousBtn').setLabel('⏮').setStyle('Secondary'),
        nextBtn :       new Discord.ButtonBuilder().setCustomId('nextBtn').setLabel('⏭').setStyle('Secondary'),
        pausePlayBtn :  new Discord.ButtonBuilder().setCustomId('pausePlayBtn').setLabel('⏯').setStyle('Secondary'),
        stopBtn :       new Discord.ButtonBuilder().setCustomId('stopBtn').setLabel('⏹').setStyle('Secondary'),
        viewMore :      new Discord.ButtonBuilder().setCustomId('viewMore').setLabel('🔎').setStyle('Secondary'),
        loop :          new Discord.ButtonBuilder().setCustomId('loop').setLabel('🔂').setStyle('Secondary'),
        loopQueue :     new Discord.ButtonBuilder().setCustomId('loopQueue').setLabel('🔁').setStyle('Secondary'),
        replay :        new Discord.ButtonBuilder().setCustomId('replay').setLabel('⏪').setStyle('Secondary')
    },
    help: {
        main :          new Discord.ButtonBuilder().setCustomId('main').setLabel('Main Page').setStyle('Primary'),
        audio :         new Discord.ButtonBuilder().setCustomId('audio').setLabel('Audio 🎵').setStyle('Primary'),
        queueManager :  new Discord.ButtonBuilder().setCustomId('queueManager').setLabel('Queue Manager 🎼').setStyle('Primary'),
        debug :         new Discord.ButtonBuilder().setCustomId('debug').setLabel('reload').setStyle('Danger')
    },
    voiceTracking: {
        accept :        new Discord.ButtonBuilder().setCustomId('accept').setLabel('Accept').setStyle('Success'),
        refuse :        new Discord.ButtonBuilder().setCustomId('refuse').setLabel('Refuse').setStyle('Danger'),
    }
};
export var commands = commandsFile;
export var storageLocation = '../storage/';

init();

async function init()
{
    console.log('----- Waking up -----');

    // client intents
    client = new Discord.Client({
        intents: [
            Discord.GatewayIntentBits.Guilds,
            Discord.GatewayIntentBits.GuildMembers,
            Discord.GatewayIntentBits.GuildEmojisAndStickers,
            Discord.GatewayIntentBits.GuildInvites,
            Discord.GatewayIntentBits.GuildVoiceStates,
            Discord.GatewayIntentBits.GuildPresences,
            Discord.GatewayIntentBits.GuildMessages,
            Discord.GatewayIntentBits.GuildMessageReactions,
            Discord.GatewayIntentBits.DirectMessages,
            Discord.GatewayIntentBits.DirectMessageReactions,
            Discord.GatewayIntentBits.MessageContent
        ]
    });

    // checklist

    // internet access
    console.log('\tNetwork access ...');
    if( !await checkInternetConnection() )
    {
        console.log('\t\t❌ Connection test failed. Retrying in 10 sec');
        let connectionTest = () => {
            return new Promise((resolve) => {
                let loopId = setInterval(async () => {
                    if( await checkInternetConnection() )
                    {
                        clearInterval(loopId);
                        resolve(true);
                    }
                    else
                        console.log('\t\t❌ Connection test failed. Retrying in 10 sec');
                }, 10000);
            });
        }

        await connectionTest();
    }
    console.log('\t\t✅ Connection test passed');

    // login
    console.log('\tLogin ...');
    await client.login(process.env.key)
    .then(() => console.log('\t\t✅ Login successful'));

    // storage access and structure
    console.log('\tStructure...');
    let result = checkStorage();
    if(result.edited)
    {
        console.log('\t\tMissing folders has been detected and successfully created :');
        result.editedFolder.forEach(detail => console.log(`\t\t\t${detail}`));
    }
    console.log('\t\t✅Structure check completed');

    // status
    // bot status variables
    let changeStatus = true; // use to cycle the status of the bot. Usually on true
    let selectedActivity = 0;
    let clientActivity = [
        `/play [title]`,
        `Version : ${packageInfo.version}`
    ];
    console.log('\tBot status...');
    setInterval(() => {
        if(changeStatus)
        {
            selectedActivity = selectedActivity % clientActivity.length;
            client.user.setActivity(clientActivity[selectedActivity]);
            selectedActivity++;
        }
    }, 10000);
    console.log('\t\t✅ Bot status set');

    console.log('----- Initialisation completed -----');
}

function checkInternetConnection()
{
    return new Promise((resolve, error) => {
        DNS.resolve('www.google.com', err => {
            if(err) // no internet (or no google, but less likely to happen)
                error(err);
            else // internet available
                resolve(true);
        });
    });
}

function checkStorage()
{
    let info = {
        edited : false,
        editedFolder : []
    }
    let clientServersIdList = [];
    client.guilds.cache.each(guild => clientServersIdList.push(guild.id));

    if( !FS.existsSync(`${storageLocation}/discordServers`) )
    {
        FS.mkdirSync(`${storageLocation}/discordServers`);
        info.edited = true;
        info.editedFolder.push('Servers data');
        clientServersIdList.forEach(guildId => {
            FS.mkdirSync(`${storageLocation}/discordServers/${guildId}`);
            info.editedFolder.push(`Server ${guildId} data folder`);
        });
    }
    if( !FS.existsSync(`${storageLocation}/discordServersBackup`) )
    {
        FS.mkdirSync(`${storageLocation}/discordServersBackup`);
        info.edited = true;
        info.editedFolder.push('Servers backup');
        clientServersIdList.forEach(guildId => {
            FS.mkdirSync(`${storageLocation}/discordServersBackup/${guildId}`);
            info.editedFolder.push(`Server ${guildId} backup folder`);
        });
    }
    if( !FS.existsSync(`${storageLocation}/audio`) )
    {
        FS.mkdirSync(`${storageLocation}/audio`);
        info.edited = true;
        info.editedFolder.push('Audio folder');
    }

    let existingFolder = FS.readdirSync(`${storageLocation}/discordServers`);
    let existingBackupFolder = FS.readdirSync(`${storageLocation}/discordServersBackup`);
    clientServersIdList.forEach(guildId => {
        if (!existingFolder.find(element => element == guildId))
        {
            FS.mkdirSync(`${storageLocation}/discordServers/${guildId}`);
            info.edited = true;
            info.editedFolder.push(`Server ${guildId} data folder`);
        }
        if (!existingBackupFolder.find(element => element == guildId))
        {
            FS.mkdirSync(`${storageLocation}/discordServersBackup/${guildId}`);
            info.edited = true;
            info.editedFolder.push(`Server ${guildId} backup folder`);
        }
    });

    return info;
}