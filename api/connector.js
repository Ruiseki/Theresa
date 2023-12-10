import { createConnection } from "mysql2/promise";
import { app, port, corsOptions, mysqlConnection, usersCache, setMysqlConn, setUsersCache, pushUsersCache, storageLocation } from "./main.js";
import bodyParser from 'body-parser';
import cors from 'cors';
import { writeFileSync } from "fs";
import { init as musicInit } from "./music.js";
import { init as userInit } from "./user.js";

export async function connect()
{
    try {
        console.log("\tConnection to the database ...");
        setMysqlConn(await createConnection({
            host: process.env.host,
            user: process.env.dbuser,
            password: process.env.password,
            database: process.env.database
        }));
        console.log("\t\t✅ Done");
    } catch (error) {
        console.log(`\t\t ❌ Can't connect to the database\n\t${error}`);
        process.exit();
    }

    try {
        console.log('\tUpdating cache ...');
        await updateCache(usersCache);
        console.log('\t\t✅ Done');
    } catch (error) {
        console.log(`\t\t ❌ Can't update the cache\n\t${error}`);
        process.exit();
    }

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(cors(corsOptions));

    app.get('/check', (req, res) => {
        res.sendStatus(200);
    });

    userInit();
    musicInit();

    console.log('----- Initialization completed -----');

    app.listen(port, () => {
        console.log(`\tListening on port ${port}`);
    });
}

async function updateCache()
{
    setUsersCache([]);

    const [usersResults] = await mysqlConnection.query('SELECT id, username, discordId FROM user;');
    for(let i = 0; i < usersResults.length; i++)
    {
        let getMusicsQuery = 'SELECT * FROM track WHERE track.owner = ? ORDER BY fileName ASC;';
        const [tracksResults] = await mysqlConnection.execute(getMusicsQuery, [usersResults[i].id])
        usersResults[i].musics = tracksResults;
        pushUsersCache(usersResults[i]);

        if(i == usersResults.length - 1)
        {
            writeFileSync(`${storageLocation}/cache/users.json`, JSON.stringify(usersCache), 'utf-8');
        }

    }
}