/* Bootstrap */
import '../scss/app.scss';

/* p5js */
import sketch from './sketches/sketch';

/* Demo JS */
import './demo.js';


/**
* Start sketches
*/
let btn = document.createElement("button");
btn.innerHTML = "Começar";
btn.onclick = function () {
    document.body.removeChild(btn);
    new p5(sketch, 'main');
};
document.body.appendChild(btn);