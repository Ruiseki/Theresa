var host, port;
var activeUser = null;
var musics = [];

export default class ApiRequester
{
    static init(h, p)
    {
        host = h;
        port = p;
    }

    static async login(username, password)
    {
        await fetch(`${host}:${port}/login`, {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json; charset=UTF-8',
            },
            body: JSON.stringify( {username, password} )
        })
        .then(result => result.json())
        .then(json => activeUser = json);
        return activeUser;
    }

    static async getUserMusic()
    {
        await fetch(`${host}:${port}/musics`, {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json; charset=UTF-8',
            },
            body: JSON.stringify( {username: activeUser.username, password: activeUser.password} )
        })
        .then(result => result.json())
        .then(json => musics = json);

        return musics;
    }

    static async sendFile(route, files)
    {
        let data = new FormData();
        for(let file of files) data.append('musicUploader', file);
        data.append('username', activeUser.username);
        data.append('password', activeUser.password);

        console.log(data.get('musicUploader'));

        await fetch(`${host}:${port}${route}`, {
            method: 'POST',
            body: data
        }).then(response => console.log(response));
    }

    static async removeTrack(filesName)
    {
        await fetch(`${host}:${port}/musics/remove`, {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json; charset=UTF-8',
            },
            body: JSON.stringify({
                username: activeUser.username,
                password: activeUser.password,
                files : filesName
            })
        }).then(response => console.log(response));
    }

    static getActiveUser()
    {
        return activeUser;
    }

    static setActiveUser(user)
    {
        activeUser = user;
    }
}