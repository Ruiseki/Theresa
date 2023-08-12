import ApiRequester from "./ApiRequester.js";
import LoginRegister from "./LoginRegister.js";

export default class MusicFolder
{
    static async addFileDisplay()
    {
        LoginRegister.darkBackgroundDisplay();
        document.querySelector('#addMusic').style.display = 'block';
    }

    static addFileHide()
    {
        document.querySelector('#addMusic').style.display = 'none';
        LoginRegister.darkBackgroundHide();
    }

    static async remove()
    {
        let checkedMusics = [];
        let musics = await ApiRequester.getUserMusic();
        document.querySelectorAll('#musicList li').forEach(async element => {
            if(element.querySelector('input').checked)
            {
                for(let file of musics)
                {
                    let elementTransform = element.querySelector('p').innerHTML ;
                    elementTransform = elementTransform.replace(/&amp;/g, '&');

                    if(file.title == elementTransform || file.fileNameNoExt == elementTransform)
                    {
                        checkedMusics.push(file.fileName);
                        break;
                    }
                }
            }
        });

        await ApiRequester.removeTrack(checkedMusics);
        await MusicFolder.update();
    }

    static fileLoaded()
    {
        let fileDescriptionText = document.querySelector('#loadedFileDescription');
        let fileSizeText = document.querySelector('#loadedFileSize');
        let fileDescriptor = document.querySelector('#addMusicInput').files;
        
        if(fileDescriptor.length == 0)
        {
            fileDescriptionText.innerHTML = 'Waiting for file(s)...';
            fileSizeText.style.display = 'none';
        }
        else
        {
            fileSizeText.style.display = 'block';
            fileDescriptionText.style.marginBottom = '40px';
            fileSizeText.style.marginTop = '40px';

            if(fileDescriptor.length == 1)
            {
                fileDescriptionText.innerHTML = `File loaded : ${fileDescriptor[0].name}`;
                fileSizeText.innerHTML = `Size : ${(fileDescriptor[0].size / 1024 / 1024).toFixed(2)} Mo`;
            }
            else
            {
                let totalSize = 0;
                for(let element of fileDescriptor) totalSize += element.size;
                totalSize = (totalSize / 1024 / 1024).toFixed(2);
                fileDescriptionText.innerHTML = `Number of files loaded : ${fileDescriptor.length}`;
                fileSizeText.innerHTML = `Size : ${totalSize} Mo`;
            }
        }
    }

    static async upload()
    {
        document.querySelector('#loadedFileDescription').innerHTML = 'Uploading please wait ...';
        await ApiRequester.sendFile('/musics/upload', document.querySelector('#addMusicInput').files);
        await MusicFolder.update();
        document.querySelector('#loadedFileDescription').innerHTML = 'Waiting for file(s)...';
        MusicFolder.addFileHide();
    }

    static async update()
    {
        let activeUser = ApiRequester.getActiveUser();

        let musicList = document.querySelectorAll('.musicField');
        for(let i = 1; i < musicList.length; i++) document.querySelector('#musicList').removeChild(musicList[i]);

        if(activeUser != null)
        {
            // reading music directory
            let userMusics = await ApiRequester.getUserMusic();
            userMusics.forEach(element => {
                let music = document.querySelector('#musicFieldOrigin li').cloneNode(true);
                music.querySelector('.musicTitle').innerHTML = element.title ? element.title : element.fileNameNoExt;
                music.querySelector('.musicArtist').innerHTML = element.artist ? element.artist : "--unknown--";
                document.querySelector('#musicList').appendChild(music);
            });
        }
    }
}