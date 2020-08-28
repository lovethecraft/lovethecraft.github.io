var canvas = document.getElementById('hexmap');
var canvasContext = null;
var numHexes = 7; // largest row/col across the middle
var hexes = [];
var oldHexQ = -1;
var oldHexR = -1;
var characters = [];
var currentlyClickedHex = null;

function drawBoard() {
	canvasContext.fillStyle = "#000000";
	canvasContext.strokeStyle = "#CCCCCC";
	canvasContext.lineWidth = 1;

	var bounds = Math.floor(numHexes / 2);

	for(var i = 0; i < hexes.length; i++) {
		var hex = hexes[i];
		var dist = hex.distanceTo(bounds, bounds, (-1 * (bounds + bounds)));
		if(dist <= bounds) {
			drawHexagon(hex, false);
		}
	}
}

function drawHexagon(hex, fill) {
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
	} else if(hex.r == Math.floor(numHexes / 2)) {
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
	c1.team = "South";
	characters.push(c1);

	var c2 = new Character();
	c2.class = "Earth";
	c2.position = {q:2, r: 2};
	c2.team = "North";
	characters.push(c2);

	if(canvas.getContext) {
		canvasContext = canvas.getContext('2d');
		drawBoard(canvasContext);

		canvas.addEventListener("mousemove", function(eventInfo) {
			var rect = canvas.getBoundingClientRect();

			var x = eventInfo.clientX - rect.left;
			var y = eventInfo.clientY - rect.top;
			//console.log("Mouse at (" + x + ", " + y + ")");
			var hex = hexes[0].pixelToHex(x, y);
			console.log("Found hex: (" + hex.q + ", " + hex.r + ")");

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
					canvasContext.fillStyle = "#FFFFFF";
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
				update();
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

			update();
		});
	}
}

function update() {
	canvasContext.clearRect(0, 0, canvas.width, canvas.height);
	drawBoard();
}

function moveCharacter(character, direction) {
	var currentHexIndex = getIndexForHexagon(character.position.q, character.position.r);
	var currentHex = hexes[currentHexIndex];
	var neighbor = currentHex.getNeighbor(direction);
	if(neighbor == null) {
		console.log("Tried to move " + character.class + " to an invalid spot.");
		return;
	}

	if(neighbor.r == Math.floor(numHexes / 2)) {
		console.log("Tried to move " + character.class + " to the middle line.");
		return;
	}

	character.position.q = neighbor.q;
	character.position.r = neighbor.r;
}

// testing
function moveRandomCharacter(direction) {
	var index = Math.floor(Math.random() * characters.length);
	var character = characters[index];
	console.log(character);
	moveCharacter(character, direction);

	update();
}

function moveRandomCharacterRandomDirection() {
	var direction = Math.floor(Math.random() * 5);
	moveRandomCharacter(direction);
	update();
}