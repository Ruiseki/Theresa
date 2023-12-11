export var  host = 'http://localhost',
            port = '42847';

import MusicFolder from './module/MusicFolder.js';
import LoginRegister from './module/LoginRegister.js';
import TheresaTalking from './module/TheresaTalking.js';
import ApiRequester, { activeUser } from './module/ApiRequester.js';

// ------------------------------------------------------------------------ //

ApiRequester.setActiveUser( JSON.parse(localStorage.getItem('lastLogin')) );

document.querySelector('#addMusicInput').addEventListener('change', MusicFolder.fileLoaded);

// ------------------------------------------------------------------------ //

if(activeUser == null)
{
    TheresaTalking.display();
    LoginRegister.loginDisplay();
    LoginRegister.darkBackgroundDisplay();

    TheresaTalking.loginPosition();
}
else
{
    MusicFolder.update(await ApiRequester.getUserMusic());
}

window.addFileDisplay       = MusicFolder.addFileDisplay;
window.addFileHide          = MusicFolder.addFileHide;
window.uploadTrack          = MusicFolder.upload;
window.removeTrack          = MusicFolder.remove;
window.selectionOnTracks    = MusicFolder.selectionOnTracks;
window.unselectionOnTracks  = MusicFolder.unselectionOnTracks;
window.signIn               = LoginRegister.signIn;
window.register             = LoginRegister.registerDisplay;
window.logout               = LoginRegister.logout;