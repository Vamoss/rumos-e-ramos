
import Node from './node';
import Branch from './branch';
import EventDispatcher from './eventdispatcher';

class Tree extends EventDispatcher {
	constructor(p5, canvas){
        super();

        this.p5 = p5;
		this.canvas = canvas;
		
		this.root = null;
		this.nodes = [];
		this.branches = [];
		
		this.selected = null;	
		
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
	
	addNew(id, x, y, parentId){
        var parent = this.nodes.find(n => n.id == parentId);
		var node = new Node(this.p5, id, x, y, parent, this.canvas);
		node.on("pulse", this.onPulse.bind(this));
		node.on("move", this.onMove.bind(this));
		
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

    updateNodePos(id, x, y){
        var node = this.nodes.find(n => n.id == id);
        if(node){
            node.pos.x = x;
            node.pos.y = y;
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
            this.emit('add', {
                id: this.p5.floor(this.p5.random(1000000)),
                x: this.p5.mouseX - this.transX,
                y: this.p5.mouseY - this.transY,
                parent: this.selected.id
            });
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
        if(this.root)
    		this.root.pulse();
	}
	
	onPulse(data){
        this.emit('pulse', data);
	}	
	
	onMove(data){
        this.emit('move', data);
	}	
}

export default Tree;