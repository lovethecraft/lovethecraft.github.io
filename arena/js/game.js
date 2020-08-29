var canvas = document.getElementById('hexmap');
var statusDiv = document.getElementById('status');
var handDiv = document.getElementById('hand');
var gameContainer = document.getElementById('gameContainer');
var gameMenuContainer = document.getElementById('gameMenuContainer');
var finishSetupButton = document.getElementById('finishSetupButton');

// game settings vars
var checkbox_chooseCharacterFire = document.getElementById('chooseCharacterFire');
var checkbox_chooseCharacterAir = document.getElementById('chooseCharacterAir');
var checkbox_chooseCharacterWater = document.getElementById('chooseCharacterWater');
var checkbox_chooseCharacterEarth = document.getElementById('chooseCharacterEarth');

var radio_chooseTeamNorth = document.getElementById('chooseTeamNorth');
var radio_chooseTeamSouth = document.getElementById('chooseTeamSouth');

/* TEMPORARY PLAYER-SPECIFIC VARIABLES */
var ourPlayer = new Player();

var canvasContext = null;
var numHexes = 7; // largest row/col across the middle
var halfHexes = Math.floor(numHexes / 2);
var hexes = [];
var oldHexQ = -1;
var oldHexR = -1;
var characters = [];
var targetingMode = false;
var currentHand = [];
var currentDeck = [];
var gameMenuVisible = true;

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
		for(var x = 0; x < ourPlayer.characters.length; x++) {
			if(ourPlayer.characters[x].position.q == hex.q && ourPlayer.characters[x].position.r == hex.r) {
				if(ourPlayer.characters[x].class == "Water") {
					canvasContext.fillStyle = "#0000FF";
				} else if(ourPlayer.characters[x].class == "Earth") {
					canvasContext.fillStyle = "#964b00";
				} else if(ourPlayer.characters[x].class == "Air") {
					canvasContext.fillStyle = "#c0c0c0";
				} else if(ourPlayer.characters[x].class == "Fire") {
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

	// place characters -- using test values for now but soon we'll want to
	// place them manually
	if(ourPlayer.team == "North") {
		ourPlayer.characters[0].position = {q: 2, r: 2};
		ourPlayer.characters[1].position = {q: 4, r: 1};
	} else {
		ourPlayer.characters[0].position = {q: 4, r: 4};
		ourPlayer.characters[1].position = {q: 2, r: 5};
	}

	// populate cards according to character classes
	ourPlayer.addClassCardsToDeck("neutral");
	for(var c = 0; c < ourPlayer.characters.length; c++) {
		ourPlayer.addClassCardsToDeck(ourPlayer.characters[c].class);
	}

	shuffleCards(ourPlayer.deck);

	// test: fill hand with 3 random cards
	for(var c = 0; c < 3; c++) {
		ourPlayer.drawCard();
	}

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

	setInterval(update, 1000);
}

function update() {
	canvasContext.clearRect(0, 0, canvas.width, canvas.height);
	drawBoard();
	updateStatus();
	updateMenu();
	updateHand();
}

function updateHand() {
	fillCardDiv();
}

function updateStatus() {
	var htmlString = "Targeting Mode: " + targetingMode;
	htmlString += "<br />";
	htmlString += "Cards left in deck: " + ourPlayer.deck.length + "<br />";
	htmlString += "Cards in discard: " + ourPlayer.discardPile.length + "<br />";
	statusDiv.innerHTML = htmlString;
}

function updateMenu() {
	if(gameMenuVisible == true) {
		gameMenuContainer.style.display = 'block';
		gameContainer.style.display = 'none';
	} else {
		gameMenuContainer.style.display = 'none';
		gameContainer.style.display = 'block';
	}
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
	var index = Math.floor(Math.random() * ourPlayer.characters.length);
	var character = ourPlayer.characters[index];
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

function fillCardDiv() {
	var cardStrings = "";
	for(var c = 0; c < ourPlayer.hand.length; c++) {
		cardStrings += buildCardString(ourPlayer.hand[c]);
	}

	handDiv.innerHTML = cardStrings;
}

function toggleGameMenu() {
	if(gameMenuVisible == true) {
		gameMenuVisible = false;
	} else {
		gameMenuVisible = true;
	}

	updateMenu();
}

function finishSetup() {
	// make sure we have a team and two characters
	if(verifySetup() == true) {
		// do stuff with that data
		if(radio_chooseTeamSouth.checked == true) {
			ourPlayer.team = "South";
		} else {
			ourPlayer.team = "North";
		}

		if(checkbox_chooseCharacterEarth.checked == true) {
			var char = new Character();
			char.team = ourPlayer.team;
			char.class = "Earth";
			ourPlayer.characters.push(char);
		}

		if(checkbox_chooseCharacterFire.checked == true) {
			var char = new Character();
			char.team = ourPlayer.team;
			char.class = "Fire";
			ourPlayer.characters.push(char);
		}

		if(checkbox_chooseCharacterWater.checked == true) {
			var char = new Character();
			char.team = ourPlayer.team;
			char.class = "Water";
			ourPlayer.characters.push(char);
		}

		if(checkbox_chooseCharacterAir.checked == true) {
			var char = new Character();
			char.team = ourPlayer.team;
			char.class = "Air";
			ourPlayer.characters.push(char);
		}

		start();
		toggleGameMenu();
	}
}

function verifySetup() {
	var earthChecked = checkbox_chooseCharacterEarth.checked;
	var fireChecked = checkbox_chooseCharacterFire.checked;
	var airChecked = checkbox_chooseCharacterAir.checked;
	var waterChecked = checkbox_chooseCharacterWater.checked;

	var numChecked = 0;
	if(earthChecked) { numChecked++; }
	if(fireChecked) { numChecked++; }
	if(airChecked) { numChecked++; }
	if(waterChecked) { numChecked++; }

	if(numChecked == 2) {
		// good to go on characters. are we good on the team?
		if(radio_chooseTeamSouth.checked || radio_chooseTeamNorth.checked) {
			return true;
		} else {
			alert('Select a team.');
		}
	} else {
		alert('Select two characters.');
	}

	return false;
}

finishSetupButton.onclick = finishSetup;

function processCharacterCheckboxes() {
	var earthChecked = checkbox_chooseCharacterEarth.checked;
	var fireChecked = checkbox_chooseCharacterFire.checked;
	var airChecked = checkbox_chooseCharacterAir.checked;
	var waterChecked = checkbox_chooseCharacterWater.checked;

	var numChecked = 0;
	if(earthChecked) { numChecked++; }
	if(fireChecked) { numChecked++; }
	if(airChecked) { numChecked++; }
	if(waterChecked) { numChecked++; }

	if(numChecked == 2) {
		if(!earthChecked) {
			checkbox_chooseCharacterEarth.disabled = true;
		}

		if(!fireChecked) {
			checkbox_chooseCharacterFire.disabled = true;
		}

		if(!waterChecked) {
			checkbox_chooseCharacterWater.disabled = true;
		}

		if(!airChecked) {
			checkbox_chooseCharacterAir.disabled = true;
		}
	} else {
		if(numChecked > 3) {
			// something went wrong. clear and enable all of them
			checkbox_chooseCharacterFire.checked = false;
			checkbox_chooseCharacterEarth.checked = false;
			checkbox_chooseCharacterWater.checked = false;
			checkbox_chooseCharacterAir.checked = false;
			checkbox_chooseCharacterFire.disabled = false;
			checkbox_chooseCharacterEarth.disabled = false;
			checkbox_chooseCharacterWater.disabled = false;
			checkbox_chooseCharacterAir.disabled = false;
		} else {
			if(checkbox_chooseCharacterAir.disabled == true) {
				checkbox_chooseCharacterAir.disabled = false;
			}

			if(checkbox_chooseCharacterWater.disabled == true) {
				checkbox_chooseCharacterWater.disabled = false;
			}

			if(checkbox_chooseCharacterEarth.disabled == true) {
				checkbox_chooseCharacterEarth.disabled = false;
			}

			if(checkbox_chooseCharacterFire.disabled == true) {
				checkbox_chooseCharacterFire.disabled = false;
			}
		}
	}
}

checkbox_chooseCharacterEarth.addEventListener('change', processCharacterCheckboxes);
checkbox_chooseCharacterWater.addEventListener('change', processCharacterCheckboxes);
checkbox_chooseCharacterAir.addEventListener('change', processCharacterCheckboxes);
checkbox_chooseCharacterFire.addEventListener('change', processCharacterCheckboxes);

/*document.getElementById("myBtn").onclick = function() {
	toggleGameMenu();
}*/

var span = document.getElementsByClassName("close")[0];
span.onclick = function() {
	toggleGameMenu();
}

window.onclick = function(event) {
	if(event.target == gameMenuContainer) {
		toggleGameMenu();
	}
}