export default class User
{
    static init(app)
    {
        app.post('/login', async (req, res) => {
            let index = await isUserExist(req.body.username, req.body.password);
            if(index == -1) res.sendStatus(400);
            else
            {
                res.status(200).json(
                    {
                        username: usersCache[index].username,
                        password: usersCache[index].password,
                        discordId :usersCache[index].discordId,
                    }
                );
            }
        });
    }
}