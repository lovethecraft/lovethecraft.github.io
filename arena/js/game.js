var canvas = document.getElementById('hexmap');
var statusDiv = document.getElementById('status');
var handDiv = document.getElementById('hand');
var gameContainer = document.getElementById('gameContainer');
var gameMenuContainer = document.getElementById('gameMenuContainer');
var cardStackContainer = document.getElementById('cardStackContainer');
var finishSetupButton = document.getElementById('finishSetupButton');
var currentlyActiveCardIndex = -1;
var currentlyActiveCharacter = -1;
var currentCardTargetType = "";
var currentCardData = null; // some cards require gathering up more data before triggering

// game settings vars
var checkbox_chooseCharacterFire = document.getElementById('chooseCharacterFire');
var checkbox_chooseCharacterAir = document.getElementById('chooseCharacterAir');
var checkbox_chooseCharacterWater = document.getElementById('chooseCharacterWater');
var checkbox_chooseCharacterEarth = document.getElementById('chooseCharacterEarth');

var radio_chooseTeamNorth = document.getElementById('chooseTeamNorth');
var radio_chooseTeamSouth = document.getElementById('chooseTeamSouth');

/* TEMPORARY PLAYER-SPECIFIC VARIABLES */
var ourPlayer = new Player();
var enemyPlayer = new Player();

var canvasContext = null;
var numHexes = 7; // largest row/col across the middle
var halfHexes = Math.floor(numHexes / 2);
var hexes = [];
var oldHexQ = -1;
var oldHexR = -1;
var characters = [];
var targetingMode = false;
var assignmentMode = false;
var currentHand = [];
var currentDeck = [];
var gameMenuVisible = true;
var shouldUpdate = true;

// game state variables
var cardStack = [];
var northAttacksMiss = false;
var southAttacksMiss = false;

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

		for(var x = 0; x < enemyPlayer.characters.length; x++) {
			if(enemyPlayer.characters[x].position.q == hex.q && enemyPlayer.characters[x].position.r == hex.r) {
				if(enemyPlayer.characters[x].class == "Water") {
					canvasContext.fillStyle = "#0000FF";
				} else if(enemyPlayer.characters[x].class == "Earth") {
					canvasContext.fillStyle = "#964b00";
				} else if(enemyPlayer.characters[x].class == "Air") {
					canvasContext.fillStyle = "#c0c0c0";
				} else if(enemyPlayer.characters[x].class == "Fire") {
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
		// enemies
		enemyPlayer.characters[0].position = {q: 4, r: 4};
		enemyPlayer.characters[1].position = {q: 2, r: 5};
	} else {
		ourPlayer.characters[0].position = {q: 4, r: 4};
		ourPlayer.characters[1].position = {q: 2, r: 5};
		// enemies
		enemyPlayer.characters[0].position = {q: 2, r: 2};
		enemyPlayer.characters[1].position = {q: 4, r: 1};
	}

	// populate cards according to character classes
	ourPlayer.addClassCardsToDeck("neutral");
	for(var c = 0; c < ourPlayer.characters.length; c++) {
		ourPlayer.addClassCardsToDeck(ourPlayer.characters[c].class);
		ourPlayer.characters[c].id = (c+1);
	}

	for(var c = 0; c < enemyPlayer.characters.length; c++) {
		enemyPlayer.characters[c].id = (c + 1 + ourPlayer.characters.length);
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
			clickHandler(x, y);
		});
	}

	setInterval(update, 1000);
}

