import EventDispatcher from './eventdispatcher';
class Node extends EventDispatcher {
	static STATES = {FREE: 0, OVER: 1, PRESSED: 2};	
	static MIN_RADIUS = 20;
	static MAX_RADIUS = 80;
	static PULSE_GROW = 10;
	
	constructor(p5, id, x, y, parent, canvas){
        super();

        this.p5 = p5;
		this.id = id;
		this.pos = this.p5.createVector(x, y);
		this.parent = parent;
		this.canvas = canvas;
		
		this.radius = Node.MIN_RADIUS * 2;
		
		this.pulseRadius = 0;
		this.pulsed = false;

		this.children = [];
		if(this.parent){
			this.color = this.p5.color(
				this.p5.constrain(this.parent.color._getRed() + this.p5.random(-80, 80), 0, 255),
				this.p5.constrain(this.parent.color._getGreen() + this.p5.random(-80, 80), 0, 255),
				this.p5.constrain(this.parent.color._getBlue() + this.p5.random(-80, 80), 0, 255)
			);
			this.parent.children.push(this);
		}else{
			this.color = this.p5.color(this.p5.random(255), this.p5.random(255), this.p5.random(255));
		}

		this.overColor = this.p5.color(
			this.p5.constrain(this.color._getRed() + 60, 0, 255),
			this.p5.constrain(this.color._getGreen() + 60, 0, 255),
			this.p5.constrain(this.color._getBlue() + 60, 0, 255)
		);

		this.pressColor = this.p5.color(
			this.p5.constrain(this.color._getRed() - 30, 0, 255),
			this.p5.constrain(this.color._getGreen() - 30, 0, 255),
			this.p5.constrain(this.color._getBlue() - 30, 0, 255)
		);

		this.state = Node.STATES.FREE;
	}
	
	draw(selected){
		if(this.children.length > 0){
			this.canvas.strokeWeight(1);
			this.canvas.stroke(this.pressColor);
			this.canvas.noFill();
			this.canvas.circle(this.pos.x, this.pos.y, this.pulseRadius);
						
			this.children.forEach(c => {
				var distance = 2 *this.p5.dist(this.pos.x, this.pos.y, c.pos.x, c.pos.y);
				if(distance > this.pulseRadius && distance < this.pulseRadius + Node.PULSE_GROW){
					c.pulse();
				}
			});
			
			this.pulseRadius += Node.PULSE_GROW;
		}
		
		this.canvas.strokeWeight(4);
		this.canvas.stroke(this.color);
		if(this.state == Node.STATES.PRESSED || selected || this.p5.frameCount - this.pulsed < 8)
			this.canvas.fill(this.pressColor);
		else if(this.state == Node.STATES.FREE)
			this.canvas.fill(255);
		else if(this.state == Node.STATES.OVER)
			this.canvas.fill(this.overColor);

		var destRadius = this.destRadius;
		if(this.p5.frameCount - this.pulsed < 8){
			destRadius += 30;
		}
		this.radius += (destRadius - this.radius) * 0.09;

		this.canvas.circle(this.pos.x, this.pos.y, this.radius-4);

		this.canvas.strokeWeight(1);
		this.canvas.stroke(this.pressColor);
		this.canvas.circle(this.pos.x, this.pos.y, this.radius-6);
	}
	
	mouseMoved(x, y){
		var distance = this.p5.dist(this.pos.x, this.pos.y, x, y);
		if(distance < this.radius/2){
			this.state = Node.STATES.OVER;
			this.destRadius = this.originalRadius * 1.5;
			this.p5.cursor(this.p5.HAND);
		}else{
			this.state = Node.STATES.FREE;
			this.destRadius = this.originalRadius;
		}
	}
	
	mousePressed(x, y){
		var distance = this.p5.dist(this.pos.x, this.pos.y, x, y);
		if(distance < this.radius/2){
			this.state = Node.STATES.PRESSED;
			this.dragged = false;
            this.virtualX = this.pos.x;
            this.virtualY = this.pos.y;
		}
	}
	
	mouseDragged(x, y){
		if(this.state == Node.STATES.PRESSED){
			this.dragged = true;
			this.virtualX += x;
			this.virtualY += y;
            this.emit('move', this);
		}
	}
	
	mouseReleased(x, y){
		
	}
	
	pulse(){
		this.pulseRadius = 0;
		this.pulsed = this.p5.frameCount;
		this.emit('pulse', this);
	}
}

export default Node;