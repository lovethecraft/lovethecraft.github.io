function Hex(q, r) {
	this.q = q;
	this.r = r;
	this.s = -q - r;
	this.selected = false;

	this.addHex = function(inHex) {
		return {q: this.q + inHex.q, r: this.r + inHex.r, s: this.s + inHex.s};
	};

	this.subtractHex = function(q, r, s) {
		return {q: this.q - q, r: this.r - r, s: this.s - s}
	};

	this.hexLength = function(q, r, s) {
		return Math.trunc((Math.abs(q) + Math.abs(r) + Math.abs(s)) / 2);
	};

	this.distanceTo = function(q, r, s) {
		var dist = this.subtractHex(q, r, s);
		return this.hexLength(dist.q, dist.r, dist.s);
	};

	this.orientation = {
		f0: Math.sqrt(3.0),
		f1: Math.sqrt(3.0) / 2.0,
		f2: 0.0,
		f3: 3.0 / 2.0,
		b0: Math.sqrt(3.0) / 3.0,
		b1: -1.0 / 3.0,
		b2: 0.0,
		b3: 2.0 / 3.0,
		startAngle: 0.5
	};

	this.layout = {
		size: {q: 40, r: 40},
		origin: {q: 25, r: 100}
	};

	this.hexToPixel = function() {
		var retX = (this.orientation.f0 * this.q + this.orientation.f1 * this.r) * this.layout.size.q;
		var retY = (this.orientation.f2 * this.q + this.orientation.f3 * this.r) * this.layout.size.r;
		retX += this.layout.origin.q;
		retY += this.layout.origin.r;
		return {q: retX, r: retY};
	};

	this.pixelToHex = function(x, y) {
		var pX = (x - this.layout.origin.q) / this.layout.size.q;
		var pY = (y - this.layout.origin.r) / this.layout.size.r;
		var hQ = this.orientation.b0 * pX + this.orientation.b1 * pY;
		var hR = this.orientation.b2 * pX + this.orientation.b3 * pY;
		return this.roundToHex(hQ, hR);
	};

	this.roundToHex = function(q, r) {
		var s = -q - r;
		var rS = Math.round(s);
		var rQ = Math.round(q);
		var rR = Math.round(r);
		var qDif = Math.abs(rQ - q);
		var rDif = Math.abs(rR - r);
		var sDif = Math.abs(rS - s);
		if(qDif > rDif && qDif > sDif) {
			rQ = -rR - rS;
		} else if (rDif > sDif) {
			rR = -rQ - rS;
		} else {
			rS = -rQ - rR;
		}

		return {q: rQ, r: rR, s: rS};
	}

	this.hexCornerOffset = function(corner) {
		var angle = 2.0 * Math.PI * (this.orientation.startAngle + corner) / 6;
		return {q: this.layout.size.q * Math.cos(angle), r: this.layout.size.r * Math.sin(angle)};
	};

	this.polygonCorners = function() {
		var coords = [];
		var center = this.hexToPixel(this.q, this.r, this.s);
		for(var i = 0; i < 6; i++) {
			var offset = this.hexCornerOffset(i);
			var coordPair = {q: center.q + offset.q, r: center.r + offset.r};
			coords.push(coordPair);
		}

		return coords;
	};

	this.getNeighbor = function(direction) {
		var hexDirections = [
			{q: 1, r: 0, s: -1},
			{q: 1, r: -1, s: 0},
			{q: 0, r: -1, s: 1},
			{q: -1, r: 0, s: 1},
			{q: -1, r: 1, s: 0},
			{q: 0, r: 1, s: -1}
		];

		if(direction < 0 || direction > 5) { return null; }

		var hexCoords = this.addHex(hexDirections[direction]);
		// get the real hex
		var hexIndex = getIndexForHexagon(hexCoords.q, hexCoords.r);
		if(hexIndex < 0 || hexIndex > (hexes.length - 1)) { return null; }
		var hex = hexes[hexIndex];

		var half = Math.floor(numHexes / 2);
		if(hex.distanceTo(half, half, (-numHexes)) > half) { return null; }
		
		return this.addHex(hexDirections[direction]);
	};
}

function getIndexForHexagon(q, r) {
	for(var i = 0; i < hexes.length; i++) {
		if((hexes[i].q == q) && (hexes[i].r == r)) {
			return i;
		}
	}

	return -1;
}

function getDirectionIndex(q1, r1, q2, r2) {
	// get the direction between two hexes
	console.log("Getting directions between (" + q1 + "," + r1 + ") and (" + q2 + "," + r2 + ")");
	var q = q2-q1;
	var r = r2-r1;

	if(q > 0) { q = 1; }
	else if(q < 0) { q = -1; }
	else { q = 0; }

	if(r > 0) { r = 1; }
	else if(r < 0) { r = -1; }
	else { r = 0; }

	if(q == 1 && r == 0) { console.log("direction: 0"); return 0; }
	if(q == 1 && r == -1) { console.log("direction: 1"); return 1; }
	if(q == 0 && r == -1) { console.log("direction: 2"); return 2; }
	if(q == -1 && r == 0) { console.log("direction: 3"); return 3; }
	if(q == -1 && r == 1) { console.log("direction: 4"); return 4; }
	if(q == 0 && r == 1) { console.log("direction: 5"); return 5; }

	if(q == 1 && r == 1) {
		// it could be 1, 0 or 0, 1. let's pick randomly!
		var rand = Math.floor(Math.random() * 2);
		if(rand == 0) { return 0; }
		else { return 6; }
	}

	if(q == -1 && r == -1) {
		// could be -1, 0 or 0, -1. let's pick randomly!
		var rand = Math.floor(Math.random() * 2);
		if(rand == 0) { return 3; }
		else { return 2; }
	}

	console.log("direction: -1");
	return -1;
}