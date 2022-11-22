
import Node from './node';
import Branch from './branch';

class Tree {
	constructor(p5, canvas){
        this.p5 = p5;
		this.canvas = canvas;
		
		this.root = null;
		this.nodes = [];
		this.branches = [];
		
		this.selected = null;
		this._events = {};		
		
		//pan
		this.transX = 0
		this.transY = 0
		this.draggingMap = false;
		this.boundBox = null;	
	}

	draw(){
		this.canvas.push();
			this.canvas.translate(this.transX, this.transY);

			//draw branches
			this.canvas.noStroke();
			this.branches.forEach(b => b.draw());

			//draw nodes
			this.canvas.fill(0);
			this.nodes.forEach(d => d.draw(d == this.selected));

			/*
			//draw texts
			noStroke();
			fill(0);
			textAlign(CENTER, CENTER);
			data.forEach(d => {	
				var size = d.radius * 0.8;
				textSize(size);
				text(d.id, d.pos.x, d.pos.y + size/10);
			})	
			*/
		this.canvas.pop();
	}
	
	addNew(id, x, y, parent){
		var node = new Node(this.p5, id, x, y, parent, this.canvas);
		node.on("pulse", this.onPulse.bind(this));
		
		this.nodes.push(node);
		
		if(parent){
			this.branches.push(new Branch(this.p5, node, parent, this.canvas));
		}
		
		if(!this.root){
			this.root = node;
		}
		
		this.calculateSize();
		this.calculateBoundbox();

        return node;
	}

    addRandom() {
        var nodes = [this.root];
        for(var i = 0; i < 20; i++){
            var node = this.addNew(this.p5.floor(this.p5.random(1000)), this.p5.random(this.p5.width), this.p5.random(this.p5.height), this.p5.random(nodes));
            nodes.push(node);
        }
    }
	
	calculateSize(){
		var minValue = Math.min.apply(Math, this.nodes.map(d => d.children.length));
		var maxValue = Math.max.apply(Math, this.nodes.map(d => d.children.length));
		if(minValue == 0 && maxValue == 0){
			//in case only the first node exists, this condition will be true
			minValue = -1;
		}
		this.nodes.forEach(d => d.originalRadius = d.destRadius = this.p5.map(d.children.length, minValue, maxValue, Node.MIN_RADIUS, Node.MAX_RADIUS));
	}

	calculateBoundbox(){	
		var minX = this.p5.width/2;
		var maxX = this.p5.width/2;
		var minY = this.p5.height/2;
		var maxY = this.p5.height/2;

		this.nodes.forEach(d => {
			minX = this.p5.min(minX, d.pos.x);
			maxX = this.p5.max(maxX, d.pos.x);
			minY = this.p5.min(minY, d.pos.y);
			maxY = this.p5.max(maxY, d.pos.y);
		});

		var margin = 100;
		this.boundBox = {
			left: 	this.p5.min(minX - margin, 0),
			top: 	this.p5.min(minY - margin, 0),
			right: 	this.p5.max(maxX + margin, this.p5.width),
			bottom: this.p5.max(maxY + margin, this.p5.height)
		};
	}

	mouseMoved(){
		this.nodes.forEach(d => d.mouseMoved(this.p5.mouseX-this.transX, this.p5.mouseY-this.transY));
		if(!this.nodes.some(d => d.state == Node.STATES.OVER)){
			this.p5.cursor(this.p5.ARROW);
		}
	}

	mouseDragged(){
		if(this.draggingMap){
			this.transX += this.p5.mouseX - this.p5.pmouseX;
			this.transY += this.p5.mouseY - this.p5.pmouseY;

			//limit to boundBox
			this.transX = this.p5.min(this.transX, -this.boundBox.left);
			this.transX = this.p5.max(this.transX, this.canvas.width-this.boundBox.right);
			this.transY = this.p5.min(this.transY, -this.boundBox.top);
			this.transY = this.p5.max(this.transY, this.canvas.height-this.boundBox.bottom);
		}else{
			this.nodes.forEach(d => d.mouseDragged(this.p5.mouseX - this.p5.pmouseX, this.p5.mouseY - this.p5.pmouseY));
        }
	}

	mousePressed(){
		this.nodes.forEach(d => d.mousePressed(this.p5.mouseX-this.transX, this.p5.mouseY-this.transY));
		this.draggingMap = !this.nodes.some(d => d.state == Node.STATES.PRESSED);
		if(this.draggingMap && this.selected){
			this.addNew(this.nodes.length, this.p5.mouseX - this.transX, this.p5.mouseY - this.transY, this.selected);
			this.selected = null;
		}
	}

	mouseReleased(){
		this.nodes.forEach(d => d.mouseReleased(this.p5.mouseX-this.transX, this.p5.mouseY-this.transY));
		this.draggingMap = false;
		this.selected = this.nodes.find(d => d.state == Node.STATES.PRESSED && !d.dragged);
		var draggedItem = this.nodes.some(d => d.dragged);
		if(draggedItem)
			this.calculateBoundbox();
	}
	
	pulse(){
		this.root.pulse();
	}
	
	onPulse(data){
        this.emit('pulse', data);
	}
	
	//event emitter
	on(name, listener) {
        if (!this._events[name]) {
            this._events[name] = [];
        }
        this._events[name].push(listener);
    }
	
	removeListener(name, listenerToRemove) {
        if (!this._events[name]) {
            throw new Error(`Can't remove a listener. Event "${name}" doesn't exits.`);
        }
        const filterListeners = (listener) => listener !== listenerToRemove;
        this._events[name] = this._events[name].filter(filterListeners);
    }
	
    emit(name, data) {
        if (!this._events[name]) {
            throw new Error(`Can't emit an event. Event "${name}" doesn't exits.`);
        }
        const fireCallbacks = (callback) => {
            callback(data);
        };
        this._events[name].forEach(fireCallbacks);
    }
}

export default Tree;