var canvas = document.getElementById('hexmap');
var statusDiv = document.getElementById('status');
var canvasContext = null;
var numHexes = 7; // largest row/col across the middle
var halfHexes = Math.floor(numHexes / 2);
var hexes = [];
var oldHexQ = -1;
var oldHexR = -1;
var characters = [];
var targetingMode = false;

function drawBoard() {
	canvasContext.fillStyle = "#000000";
	canvasContext.strokeStyle = "#CCCCCC";
	canvasContext.lineWidth = 1;

	for(var i = 0; i < hexes.length; i++) {
		var hex = hexes[i];
		var dist = hex.distanceTo(halfHexes, halfHexes, -2 * halfHexes);
		if(dist <= halfHexes) {
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
		canvasContext.lineWidth = 3;// = "#000000";
		canvasContext.strokeStyle = "#000000";
		canvasContext.stroke();
		canvasContext.lineWidth = 1;
		canvasContext.strokeStyle = "#CCCCCC";
	}

	if(hex.clicked == true) {
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
			if(h.distanceTo(halfHexes, halfHexes, -1 * halfHexes * 2) <= halfHexes) {
				hexes.push(h);
			}
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

	var c3 = new Character();
	c3.class = "Fire";
	c3.team = "North";
	c3.position = {q: 4, r: 1};
	characters.push(c3);

	var c4 = new Character();
	c4.class = "Air";
	c4.team = "South";
	c4.position = {q:2, r: 5};
	characters.push(c4);

	if(canvas.getContext) {
		canvasContext = canvas.getContext('2d');
		drawBoard(canvasContext);

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

			var dist = hexes[whichIndex].distanceTo(halfHexes, halfHexes, -2 * halfHexes);
			if(dist <= halfHexes) {
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

			var dist = hexes[whichIndex].distanceTo(halfHexes, halfHexes, -2 * halfHexes);
			if(dist <= halfHexes) {
				if(targetingMode == true) {
					// did we click on a valid target? for now we are just going to
					// detect who you clicked on and move them, for testing
					for(var i = 0; i < characters.length; i++) {
						var character = characters[i];
						if((character.position.q == hex.q) && character.position.r == hex.r) {
							moveCharacterRandomDirection(character);
							deactivateTargetingMode();
							break;
						}
					}
				}
				//hexes[whichIndex].clickHandler();
				//currentlyClickedHex = hexes[whichIndex];
			}

			update();
		});
	}
}

function update() {
	canvasContext.clearRect(0, 0, canvas.width, canvas.height);
	drawBoard();
	statusDiv.innerHTML = "Targeting Mode: " + targetingMode;
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
function moveCharacterRandomDirection(character) {
	var direction = Math.floor(Math.random() * 5);
	moveCharacter(character, direction);
}

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
}

function activateTargetingMode() {
	targetingMode = true;
	update();
}

function deactivateTargetingMode() {
	targetingMode = false;
	update();
}