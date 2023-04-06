console.log('######\tStarting Theresa\'s API...');

require('dotenv').config();
const   FS = require('fs'),
        Express = require('express'),
        bodyParser = require('body-parser'),
        multer = require('multer'),
        cors = require('cors'),
        NodeID3 = require('node-id3'),
        mysql = require('mysql2');
const storageLocation = process.env.storageLocation;
const port = 42847;
const app = Express();
const upload = multer();
const corsOptions = {
    origin : [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://192.168.1.40:5500',
        'http://localhost'
    ],
    optionsSuccessStatus : 200,
    methods : ['GET', 'POST', 'PUT', 'DELETE']
};

var usersCache = require(`${storageLocation}/cache/users.json`);


var mysqlConnection = mysql.createConnection({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database
});

mysqlConnection.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(Express.json());

app.post('/musics', async (req, res) => {
    let index = await isUserExist(req.body.username, req.body.password);
    if(index == -1)
    {
        res.status(400).json({status:'error',message:"Account doesn't exist"});
        return;
    }

    res.status(200).json(usersCache[index].musics);
});

app.post('/musics/upload', upload.array('musicUploader'), async (req, res) => {
    console.log('######\tIncoming musics file');
    console.log(`\t\tUser : ${req.body.username}`);
    console.log(`\t\tNumber of file : ${req.files.length}`);

    if(await isUserExist(req.body.username, req.body.password) == -1)
    {
        res.status(400).json({status:'error',message:"Account doesn't exist"});
        return;   
    }

    let totalSize = 0;
    for(file of req.files) totalSize += file.size;
    console.log(`\t\tTotal Size : ${(totalSize / 1024 / 1024).toFixed(2)} Mo`);
    for(let file of req.files)
    {
        if(await trackToBDD(file, req.body.username, req.body.password)) FS.writeFileSync(`${storageLocation}/audio/${req.body.username}/${file.originalname}`, file.buffer, "");
        else
        {
            res.status(400).json({status:'error',message:`Probleme with the file ${file.originalname}`});
            return;
        }
    }

    res.sendStatus(200);
});

app.post('/musics/remove', async (req, res) => {
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
        FS.rmSync(`${storageLocation}/audio/${req.body.username}/${file}`);
    }

    FS.writeFileSync(`${storageLocation}/cache/users.json`, JSON.stringify(usersCache), 'utf-8');
    res.sendStatus(200);
});

app.post('/login', async (req, res) => {
    let index = await isUserExist(req.body.username, req.body.password);
    if(index == -1) res.sendStatus(400);
    else
    {
        res.status(200).json(
            {
                username: usersCache[index].username,
                password: usersCache[index].password,
            }
        );
    }
});

app.listen(port, () => {
    console.log(`######\tTheresa's Website Assistant API is online (port ${port})`);
});

async function trackToBDD(file, username, password)
{
    return new Promise(resolve => {
        let fileObject = fileToObject(file);

        if (fileObject.title)
        {
            fileObject.title  = fileObject.title.replace(/\\/g, "\\\\");
            fileObject.title  = fileObject.title.replace(/'/g, "\\'");
        }
        else

        if (fileObject.artist)
        {
            fileObject.artist = fileObject.artist.replace(/\\/g, "\\\\");
            fileObject.artist  = fileObject.artist.replace(/'/g, "\\'");
        }

        let query = `INSERT INTO track VALUES ((SELECT id FROM user WHERE username ='${username}' AND password = '${password}'), "${fileObject.fileName}", "${fileObject.fileNameNoExt}", '${fileObject.extension}', '${fileObject.title}', '${fileObject.artist}')`;
        //                                                                                                                   OS will not allow special caractere in file name, so double quot
        mysqlConnection.query(query, (error) => {
            if(error)
            {
                resolve(false);
                console.error(error);
            }
            else
            {
                resolve(true);
                addTrackToCache(username, file);
            }
        });
    });
}

async function removeTrackFromBDD(fileName, username, password)
{
    return new Promise(resolve => {
        let query = `DELETE FROM track WHERE fileName = "${fileName}" AND userId = (SELECT id FROM user WHERE username = '${username}' AND password = '${password}');`;
        mysqlConnection.query(query, (error) => {
            if(error)
            {
                console.error(error);
                resolve(false);
            }
            else
            {
                resolve(true);
            }
        });
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
                else                      return 0;
            });
            FS.writeFileSync(`${storageLocation}/cache/users.json`, JSON.stringify(usersCache), 'utf-8');
        }
    });
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

function addUserToCache(user)
{
    usersCache.push(user);
    FS.writeFileSync(`${storageLocation}/cache/users.json`, JSON.stringify(usersCache), 'utf-8');
}

async function isUserExist(username, password)
{
    return new Promise(resolve => {

        let index = usersCache.findIndex(value => {
            if(value.username == username && value.password == password) return value;
        });
    
        if(index != -1) resolve(index);
        else
        {
            let query = `SELECT * FROM user WHERE username = '${username}' AND password = '${password}';`;
            mysqlConnection.query(query, (error, results) => {
                if(error)
                {
                    console.error(error);
                    resolve(index); // -1
                    return;
                }
        
                if(results.length == 0) resolve(index); // -1
                else
                {
                    let user = {
                        username: results[0].username,
                        password: results[0].password,
                        discordId: results[0].discordId,
                        musics: []
                    };
                    mysqlConnection.query(`SELECT fileName, fileNameNoExt, extension, title, artist FROM track WHERE userId = (SELECT id FROM user WHERE username = '${username}' AND password = '${password}')`, (error, results) => {
                        if(error)
                        {
                            console.error(error);
                            resolve(index); // -1
                        }
                        else
                        {
                            user.musics = results;
                            addUserToCache(user);
                            resolve(usersCache.length - 1);
                        }
                    });

                }
            });
        }
    });
}