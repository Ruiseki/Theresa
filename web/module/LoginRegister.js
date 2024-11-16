import ApiRequester, { activeUser } from "./ApiRequester.js";
import MusicFolder from "./MusicFolder.js";
import TheresaTalking from "./TheresaTalking.js";

export default class LoginRegister
{
    static darkBackgroundDisplay()
    {
        document.querySelector('#dark_background').style.display = 'block';
    }

    static darkBackgroundHide()
    {
        document.querySelector('#dark_background').style.display = 'none';
    }

    static loginDisplay()
    {
        document.querySelector('#login-register').style.display = 'block';
        document.querySelector('#no_account').addEventListener('click', () => {
            LoginRegister.registerDisplay(0);
        });
    }
    
    static loginHide()
    {
        document.querySelector('#dark_background').style.display = 'none';
    }

    static async signIn()
    {
        let username = document.querySelector('#login_username').value,
            password = document.querySelector('#login_password').value,
            theresa_talking = document.querySelector('#theresa_talking p');

        document.querySelector('#error_login_username').style.display = 'none';
        document.querySelector('#error_login_password').style.display = 'none';
        document.querySelector('#error_login').style.display = 'none';

        if(username.length < 3) document.querySelector('#error_login_username').style.display = 'block';
        if(password.length < 6) document.querySelector('#error_login_password').style.display = 'block';
        if(username.length < 3 || password.length < 6) return;

        await ApiRequester.login(username, password);
        if(activeUser == null)
        {
            document.querySelector('#error_login').style.display = 'block';
            return;
        }

        localStorage.setItem('lastLogin', JSON.stringify(activeUser));
        document.querySelector('#login_username').value = '';
        document.querySelector('#login_password').value = '';

        theresa_talking.innerHTML = `Welcome again ${activeUser.username} !`;
        MusicFolder.update(activeUser.musics);
        document.querySelector('#dark_background').style.display = 'none';
        setTimeout(() => {
            document.querySelector('#theresa_talking').style.display = 'none';
        }, 1000);
        document.querySelector('#login-register').style.display = 'none';
    }

    static logout()
    {
        localStorage.setItem('lastLogin', null);
        ApiRequester.setActiveUser(null);
        MusicFolder.update([]);

        LoginRegister.darkBackgroundDisplay();
        LoginRegister.loginDisplay();
        TheresaTalking.setText('Happy to see you again~');
        TheresaTalking.loginPosition();
        TheresaTalking.display();
    }

    static async registerDisplay(registerMenu)
    {
        if(registerMenu == 0)
        {
            document.querySelector('#login').style.display = 'none';
            document.querySelector('#register').style.display = 'flex';
            document.querySelector('#back2login').addEventListener('click', () => {
                document.querySelector('#login').style.display = 'flex';
                document.querySelector('#register').style.display = 'none';
            });
            registerMenu = 1;
        }
        else if(registerMenu == 1)
        {
            let username = document.querySelector('#register_username').value,
                password = document.querySelector('#register_password').value,
                passwordVerif = document.querySelector('#confirm_register_password').value;

            document.querySelector('#error_register_username').style.display         = "block";
            document.querySelector('#error_register_password').style.display         = "block";
            document.querySelector('#error_register_confirm_password').style.display = "block";

            if(username.length < 3) document.querySelector('#error_register_username').style.display = "block";
            if(password.length < 6) document.querySelector('#error_register_password').style.display = "block";
            if(password != passwordVerif) document.querySelector('#error_register_confirm_password').style.display = "block";
            
            if(username < 3 || password.length < 6 || password != passwordVerif) return;

            let loginInfo = await ApiRequester.login(username, password);

            console.log(loginInfo);

            if(loginInfo == null)
            {
                document.querySelector('#register_step_2').style.display = 'flex';
                document.querySelector('#register_step_1').style.display = 'none';
                registerMenu = 2;
            }
            else
            {
                // account already exist
            }
        }
    }

    static registerHide()
    {
        document.querySelector('#login').style.display = 'flex';
        document.querySelector('#register').style.display = 'none';
    }
}