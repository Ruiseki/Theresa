var host = 'http://localhost',
    port = '42847';

import MusicFolder from './module/musicFolder.js';
import LoginRegister from './module/LoginRegister.js';
import TheresaTalking from './module/TheresaTalking.js';
import ApiRequester from './module/ApiRequester.js';

// ------------------------------------------------------------------------ //

ApiRequester.init(host, port);
ApiRequester.setActiveUser( JSON.parse(localStorage.getItem('lastLogin')) );

document.querySelector('#addMusicInput').addEventListener('change', MusicFolder.fileLoaded);

// ------------------------------------------------------------------------ //

if(ApiRequester.getActiveUser() == null)
{
    TheresaTalking.display();
    LoginRegister.loginDisplay();
    LoginRegister.darkBackgroundDisplay();

    TheresaTalking.loginPosition();
}
else
{
    MusicFolder.update();
}

window.addFileDisplay   = MusicFolder.addFileDisplay;
window.addFileHide      = MusicFolder.addFileHide;
window.uploadTrack      = MusicFolder.upload;
window.removeTrack      = MusicFolder.remove;
window.signIn           = LoginRegister.signIn;
window.register         = LoginRegister.registerDisplay;
window.logout           = LoginRegister.logout;