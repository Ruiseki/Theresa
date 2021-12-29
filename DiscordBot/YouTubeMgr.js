const ytdl = require('ytdl-core');
const YTsearch = require('yt-search');

module.exports = class YouTubeMgr {

    static async IdToURL(id)
    {
        try
        {
            var array = (await YTsearch(id)).videos.slice(0,6);
        }
        catch(error)
        {
            console.error(error); return undefined;
        }
        var videoUrl;
        array.forEach(element => {
            if(element.videoId == id) videoUrl = element.url;
        });
        return videoUrl;
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

    static async IdToTitle(id)
    {
        try
        {
            var array = (await YTsearch(id)).videos.slice(0,6);
        }
        catch(error)
        {
            console.error(error); return undefined;
        }
        let videoTitle;
        array.forEach(element => {
            if(element.videoId == id) videoTitle = element.title;
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
    }
}