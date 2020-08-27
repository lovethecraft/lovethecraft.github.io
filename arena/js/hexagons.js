function Hex(q, r) {
	this.q = q;
	this.r = r;
	this.s = -q - r;
	this.selected = false;
	this.clicked = false;

	this.addHex = function(q, r, s) {
		return {q: this.q + q, r: this.r + r, s: this.s + s};
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
		size: {q: 30, r: 30},
		origin: {q: 100, r: 100}
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

	this.clickHandler = function() {
		this.clicked = true;
	}
}

function drawBoard(canvasContext) {
	canvasContext.fillStyle = "#000000";
	canvasContext.strokeStyle = "#CCCCCC";
	canvasContext.lineWidth = 1;

	var bounds = Math.floor(numHexes / 2);

	for(var i = 0; i < hexes.length; i++) {
		var hex = hexes[i];
		var dist = hex.distanceTo(bounds, bounds, (-1 * (bounds + bounds)));
		if(dist <= bounds) {
			drawHexagon(canvasContext, hex, false);
		}
	}
}

function drawHexagon(canvasContext, hex, fill) {
	var fill = fill || false;

	canvasContext.beginPath();

	var coords = hex.polygonCorners();
	for(var c = 0; c < coords.length; c++) {
		if(c == 0) {
			canvasContext.moveTo(coords[c].q, coords[c].r);
		} else {
			canvasContext.lineTo(coords[c].q, coords[c].r);
		}
	}

	canvasContext.closePath();

	if(fill || (hex.selected == true)) {
		canvasContext.fillStyle = "#000000";
		canvasContext.fill();
	} else if(hex.clicked == true) {
		canvasContext.fillStyle = "#FFFF00";
		canvasContext.fill();
	}
	else {
		// is there a character here?
		var foundCharacter = false;
		for(var x = 0; x < characters.length; x++) {
			if(characters[x].position.q == hex.q && characters[x].position.r == hex.r) {
				if(characters[x].class == "Water") {
					canvasContext.fillStyle = "#0000FF";
				} else if(characters[x].class == "Earth") {
					canvasContext.fillStyle = "#964b00";
				} else if(characters[x].class == "Air") {
					canvasContext.fillStyle = "#c0c0c0";
				} else if(characters[x].class == "Fire") {
					canvasContext.fillStyle = "#FF0000";
				}
				canvasContext.fill();
				return;
			}
		}

		canvasContext.stroke();
	}
}

function getIndexForHexagon(q, r) {
	return (q * numHexes) + r;
}

//--- GLOBALS
var canvas = document.getElementById('hexmap');
var numHexes = 7; // largest row/col across the middle
var hexes = [];
var oldHexQ = -1;
var oldHexR = -1;
var characters = [];
var currentlyClickedHex = null;

function start() {
	// fill hexes
	for(var i = 0; i < numHexes; ++i) {
		for(var j = 0; j < numHexes; ++j) {
			var h = new Hex(i, j);
			hexes.push(h);
		}
	}

	// just using two characters for testing for now
	var c1 = new Character();
	c1.class = "Water";
	c1.position = {q: 4, r: 4};
	characters.push(c1);

	var c2 = new Character();
	c2.class = "Earth";
	c2.position = {q:2, r: 2};
	characters.push(c2);

	if(canvas.getContext) {
		var ctx = canvas.getContext('2d');
		drawBoard(ctx);

		canvas.addEventListener("mousemove", function(eventInfo) {
			var rect = canvas.getBoundingClientRect();

			var x = eventInfo.clientX - rect.left;
			var y = eventInfo.clientY - rect.top;
			//console.log("Mouse at (" + x + ", " + y + ")");
			var hex = hexes[0].pixelToHex(x, y);

			var whichIndex = getIndexForHexagon(hex.q, hex.r);
			if(whichIndex < 0 || whichIndex >= hexes.length) {
				return;
			}

			var bounds = Math.floor(numHexes / 2);
			var dist = hexes[whichIndex].distanceTo(bounds, bounds, (-1 * (bounds + bounds)));
			if(dist <= bounds) {
				if(oldHexQ == hexes[whichIndex].q && oldHexR == hexes[whichIndex].r) {
					return;
				}

				if(oldHexQ != -1 && oldHexR != -1) {
					ctx.fillStyle = "#FFFFFF";
					var oldIndex = getIndexForHexagon(oldHexQ, oldHexR);
					//drawHexagon(ctx, hexes[oldIndex], true);
					//ctx.fillStyle = "#000000";
					hexes[oldIndex].selected = false;
				}

				//drawHexagon(ctx, hexes[whichIndex], true);
				hexes[whichIndex].selected = true;
				oldHexQ = hexes[whichIndex].q;
				oldHexR = hexes[whichIndex].r;

				console.log("Selected (" + hexes[whichIndex].q + ", " + hexes[whichIndex].r + ")");
				update(ctx);
			}
		});

		canvas.addEventListener("mouseup", function(eventInfo) {
			var rect = canvas.getBoundingClientRect();

			var x = eventInfo.clientX - rect.left;
			var y = eventInfo.clientY - rect.top;
			var hex = hexes[0].pixelToHex(x, y);

			var whichIndex = getIndexForHexagon(hex.q, hex.r);
			if(whichIndex < 0 || whichIndex >= hexes.length) {
				return;
			}

			if(currentlyClickedHex != null) {
				currentlyClickedHex.clicked = false;
			}

			var bounds = Math.floor(numHexes / 2);
			var dist = hexes[whichIndex].distanceTo(bounds, bounds, (-1 * (bounds + bounds)));
			if(dist <= bounds) {
				hexes[whichIndex].clickHandler();
				currentlyClickedHex = hexes[whichIndex];
			}

			update(ctx);
		});
	}
}

function update(ctx) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawBoard(ctx);
}