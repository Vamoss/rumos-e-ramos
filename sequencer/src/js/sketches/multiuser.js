import mqtt from "precompiled-mqtt";
import EventDispatcher from './eventdispatcher';

class Multiuser extends EventDispatcher {
	constructor(){
        super();

        this.dataTopic = "ramos";
        this.connTopic = "multiuser";

        this.isConfigured = false;
        this.data = [];

        this.timeoutInterval;

        this.client = mqtt.connect("ws://participants:prp1nterac@34.172.96.169:9110")
        
        var _this = this;
        this.client.subscribe(this.dataTopic, function (err) {
            console.log("mqtt subscribed to", _this.dataTopic);
             if(err) console.error(err);
        })

        this.client.subscribe(this.connTopic, function (err) {
            console.log("mqtt subscribed to", _this.connTopic);
             if(err) console.error(err);

             setTimeout(() => {
                _this.client.publish(_this.connTopic, "newConn");
                _this.timeoutInterval = setTimeout(() => {
                    _this.isConfigured = true;
                    _this.emit("start");
                }, 2000);
            }, Math.random() * 2000);
        })

        this.client.on('connect', function (connack) {
            console.log("mqtt connected", connack.sessionPresent);
        })
        
        this.client.on('message', function (topic, message) {
            //console.log(topic, message.toString());
            if(topic === _this.connTopic){
                var messageCmd = message.toString().split("=");
                var command = messageCmd[0];
                if(command === "newConn"){
                    if(_this.isConfigured){
                        _this.client.publish(_this.connTopic, "data="+JSON.stringify(_this.data));
                    }
                }else if(command === "move"){
                    if(_this.isConfigured){
                        var info = JSON.parse(messageCmd[1]);
                        var found = _this.data.find(o => o.id == info.id);
                        if(found){
                            found.x = info.x;
                            found.y = info.y;
                            _this.emit("move", info);
                        }
                    }
                }else if(command === "add"){
                    if(_this.isConfigured){
                        var info = JSON.parse(messageCmd[1]);
                        _this.data.push(info);
                        _this.emit("add", info);
                    }
                }else if(command === "data"){
                    if(!_this.isConfigured){
                        _this.isConfigured = true;
                        clearInterval(_this.timeoutInterval);

                        _this.data = JSON.parse(messageCmd[1]);
                        _this.emit("data", _this.data);
                    }
                }
            }
        })
    }

    add(id, x, y, parent){
        this.client.publish(this.connTopic, "add="+JSON.stringify({id, x, y, parent}));
    }

    move(id, x, y){
        this.client.publish(this.connTopic, "move="+JSON.stringify({id, x, y}));
    }

    publish(message){
        //console.log("mqtt publish", message);
        this.client.publish(this.dataTopic, message);
    }
}

export default Multiuser;