function clickHandler(x, y) {
	var hex = hexes[0].pixelToHex(x, y);

	var whichIndex = getIndexForHexagon(hex.q, hex.r);
	if(whichIndex < 0 || whichIndex >= hexes.length) {
		return;
	}

	var dist = hexes[whichIndex].distanceTo(halfHexes, halfHexes, -2 * halfHexes);
	if(dist <= halfHexes) {
		// did we click on a character?
		var character = null;
		for(var i = 0; i < ourPlayer.characters.length; i++) {
			var loopCharacter = ourPlayer.characters[i];
			if((loopCharacter.position.q == hex.q) && loopCharacter.position.r == hex.r) {
				character = loopCharacter;
				break;
			}
		}
		for(var i = 0; i < enemyPlayer.characters.length; i++) {
			var loopCharacter = enemyPlayer.characters[i];
			if((loopCharacter.position.q == hex.q) && loopCharacter.position.r == hex.r) {
				character = loopCharacter;
				break;
			}
		}

		if(character != null) {
			console.log("clicked on " + character.class);
			// are we assigning a card to this character
			if(assignmentMode == true) {
				if(character.team == ourPlayer.team) {
					var cardDefinition = cardDefinitions[ourPlayer.hand[currentlyActiveCardIndex]];
					if(cardDefinition.class == "All" || character.class == cardDefinition.class) {
						// sanity check: do we already have a card assigned to this character?
						for(var c = 0; c < cardStack.length; c++) {
							if(cardStack[c].owner == character.id) {
								console.log("Character already has a card assigned.");
								assignmentMode = false;
								currentlyActiveCardIndex = -1;
								// we do. for now, let's just early out. TODO: remove this entry
								return;
							}
						}
						// assign the card to this person
						character.assignedCard = currentlyActiveCardIndex;
						currentlyActiveCharacter = character.id;
						assignmentMode = false;
						currentCardData = {};
						
						cardDefinition.clicked();
					}
				}
			} else {
				//are we in card mode?
				if((targetingMode == true) && (currentlyActiveCardIndex != -1)) {
					//yes. is this character a valid card target?
					var cardId = ourPlayer.hand[currentlyActiveCardIndex];
					if(currentCardTargetType == "Character") {
						// it can be any character. valid
						cardBehavior(cardId, character);
					} else if(currentCardTargetType == "Opponent") {
						// it has to be an enemy
						if(character.team != ourPlayer.team) {
							// this is an enemy. valid
							cardBehavior(cardId, character);
						}
					} else if(currentCardTargetType == "Ally") {
						// it has to be an ally
						if(character.team == ourPlayer.team) {
							// this is an ally. valid
							cardBehavior(cardId, character);
						}
					}
				}
			}
		} else {
			// we clicked on an empty space.
			if((targetingMode == true) && (currentlyActiveCardIndex != -1)) {
				// make sure we can target space
				var cardId = ourPlayer.hand[currentlyActiveCardIndex];
				var targets = cardDefinitions[cardId].targets;
				if(currentCardTargetType == "Space") {
					// we can. validate that space
					if(validateSpace(cardId, hex)) {
						cardBehavior(cardId, hex);
					} else {
						// targeted an invalid space.
						assignmentMode = false;
						taretingMode = false;
					}
				} else {
					// just drop us out of all modes
					assignmentMode = false;
					targetingMode = false;
				}
			}
		}
	}

	update();
}

function validateSpace(cardId, hex) {
	return true;
}

function cardBehavior(cardId, target) {
	var card = cardDefinitions[cardId];
	var character = null;
	for(var c = 0; c < ourPlayer.characters.length; c++) {
		if(ourPlayer.characters[c].id == currentlyActiveCharacter) {
			character = ourPlayer.characters[c];
		}
	}

	var cardFunction = null;

	// ugh i hate card games. why do i always want to make card games
	switch(parseInt(cardId)) {
		case 0:
			// attack. target is a character
			cardData = {
				character: character,
				target: target
			};

			cardFunction = function(c) {
				// need to get direction between owner and target
				var directionIndex = getDirectionIndex(c.character.position.q, c.character.position.r, c.target.position.q, c.target.position.r);
				var hex = hexes[getIndexForHexagon(c.target.position.q, c.target.position.r)];
				var neighbor = hex.getNeighbor(directionIndex);
				moveCharacter(c.target, neighbor.q, neighbor.r);
			};
			break;
		case 1:
			// move to hex. target is a space
			cardData = {
				character: character,
				target: target
			};

			cardFunction = function(c) { moveCharacter(c.character, c.target.q, c.target.r); };
			break;
		case 2:
			// attack twice. target is a character
			cardData = {
				character: character,
				target: target
			};
			cardFunction = function(c) {
					// does this attack miss?
					if((c.character.team == "North" && northAttacksMiss == true) || (c.character.team == "South" && southAttacksMiss)) {
						return;
					}

					var directionIndex = getDirectionIndex(c.character.position.q, c.character.position.r, c.target.position.q, c.target.position.r);
					var hex = hexes[getIndexForHexagon(c.target.position.q, c.target.position.r)];
					var neighbor = null;
					if(hex != null) {
						neighbor = hex.getNeighbor(directionIndex);
						moveCharacter(c.target, neighbor.q, neighbor.r);
					}

					// do it again?
					hex = hexes[getIndexForHexagon(neighbor.q, neighbor.r)];
					if(hex != null) {
						neighbor = hex.getNeighbor(directionIndex);
						if(neighbor != null) {
							moveCharacter(c.target, neighbor.q, neighbor.r);
						}
					}
			};
			break;
		case 3:
			// enemy attacks miss this round. no target
			cardData = character;
			cardFunction = function(c) {
				if(c.team == "North") {
					southAttacksMiss = true;
				} else {
					northAttacksMiss = true;
				}
			};
			break;
		case 4:
			// put an obstacle on target hex for two rounds
			cardFunction = function() {

			};
			break;
		case 5:
			// target ally moves to hex. target is ally or hex
			// do we have a full card data yet?
			if(Object.keys(currentCardData).length == 0) {
				// not yet. store off the target ally and set our target mode to hex
				currentCardData = {
					targetCharacter: target
				};

				activateTargetingMode("Space");
				return;
			} else {
				// cardData is targetCharacter
				cardData = {
					targetCharacter: currentCardData.targetCharacter,
					target: target
				};

				cardFunction = function(c) {
					moveCharacter(c.targetCharacter, c.target.q, c.target.r);
				};
			}

			break;
		default:
			break;
	}

	cardStack.push({
		initiative: card.initiative,
		cardText: card.text,
		f: cardFunction,
		owner: character.id,
		data: cardData
	});

	targetingMode = false;
	ourPlayer.discardCard(currentlyActiveCardIndex);
	currentlyActiveCardIndex = -1;
}

