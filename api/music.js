import { app, mysqlConnection, storageLocation, upload, usersCache } from "./main.js";
import { rmSync, writeFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { isUserExist } from "./tools.js";
import NodeID3 from "node-id3";
import Yauzl from 'yauzl';
import resizeImage from 'resize-image-buffer';

export async function init()
{
    app.post('/musics', (req, res) =>                                       { musics(req, res); });
    app.get('/musics/:discordId', (req, res) =>                             { getMusics(req, res); })
    app.get('/musics/random/:discordId', (req, res) =>                      { getRandomMusics(req, res); })
    app.post('/musics/upload', upload.array('musicUploader'), (req, res) => { musicsUpload(req, res); });
    app.post('/musics/remove', (req, res) =>                                { musicsRemove(req, res) });
    app.get('/musics/thumbnail/:discordId/:fileName/', (req, res) =>        { sendThumbnail(req, res); });
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

async function getMusics(req, res)
{
    let query = 'SELECT title, fileNameNoExt, fileName, artist FROM track WHERE ( SELECT id FROM user WHERE discordId = ? )';
    let parameters = [req.params.discordId];

    try
    {
        let [data] = await mysqlConnection.execute(query, parameters);
        res.status(200).json(data);
    }
    catch(err)
    {
        console.error(err);
        res.status(400).json({status:'error',message:"No account associated with this discordId."})
    }
}

async function getRandomMusics(req, res)
{
    let query = `
            SELECT
                CASE
                    WHEN isnull(title)
                    THEN fileNameNoExt
                    ELSE title
                END as title,
                fileName as url,
                CASE
                    WHEN isnull(artist)
                    THEN '<unknown>'
                    ELSE artist
                END as artist
            FROM track
            WHERE ( SELECT id FROM user WHERE discordId = ? )
            ORDER BY RAND();`;
    let parameters = [req.params.discordId];

    try
    {
        let [data] = await mysqlConnection.execute(query, parameters);
        res.status(200).json(data);
    }
    catch(err)
    {
        console.error(err);
        res.status(400).json({status:'error',message:"No account associated with this discordId."})
    }
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
        if(file.mimetype == 'audio/mpeg' || file.mimetype == 'audio/flac')
        {
            if( await trackToBDD(file, req.body.username, req.body.password) )
                writeFileSync(`${storageLocation}/audio/${req.body.discordId}/${file.originalname}`, file.buffer, "");
        }
        else if(file.mimetype == 'application/x-zip-compressed')
        {
            writeFileSync(`${storageLocation}/audio/temp/${req.body.discordId}.zip`, file.buffer, "");
            Yauzl.open(`${storageLocation}/audio/temp/${req.body.discordId}.zip`, {lazyEntries: true}, (err, zipFile) => {
                if (err)
                    console.error(err);
                else
                {
                    zipFile.readEntry();
                    zipFile.on('entry', entry => {
                        
                    });
                }
            });

            rmSync(`${storageLocation}/audio/temp/${req.body.discordId}.zip`);
        }
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
        let imageName = file.split('.');
        imageName[imageName.length - 1] = 'png';
        imageName = imageName.join('.');
        if(existsSync(`${storageLocation}/audio/${req.body.discordId}/lowThumbnail/${imageName}`))
            rmSync(`${storageLocation}/audio/${req.body.discordId}/lowThumbnail/${imageName}`);
    }

    writeFileSync(`${storageLocation}/cache/users.json`, JSON.stringify(usersCache), 'utf-8');
    res.sendStatus(200);
}

async function sendThumbnail(req, res)
{
    req.params.fileName = req.params.fileName.replace('&amp;', '&');

    let userAudioLocation = `${storageLocation}/audio/${req.params.discordId}`,
        fileLocation = `${userAudioLocation}/${req.params.fileName}`,
        img = undefined;

    if(existsSync(fileLocation))
    {
        if(!existsSync(`${userAudioLocation}/lowThumbnail`))
            mkdirSync(`${userAudioLocation}/lowThumbnail`);
        
        if(req.query.res)
        {
            if(req.query.res == 'low')
            {
                let imageName = req.params.fileName.split('.');
                imageName[imageName.length - 1] = 'png';
                imageName = imageName.join('.');

                if(existsSync(`${userAudioLocation}/lowThumbnail/${imageName}`))
                    img = readFileSync(`${userAudioLocation}/lowThumbnail/${imageName}`);
                else
                {
                    let tags = NodeID3.read(fileLocation);
                    if(tags.image)
                    {
                        img = await resizeImage(tags.image.imageBuffer, {width: 100, height: 100});
                        writeFileSync(`${userAudioLocation}/lowThumbnail/${imageName}`, img);
                    }
                    else img = readFileSync(`${storageLocation}/ressource/image/noThumbnail.png`);
                }
            }
            else if(req.query.res == 'medium')
                img = await resizeImage(img, {width: 300, height: 300});
        }
        else
        {
            let tags = NodeID3.read(fileLocation);
            img = tags.image.imageBuffer;
        }
    }
    else img = readFileSync(`${storageLocation}/ressource/image/noThumbnail.png`);

    if(img)
    {
        // let tempFilePath = `${storageLocation}/audio/temp/${req.params.discordId}.png`;
        // writeFileSync(tempFilePath, img);
        res.status(200).type('image/png').send(img);
    }
    else if(img === null) res.sendStatus(204);
    else if(img === undefined) res.sendStatus(404);
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
    let succes = true;
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

    try {
        await mysqlConnection.execute(query, parameters);
        addTrackToCache(username, file);
    } catch (error) {
        console.error(error.message);
        succes = false;
    }
    return succes;
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