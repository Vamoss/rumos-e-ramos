/******************
Code by Vamoss
Original code link:
https://openprocessing.org/sketch/1737313

Author links:
http://vamoss.com.br
http://twitter.com/vamoss
http://github.com/vamoss
******************/

import p5 from "p5"
window.p5 = p5
require('p5/lib/addons/p5.sound')

import Tree from './tree';

import Multiuser from './multiuser';

function sketch(p) {
    var tree;
    var graphics;

    const useSound = true;
    var oscs = [], envelopes = [];
    const maxSound = 10;
    var soundCounter = 0;
    const loopInFrames = 240;
    
    var isServer;
    var multiuser;
        
    p.setup = function() {
        var parent = this.canvas.parentElement;
        var renderer = p.createCanvas(parent.offsetWidth, parent.offsetHeight);
        graphics = p.createGraphics(p.width, p.height);
        tree = new Tree(p, graphics);
        tree.on("add", onTreeAdd.bind(this));
        tree.on("move", onTreeMove.bind(this));
        tree.on("pulse", onTreePulse.bind(this));

        multiuser = new Multiuser();
        multiuser.on("start", onMultiuserStart.bind(this));
        multiuser.on("add", onMultiuserAdd.bind(this));
        multiuser.on("move", onMultiuserMove.bind(this));
        multiuser.on("data", onMultiuserData.bind(this));

        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        isServer = urlParams.get("server") === "1";
        
        if(useSound){
            for(var i = 0; i < maxSound; i++){
                var osc = new p5.SinOsc();
                var envelope = new p5.Envelope();
                envelope.setADSR(0.01, 1.0, 0.1, 0.5);
                envelope.setRange(1, 0);
                oscs.push(osc);
                envelopes.push(envelope);
            }
        }
    }

    p.draw = function() {
        graphics.background(255, 255, 220);	
        tree.draw();
        p.image(graphics, 0, 0);
        
        if (p.frameCount % loopInFrames === 0 || p.frameCount === 1) {
            tree.pulse();
        }
    }

    function onTreeAdd(data){
        multiuser.add(data.id, data.x, data.y, data.parent);
    }

    function onTreeMove(data){
        multiuser.move(data.id, data.virtualX, data.virtualY);
    }

    function onTreePulse(data){
        const scale = [60, 62, 64, 66, 69, 70];//C, D, E, F♯, G, A, B♭
        var angle = 0;
        if(data.parent){
            angle =  Math.atan2(data.parent.pos.y - data.pos.y, data.parent.pos.x - data.pos.x);
            if(angle < 0) angle += p.TWO_PI;
        }
        var note = Math.floor((angle / p.TWO_PI) * scale.length);
        let midiValue = scale[note];
        let freqValue = p.midiToFreq(midiValue);
        
        if(isServer)
            multiuser.publish(freqValue.toString());

        if(useSound){
            oscs[soundCounter].freq(freqValue);
            oscs[soundCounter].start();
            envelopes[soundCounter].play(oscs[soundCounter], 0, 0.1);
            soundCounter++;
            if(soundCounter >= oscs.length)
                soundCounter = 0;
        }
    }

    function onMultiuserStart(){
        multiuser.add(0, p.width/2, p.height/2, null);
        /*
        var nodes = [0];
        for(var i = 0; i < 20; i++){
            var id = p.floor(p.random(1000));
            multiuser.add(id, p.random(p.width), p.random(p.height), p.random(nodes));
            nodes.push(id);
        }
        */
    }

    function onMultiuserAdd(data){
        tree.addNew(data.id, data.x, data.y, data.parent);
    }

    function onMultiuserMove(data){
        tree.updateNodePos(data.id, data.x, data.y);
    }
    function onMultiuserData(data){
        data.forEach(d => {
            tree.addNew(d.id, d.x, d.y, d.parent);
        })
        
    }

    p.mouseMoved = function(){
        tree.mouseMoved();
    }

    p.mouseDragged = function(){
        tree.mouseDragged();
    }

    p.mousePressed = function(){
        tree.mousePressed();
    }

    p.mouseReleased = function(){
        tree.mouseReleased();
    }
    
    p.windowResized = function() {
        var parent = this.canvas.parentElement;
        p.resizeCanvas(parent.offsetWidth, parent.offsetHeight);
    }
}

export default sketch;