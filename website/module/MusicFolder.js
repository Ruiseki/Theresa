import ApiRequester from "./ApiRequester.js";
import LoginRegister from "./LoginRegister.js";

let dropArea = document.querySelector("#addMusic label");
dropArea.addEventListener('dragover', event => {
    event.preventDefault();
    dropArea.style.boxShadow = '0px 0px 30px blue';
    dropArea.style.transitionDelay = '0s';
    dropArea.style.borderColor = 'blue';
});
dropArea.addEventListener('dragleave', event => {
    event.preventDefault();
    dropArea.style.boxShadow = 'none';
    dropArea.style.transitionDelay = '250ms';
    dropArea.style.borderColor = 'black';
});
dropArea.addEventListener('mouseover', event => {
    dropArea.style.boxShadow = '0px 0px 30px lime';
    dropArea.style.transitionDelay = '0s';
    dropArea.style.borderColor = 'lime';
});
dropArea.addEventListener('mouseleave', event => {
    dropArea.style.boxShadow = 'none';
    dropArea.style.transitionDelay = '250ms';
    dropArea.style.borderColor = 'black';
});
dropArea.addEventListener('drop', event => {
    event.preventDefault();
    dropArea.style.boxShadow = 'none';
    dropArea.style.transitionDelay = '250ms';
    dropArea.style.borderColor = 'black';

    document.querySelector('#addMusicInput').files = event.dataTransfer.files;
    MusicFolder.fileLoaded();
});

document.querySelector('#inputSearchByTitle').addEventListener('keyup', searchTrack);

document.querySelector('#inputSearchByArtist').addEventListener('keyup', searchTrack);

async function searchTrack()
{
    let filteredArray = await ApiRequester.getUserMusic();
    let queryTitle = document.querySelector('#inputSearchByTitle').value;
    let queryArtist = document.querySelector('#inputSearchByArtist').value;

    filteredArray = filteredArray.filter(value => (!queryTitle || value.title && value.title.toLowerCase().includes(queryTitle.toLowerCase())) || value.fileNameNoExt.includes(queryTitle.toLowerCase()));
    filteredArray = filteredArray.filter(value => !queryArtist || value.artist && value.artist.toLowerCase().includes(queryArtist.toLowerCase()));

    MusicFolder.update(filteredArray);
}

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
        document.querySelectorAll('.musicField').forEach(async element => {
            if(element.querySelector('input').checked)
            {
                let title = element.querySelector('.musicTitle').innerHTML;
                let artist = element.querySelector('.musicArtist').innerHTML;
                title = title.replace('&amp;', '&');
                artist = artist.replace('&amp;', '&');

                artist = artist == "--unknown--" ? null : artist;

                for(let file of musics)
                {
                    if((file.title == title || file.fileNameNoExt == title) && file.artist == artist)
                    {
                        checkedMusics.push(file.fileName);
                        break;
                    }
                }
            }
        });

        await ApiRequester.removeTrack(checkedMusics);
        await MusicFolder.update(await ApiRequester.getUserMusic());
        document.querySelectorAll('.musicField input').forEach(element => {
            if(element.checked) element.checked = false
        });
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
        await MusicFolder.update(await ApiRequester.getUserMusic());
        document.querySelector('#loadedFileDescription').innerHTML = 'Waiting for file(s)...';
        document.querySelector('#loadedFileDescription').style.marginBottom = '';
        document.querySelector('#loadedFileSize').style.display = "none";
        MusicFolder.addFileHide();
    }

    static async update(userMusics)
    {
        let activeUser = ApiRequester.getActiveUser();

        /* document.querySelectorAll('#musicList .musicField input').forEach(input => {
            input.removeEventListener('change');
        }); */

        document.querySelectorAll('#musicList > li').forEach(li => document.querySelector('#musicList').removeChild(li));

        
        if(activeUser != null)
        {
            userMusics.sort((a, b) => {
                a = !a.title ? a.fileNameNoExt : a.title;
                b = !b.title ? b.fileNameNoExt : b.title;

                if      (a < b) return -1;
                else if (a > b) return 1;
                else            return 0;
            });
            userMusics.forEach(element => {
                let music = document.querySelector('#musicBase .musicField').cloneNode(true);

                music.querySelector('.musicTitle').innerHTML = element.title ? element.title : element.fileNameNoExt;
                if(music.querySelector('.musicTitle').innerHTML != element.fileNameNoExt) music.querySelector('.musicFileName').innerHTML = element.fileNameNoExt;
                else music.querySelector('.musicFileName').style.display = 'none';

                music.querySelector('.musicArtist').innerHTML = element.artist ? element.artist : "--unknown--";

                music.querySelector('.fileExt').innerHTML = element.extension;

                let idName = `inputFor${element.fileNameNoExt.replace(/ +/g, '_')}`;
                music.querySelector('input').setAttribute('id', idName);
                music.querySelector('label').setAttribute('for', idName);

                let musicTitle = music.querySelector('.musicTitle').innerHTML;
                let letterList = null, letter;

                if(musicTitle.search(/(^[A-Za-z])/g) != -1)
                    letter = musicTitle[0].toUpperCase();
                else letter = "あ";

                letterList = document.querySelector(`.musicListLetter${letter} ul`);

                if(!letterList)
                {
                    let newLetterList = document.querySelector('#musicBase .listLetter').cloneNode(true);
                    newLetterList.classList.add(`musicListLetter${letter}`);
                    newLetterList.querySelector('p').innerHTML = letter;
                    newLetterList.querySelector('input').setAttribute('id', `inputFor${letter}`);
                    newLetterList.querySelector('label').setAttribute('for', `inputFor${letter}`);

                    document.querySelector('#musicList').appendChild(newLetterList);
                    letterList = document.querySelector(`.musicListLetter${letter} ul`);
                }

                letterList.appendChild(music);
            });

            let musicFieldLi = document.querySelectorAll('#musicList .musicField');

            document.querySelectorAll('#musicList .musicField input').forEach(input => {
                input.addEventListener('change', event => {
                    let allCheck = true;
                    document.querySelectorAll('#musicList .musicField input').forEach(element => { if(!element.checked) allCheck = false });

                    if(allCheck)
                    {
                        document.querySelector('#selectAllText').style.display = "none";
                        document.querySelector('#unselectAllText').style.display = "block";
                    }
                    else
                    {
                        document.querySelector('#selectAllText').style.display = "block";
                        document.querySelector('#unselectAllText').style.display = "none";
                    }
                });
            });

            for(let i = 0; i < musicFieldLi.length; i++)
            {
                let li = musicFieldLi[i];

                let fileName = li.querySelector('.musicFileName').style.display == 'none' ? li.querySelector('.musicTitle').innerHTML : li.querySelector('.musicFileName').innerHTML;
                fileName = encodeURI(fileName);
                let fileExt = li.querySelector('.fileExt').innerHTML;
                li.querySelector('img').src = ApiRequester.getTrackThumbnail(`${fileName}.${fileExt}`)+'?res=low';
            }
        }
    }

    static selectionOnTracks(selection)
    {
        let inputs = document.querySelectorAll('#musicList .musicField input');
        for(let input of inputs)
            input.checked = false ? selection : selection;

        if(selection)
        {
            document.querySelector('#selectAllText').style.display = "none";
            document.querySelector('#unselectAllText').style.display = "block";
        }
        else
        {
            document.querySelector('#selectAllText').style.display = "block";
            document.querySelector('#unselectAllText').style.display = "none";
        }
    }
}