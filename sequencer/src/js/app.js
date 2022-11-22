/* Bootstrap */
import '../scss/app.scss';

/* p5js */
import sketch from './sketches/sketch';

/* Demo JS */
import './demo.js';


/**
* Start sketches
*/
const p5Hero = new p5(sketch, 'hero');
