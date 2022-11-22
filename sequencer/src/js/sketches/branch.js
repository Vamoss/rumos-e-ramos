import p52 from "p5"

class Branch {
	constructor(p5, node1, node2, canvas){
        this.p5 = p5;
		this.node1 = node1;
		this.node2 = node2;
		this.canvas = canvas;
	}
	
	draw() {		
		const handle_len_rate = 1.5;
		this.path = this.metaball(this.node1, this.node2, 0.5, handle_len_rate);
	
		if(!this.path)
			return;
		
		this.canvas.fill(this.node2.color);
		var gradient = this.canvas.drawingContext.createLinearGradient(
			this.node2.pos.x, this.node2.pos.y,
			this.node1.pos.x, this.node1.pos.y
		);
		gradient.addColorStop(0.2, this.node2.color.toString());
		gradient.addColorStop(0.8, this.node1.color.toString());

		// Set the fill style and draw a rectangle
		this.canvas.drawingContext.fillStyle = gradient;

		this.canvas.beginShape();
		for(var j = 0; j < 4; j++){
			if(j==0) this.canvas.vertex(this.path.segments[j].x, this.path.segments[j].y);
			else if(j%2!=0) {
				this.canvas.vertex(this.path.segments[(j+1)%4].x, this.path.segments[(j+1)%4].y);
			}
			if(j%2!=0) continue;
			this.canvas.bezierVertex(
				this.path.segments[j].x+this.path.handles[j].x, this.path.segments[j].y+this.path.handles[j].y,
				this.path.segments[(j+1)%4].x+this.path.handles[(j+1)%4].x, this.path.segments[(j+1)%4].y+this.path.handles[(j+1)%4].y,
				this.path.segments[(j+1)%4].x, this.path.segments[(j+1)%4].y
			);
		}
		this.canvas.endShape();
	}
	
	//Original metaballs code from paperjs, by Jürg Lehni & Jonathan Puckey
	//http://paperjs.org/examples/meta-balls/
	metaball(ball1, ball2, v, handle_len_rate) {
		var radius1 = ball1.radius/2;
		var radius2 = ball2.radius/2;
		var center1 = ball1.pos;
		var center2 = ball2.pos;
		var d = center1.dist(center2);
		var u1 = 0;
		var u2 = 0;
		if (d <= this.p5.abs(radius1 - radius2)) {
			return;
		} else if (d < radius1 + radius2) {
			// case circles are overlapping
			u1 = this.p5.acos((radius1 * radius1 + d * d - radius2 * radius2) / (2 * radius1 * d));
			u2 = this.p5.acos((radius2 * radius2 + d * d - radius1 * radius1) / (2 * radius2 * d));
		}
		var angle1 = this.p5.atan2(center2.y - center1.y, center2.x - center1.x);
		var angle2 = this.p5.acos((radius1 - radius2) / d);
		var angle1a = angle1 + u1 + (angle2 - u1) * v;
		var angle1b = angle1 - u1 - (angle2 - u1) * v;
		var angle2a = angle1 + this.p5.PI - u2 - (this.p5.PI - u2 - angle2) * v;
		var angle2b = angle1 - this.p5.PI + u2 + (this.p5.PI - u2 - angle2) * v;
		var p1a = p52.Vector.add(center1, p52.Vector.fromAngle(angle1a, radius1));
		var p1b = p52.Vector.add(center1, p52.Vector.fromAngle(angle1b, radius1));
		var p2a = p52.Vector.add(center2, p52.Vector.fromAngle(angle2a, radius2));
		var p2b = p52.Vector.add(center2, p52.Vector.fromAngle(angle2b, radius2));
		// define handle length by the distance between
		// both ends of the curve to draw
		var d2 = this.p5.min(v * handle_len_rate, this.p5.dist(p1a.x, p1a.y, p2a.x, p2a.y) / (radius1 + radius2));
		// case circles are overlapping:
		d2 *= this.p5.min(1, d * 2 / (radius1 + radius2));
		radius1 *= d2;
		radius2 *= d2;
		var path = {
			segments: [p1a, p2a, p2b, p1b],
			handles: [
				p52.Vector.fromAngle(angle1a - this.p5.HALF_PI, radius1),
				p52.Vector.fromAngle(angle2a + this.p5.HALF_PI, radius2),
				p52.Vector.fromAngle(angle2b - this.p5.HALF_PI, radius2),
				p52.Vector.fromAngle(angle1b + this.p5.HALF_PI, radius1)
			]
		};
		return path;
	}
}

export default Branch;