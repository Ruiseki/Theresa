import { host, port } from "../main.js";

export var activeUser = null;
var musics = [];

export default class ApiRequester
{
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

    static getTrackThumbnail(fileName)
    {
        return `${host}:${port}/musics/thumbnail/${activeUser.discordId}/${fileName}`;
    }

    static async sendFile(route, files)
    {
        let data = new FormData();
        for(let file of files) data.append('musicUploader', file);
        data.append('username', activeUser.username);
        data.append('password', activeUser.password);
        data.append('discordId', activeUser.discordId);

        await fetch(`${host}:${port}${route}`, {
            method: 'POST',
            body: data
        });

        activeUser.musics = await this.getUserMusic();
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
                discordId: activeUser.discordId,
                files : filesName
            })
        });

        activeUser.musics = await this.getUserMusic();
    }

    static setActiveUser(user)
    {
        activeUser = user;
    }
}