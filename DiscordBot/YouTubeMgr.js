const ytdl = require('ytdl-core');
const YTsearch = require('yt-search');

module.exports = class YouTubeMgr {

    static async titleToURL(title)
    {
        var videoURL;
        try{var result = await YTsearch(title);}
        catch(error) {console.error(error); return undefined;}
        var videos = result.videos.slice(0,1);
        videos.forEach(function(x) {
            videoURL = x.url;
        })
        return videoURL;
    }

    static async searchToTitle(rqst)
    {
        var videoTitle;
        try{var result = await YTsearch(rqst);}
        catch(error) {console.error(error); return undefined;}
        var videos = result.videos.slice(0,1);
        videos.forEach(function(x) {
            videoTitle = x.title;
        });
        return videoTitle;
    }

    static async IDtoTitle(rqst)
    {
        let videoTitle;
        try{var result = await YTsearch(rqst);}
        catch(error) {console.error(error); return undefined;}
        let videos = result.videos.slice(0,1);
        videos.forEach(function(x) {
            videoTitle = x.title;
        });
        return videoTitle;
    }

    static async searchToID(rqst)
    {
        var videoID;
        try{var result = await YTsearch(rqst);}
        catch(error) {console.error(error); return undefined;}
        var videos = result.videos.slice(0,1);
        videos.forEach(function(x) {
            videoID = x.videoId;
        })
        return videoID;
    }w
}