function resolveCardStack() {
	// first, we need to sort the array by initiative
	function cmp(a, b) {
		if(a.initiative > b.initiative)
			return 1;
		if(b.initiative > a.initiative)
			return -1;
		// if they're tied, break the tie by the owning character's team
		// TODO: normal version of this
		if(a.owner.team == "North")
			return 1;
		else if(b.owner.team == "North")
			return -1;

		// ok tied i guess lol
		return 0;
	}

	cardStack.sort(cmp);

	// first, populate the card stack div
	updateCardStackDiv();

	// now, go through each one by one
	for(var c = 0; c < cardStack.length; c++) {
		setTimeout(runNextCard, (c + 1) * 1000);
		//cardStack[c].f(cardStack[c].data);
		//updateCardStackDiv();
	}
}

function isHexOccupied(q, r) {
	for(var c = 0; c < ourPlayer.characters.length; c++) {
		if(ourPlayer.characters[c].position.q == q && ourPlayer.characters[c].position.r == r) {
			return true;
		}
	}

	for(var c = 0; c < enemyPlayer.characters.length; c++) {
		if(enemyPlayer.characters[c].position.q == q && enemyPlayer.characters[c].position.r == r) {
			return true;
		}
	}

	return false;
}

function runNextCard() {
	console.log("Running next card. Remaining: " + cardStack.length);
	cardStack[0].f(cardStack[0].data);
	cardStack.shift();

	if(cardStack.length == 0) {
		for(var c = ourPlayer.hand.length; c < ourPlayer.maximumCardsInHand; c++) {
			ourPlayer.drawCard();
		}
	}

	updateCardStackDiv();
}

function updateCardStackDiv() {
	cardStackContainer.innerHTML = "";
	var cardStackString = "";
	for(var c = 0; c < cardStack.length; c++) {
		var owner = "";
		var team = "";
		for(var char = 0; char < ourPlayer.characters.length; char++) {
			if(ourPlayer.characters[char].id == cardStack[c].owner) {
				owner = ourPlayer.characters[char].class;
				team = ourPlayer.characters[char].team;
			}
		}

		for(var char = 0; char < enemyPlayer.characters.length; char++) {
			if(enemyPlayer.characters[char].id == cardStack[c].owner) {
				owner = enemyPlayer.characters[char].class;
				team = enemyPlayer.characters[char].team;
			}
		}

		cardStackString += team + " " + owner + ": " + cardStack[c].cardText + "<br />";
	}

	cardStackContainer.innerHTML = cardStackString;
	update();
}

function resetCardStack() {
	cardStack = [];
	northAttacksMiss = false;
	southAttacksMiss = false;
}

function update() {
	if(shouldUpdate != true) {
		return;
	}

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
	var htmlString = "Targeting Mode: " + targetingMode + "<br />";
	htmlString += "Assignment Mode: " + assignmentMode + "<br />";
	htmlString += "Cards left in deck: " + ourPlayer.deck.length + "<br />";
	htmlString += "Cards in discard: " + ourPlayer.discardPile.length + "<br />";
	htmlString += "North attacks miss: " + northAttacksMiss + "<br />";
	htmlString += "South attacks miss: " + southAttacksMiss + "<br />";
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

	if(isHexOccupied(neighbor.q, neighbor.r)) {
		console.log("Neighbor hex was occupied.");
		return;
	}

	character.position.q = neighbor.q;
	character.position.r = neighbor.r;
}

function moveCharacter(character, q, r) {
	console.log("Moving " + character.class + " to (" + q + ", " + r + ")");
	if(isHexOccupied(q, r)) {
		console.log("Hex is already occupied.");
		return;
	}

	character.position.q = q;
	character.position.r = r;
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

function activateTargetingMode(type) {
	targetingMode = true;
	currentCardTargetType = type;
	update();
}

function deactivateTargetingMode() {
	targetingMode = false;
	update();
}

function fillCardDiv() {
	var cardStrings = "";
	for(var c = 0; c < ourPlayer.hand.length; c++) {
		cardStrings += buildCardString(ourPlayer.hand[c], c);
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
			enemyPlayer.team = "North";
		} else {
			ourPlayer.team = "North";
			enemyPlayer.team = "South";
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

		// setting up some dummy enemies
		var e1 = new Character();
		var e2 = new Character();
		if(ourPlayer.team == "North") { 
			e1.team = "South";
			e2.team = "South";
		}
		else { 
			e1.team = "North";
			e2.team = "North";
		}

		e1.class = "Fire";
		e2.class = "Water";

		enemyPlayer.characters.push(e1);
		enemyPlayer.characters.push(e2);

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

function clickCard(index) {
	var cardId = ourPlayer.hand[index];
	//cardDefinitions[cardId].clicked();
	currentlyActiveCardIndex = index;
	assignmentMode = true;
}