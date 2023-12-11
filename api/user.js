import { app, usersCache } from "./main.js";
import { isUserExist  } from "./tools.js";

export async function init()
{
    app.post('/login', async (req, res) => { login(req, res) });
}

async function login(req, res)
{
    let index = await isUserExist(req.body.username, req.body.password);
    if(index == -1) res.sendStatus(404);
    else
    {
        res.status(200).json(
            {
                username: usersCache[index].username,
                password: usersCache[index].password,
                discordId:usersCache[index].discordId,
                musics:   usersCache[index].musics,
            }
        );
    }
}