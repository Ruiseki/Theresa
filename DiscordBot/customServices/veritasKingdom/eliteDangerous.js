const FS = require('fs'),
    Discord = require('discord.js'),
    env = require('dotenv')
    shell = require('shelljs'),
    mySQL = require('mysql'),
    fetch = require('node-fetch'),
    jsonexport = require('jsonexport');

var sql = mySQL.createConnection({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: 'elite'
});

sql.connect(function(err){
    if(err)
    {
        console.error('Cant connect to the DB');
        return;
    }
    else console.log('Connection to DataBase : OK');
});

module.exports = class EliteDangerous {
    static async cmd(server,message,command,args)
    {
        message.delete();

        if(command == undefined);
        else
        {
            if(command == 'faction' || command == 'f') this.faction(server,message,command,args);

            else if((command == 'update' || command == 'up') && message.author.id == '606684737611759628') await this.downloadData();
            else if((command == 'test' || command == 't') && message.author.id == '606684737611759628') this.test(server,message,command,args);
        }
    }

    static async downloadData()
    {
        FS.writeFileSync('./elite/lastcheck.tsave',`${Date.now()}`);
        let type = ['systems_recently.csv', // 0
        'factions.csv', // 1
        'listings.csv', // 2
        'commodities.json', // 3
        'modules.json', // 4
        'systems_populated.json',
        'stations.json']
        let lien='https://eddb.io/archive/v6/';
        
        console.log('### Starting download (EDDB database)');
        for(let i=0;i<type.length;i++)
        {
            try
            {
                fetch(lien+type[i])
                .then(result => result.text())
                .then(text => FS.writeFileSync(`./elite/${type[i]}`,text))
                .then(() => {
                    console.log(`### Downloaded ${type[i]}`);
                    if(i == type.length-1)
                    {
                        console.log('### Download completed');   
                    }
                    
                    if(type[i].substring(type[i].length-4) == 'json' && type[i] != 'systems_populated.json' && type[i] != 'stations.json')
                    {
                        jsonexport(JSON.parse(FS.readFileSync(`./elite/${type[i]}`)),function(err,csv){
                            if(err) return console.error(err);
                            else FS.writeFileSync(`./elite/${type[i].substring(0,type[i].length-5)}.csv`,csv);
                        });
                    }
                })
                /* .then(() => {
                    for(let i=0; i < 5; i++) this.sendToDB(type[i].substring(0,type[i].length-4));
                }); */
            }
            catch(error)
            {
                console.log(`### Download failed -> ${type[i]}`);
                if(i == type.length-1)
                {
                    console.log('### Download completed');   
                }
                console.log(error);
            }
        }
    }
    
    static faction(server,message,command,args)
    {
        factionName = args.join(' ').toLocalLowerCase();

        sql.connect(function(err){
            if(err) console.error(err);
            else 
            {
                sql.query(`SELECT * FROM factions WHERE name = LIKE '%${factionName}%'`,function(err, result, fields) {
                    if(err)
                    {
                        console.error(err);
                        this.error(message,3,'SQL request error');
                    }
                    else
                    {
                        let faction = {
                            name: result[0].name,
                            home: this.systemIDtoSystemName(result[0].home_system_id),
                            allegiance: result[0].allegiance,
                            playerFaction: result[0].is_player_faction,
                            controlling: this.systemsControlledBy(result[0].id),
                            presence: this.factionPresence(result[0].id),
                            updatedAt: result[0].updated_at
                        };
                        
                        console.log(faction);
                    }
                });
            }
        });
    }

    static systemsControlledBy(factionID)
    {
        sql.query(`SELECT name FROM systems_recently WHERE controlling_minor_faction_id = ${factionID}`,function(err, result, fields){
            if(err);
            else
            {
                let array=[];
                for(let system of result) array.push(system.name);
                return array;
            }
        });
    }

    static sendToDB(fileName)
    {
        console.log(`### Clearing the table... (${fileName})`);
        sql.query(`DELETE * FROM ${fileName}`,function(err){
            if(err) 
            {
                console.error(err);
                return;
            }
            else
            {
                console.log(`### Updating... (${fileName})`);
                sql.query(`BULK INSERT ${fileName} FROM './elite/${fileName}' WITH (FIRSTROW = 2, FIELDTERMINATOR = ',', ROWTERMINATOR = '\n', TABLOCK)`,function(err){
                    if(err)
                    {
                        console.error(err);
                        return;
                    }
                    else
                    {
                        console.log(`### Succesfully added ${fileName} to the Database.`);
                    }
                });
            }
        });
    }

    static factionPresence(factionID)
    {
        // AHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH
    }

    static systemIDtoSystemName(systemID)
    {
        sql.query(`SELECT name FROM systems_recently WHERE id = ${systemID}`,function(err, result, fields){
            if(err)
            {
                console.error(err);
                return undefined;
            }
            else return result;
        });
    }
    
    static test(server,message,command,args)
    {
        sql.query(`SELECT systems_recently.name FROM systems_recently WHERE systems_recently.name = 'Chimiri'`,function(err){
            if(err)
            {
                console.log('Query : MERDE');
                console.error(err);
                return;
            }
            else console.log('Query accomplished !');
        });
    }

    static log(message,command,args)
    {
        console.log(`-> ${command} <- executed by ${message.author.username}. Argument : ${args}`);
    }

    static error(message,type,text)
    {
        /*
            Error type :
            -1 : Invalid Syntaxe
            0 : Invalid Argument
            1 : Missing Argument
            2 : Incomplete Command
            3 : Command fail
        */
       if(type == -1) message.channel.send(`**⚠ Invalid syntaxe ⚠**\n${text}`);
       else if(type == 0) message.channel.send(`**⚠ Invalide argument ⚠**\n${text}`);
       else if(type == 1) message.channel.send(`**⚠ Missing argument ⚠**\n${text}`);
       else if(type == 2) message.channel.send(`**⚠ Incomplete command ⚠**\n${text}`);
        else if(type == 3) message.channel.send(`**⚠ Command has fail ⚠**\n${text}`);
    }
}