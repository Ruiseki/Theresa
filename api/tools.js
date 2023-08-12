import { writeFileSync } from "fs";
import { mysqlConnection, storageLocation, usersCache } from "./main.js";

export async function isUserExist(username, password)
{
    let index = usersCache.findIndex(value => {
        if(value.username == username && value.password == password) return value;
    });

    if(index != -1) return index;
    else
    {
        let query = 'SELECT * FROM user WHERE username = ? AND password = ?;';
        let parameters = [username, password];

        let [userResult] = await mysqlConnection.execute(query, parameters);
    
        if(userResult.length == 0) return index; // -1
        else
        {
            let user = {
                username: userResult[0].username,
                password: userResult[0].password,
                discordId: userResult[0].discordId,
                musics: []
            };

            let query2 = 'SELECT fileName, fileNameNoExt, extension, title, artist FROM track WHERE owner = (SELECT id FROM user WHERE username = ? AND password = ?);';
            let [musicResult] = await mysqlConnection.execute(query2, parameters);
            user.musics = musicResult;
            addUserToCache(user);
            return usersCache.length - 1;
        }
    }
}

function addUserToCache(user)
{
    usersCache.push(user);
    writeFileSync(`${storageLocation}/cache/users.json`, JSON.stringify(usersCache), 'utf-8');
}