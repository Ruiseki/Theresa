export default class TheresaTalking {
    static display()
    {
        document.querySelector('#theresa_talking').style.display = 'block';
    }

    static hide()
    {
        document.querySelector('#theresa_talking').style.display = 'none';   
    }

    static loginPosition()
    {
        let theresa_talking = document.querySelector('#theresa_talking p'),
            theresa_talking_img = document.querySelector('#theresa_talking img');
        
        theresa_talking.style.top = 'calc( 10% + var(--theresa_img_size) )';
        theresa_talking.style.marginLeft = '50%';
        theresa_talking.style.transform = 'translateX(-50%)';

        theresa_talking_img.style.top = '10%';
        theresa_talking_img.style.marginLeft = '50%';
        theresa_talking_img.style.transform = 'translateX(-50%)';
    }

    static register()
    {
        
    }

    static setText(text)
    {
        document.querySelector('#theresa_talking p').innerHTML = text;
    }
}