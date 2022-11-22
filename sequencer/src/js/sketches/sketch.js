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

//const mqtt = require('mqtt');
import mqtt from "precompiled-mqtt";

function sketch(p) {
    var tree;
    var graphics;

    const useSound = true;
    var oscs = [], envelopes = [];
    const maxSound = 10;
    var soundCounter = 0;
    const loopInFrames = 240;
    
    var client;
    const channel = "ramos";
        
    p.setup = function() {
        var parent = this.canvas.parentElement;
        var renderer = p.createCanvas(parent.offsetWidth, parent.offsetHeight);
        graphics = p.createGraphics(p.width, p.height);
        tree = new Tree(p, graphics);
        tree.addNew(0, p.width/2, p.height/2, null);
        tree.on("pulse", onPulse.bind(this));


        //*
        tree.addRandom();
        /**/


        client = mqtt.connect("ws://participants:prp1nterac@34.172.96.169:9110")
        
        client.subscribe(channel, function (err) {
            console.log("mqtt subscribed");
             if(err) console.error(err);
        })

        client.on('connect', function (connack) {
            console.log("mqtt connected", connack.sessionPresent)
        })
        
        client.on('message', function (topic, message) {
            console.log(topic, message.toString())
        })
        
        if(useSound){
            for(var i = 0; i < maxSound; i++){
                var osc = new p5.SinOsc();
                var envelope = new p5.Env();
                envelope.setADSR(0.01, 1.0, 0.1, 0.5);
                envelope.setRange(1, 0);
                osc.start();
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

    function onPulse(data){
        const scale = [60, 62, 64, 66, 69, 70];//C, D, E, F♯, G, A, B♭
        var angle = 0;
        if(data.parent){
            angle =  Math.atan2(data.parent.pos.y - data.pos.y, data.parent.pos.x - data.pos.x);
            if(angle < 0) angle += p.TWO_PI;
        }
        var note = Math.floor((angle / p.TWO_PI) * scale.length);
        let midiValue = scale[note];
        let freqValue = p.midiToFreq(midiValue);
        
        console.log("mqtt publish", freqValue.toString());
        client.publish(channel, freqValue.toString());

        if(useSound){
            oscs[soundCounter].freq(freqValue);
            envelopes[soundCounter].play(oscs[soundCounter], 0, 0.1);
            soundCounter++;
            if(soundCounter >= oscs.length)
                soundCounter = 0;
        }
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