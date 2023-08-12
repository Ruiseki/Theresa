import { app, mysqlConnection, storageLocation, upload, usersCache } from "./main.js";
import { rmSync, writeFileSync } from "fs";
import { isUserExist } from "./tools.js";
import NodeID3 from "node-id3";

export async function init()
{
    app.post('/musics', (req, res) => { musics(req, res) });
    app.post('/musics/upload', upload.array('musicUploader'), (req, res) => { musicsUpload(req, res) });
    app.post('/musics/remove', (req, res) => { musicsRemove(req, res) });
}

async function musics(req, res)
{
    let index = await isUserExist(req.body.username, req.body.password);
    if(index == -1)
    {
        res.status(400).json({status:'error',message:"Account doesn't exist"});
        return;
    }

    res.status(200).json(usersCache[index].musics);
}

async function musicsUpload(req, res)
{
    console.log('######\tIncoming musics file');
    console.log(`\t\tUser : ${req.body.username}`);
    console.log(`\t\tNumber of file : ${req.files.length}`);

    if(await isUserExist(req.body.username, req.body.password) == -1)
    {
        res.status(400).json({status:'error',message:"Account doesn't exist"});
        return;   
    }

    let totalSize = 0;
    for(let file of req.files) totalSize += file.size;
    console.log(`\t\tTotal Size : ${(totalSize / 1024 / 1024).toFixed(2)} Mo`);
    for(let file of req.files)
    {
        await trackToBDD(file, req.body.username, req.body.password);
        writeFileSync(`${storageLocation}/audio/${req.body.discordId}/${file.originalname}`, file.buffer, "");
    }

    res.sendStatus(200);
}

async function musicsRemove(req, res)
{
    console.log('######\tRemoving file');
    console.log(`\t\tUser : ${req.body.username}`);
    console.log(`\t\tNumber of file : ${req.body.files.length}`);

    let index = await isUserExist(req.body.username, req.body.password);
    if(index == -1)
    {
        res.status(400).json({status:'error',message:"Account doesn't exist"});
        return;
    }

    for(let file of req.body.files)
    {
        await removeTrackFromBDD(file, req.body.username, req.body.password); // deleting in the BDD
        for(let i = 0; i < usersCache[index].musics.length; i++)              //          in the cache
        {
            if(usersCache[index].musics[i].fileName == file)
            {
                usersCache[index].musics.splice(i, 1);
                break;
            }
        }
        rmSync(`${storageLocation}/audio/${req.body.discordId}/${file}`);
    }

    writeFileSync(`${storageLocation}/cache/users.json`, JSON.stringify(usersCache), 'utf-8');
    res.sendStatus(200);
}

async function removeTrackFromBDD(fileName, username, password)
{
    let query = 'DELETE FROM track WHERE fileName = ? AND owner = (SELECT id FROM user WHERE username = ? AND password = ?);';
    let parameters = [
        fileName,
        username,
        password
    ];
    
    await mysqlConnection.execute(query, parameters);
}

async function trackToBDD(file, username, password)
{
    let fileObject = fileToObject(file);

    if (fileObject.title)
    {
        fileObject.title  = fileObject.title.replace(/\\/g, "\\\\");
        fileObject.title  = fileObject.title.replace(/'/g, "\\'");
    } else fileObject.title = null;

    if (fileObject.artist)
    {
        fileObject.artist = fileObject.artist.replace(/\\/g, "\\\\");
        fileObject.artist  = fileObject.artist.replace(/'/g, "\\'");
    } else fileObject.artist = null;

    let query = 'INSERT INTO track VALUES ((SELECT id FROM user WHERE username = ? AND password = ?), ?, ?, ?, ?, ?)';
    let parameters = [
        username,
        password,
        fileObject.fileName,
        fileObject.fileNameNoExt,
        fileObject.extension,
        fileObject.title,
        fileObject.artist
    ];

    await mysqlConnection.execute(query, parameters);
    addTrackToCache(username, file);
}

function fileToObject(file)
{
    let fileNameNoExt = file.originalname.split('.');
    let extension = fileNameNoExt.pop();
    fileNameNoExt = fileNameNoExt.join('.');
    let tags = NodeID3.read(file.buffer);

    return({
        fileName: file.originalname,
        fileNameNoExt: fileNameNoExt,
        extension,
        title: tags.title,
        artist: tags.artist
    });
}

function addTrackToCache(username, file)
{
    usersCache.forEach(element => {
        if(element.username == username)
        {
            element.musics.push(fileToObject(file));
            element.musics.sort((a, b) => {
                if      (a.title < b.title) return -1;
                else if (a.title > b.title) return 1;
                else                        return 0;
            });
            writeFileSync(`${storageLocation}/cache/users.json`, JSON.stringify(usersCache), 'utf-8');
        }
    });
}