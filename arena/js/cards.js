// Targets can be "Opponent", "Character", "Ally", "Space", "None"
var cardDefinitions = [
	{ // 0
		name: "Attack",
		class: "All",
		text: "Attack target opponent.",
		initiative: 50,
		targets: ["Opponent"],
		clicked: function() {
			activateTargetingMode();
		}
	},
	{ // 1
		name: "Move",
		class: "All",
		text: "Move to target adjacent hex.",
		initiative: 49,
		targets: ["Space"],
		clicked: function() {
			activateTargetingMode();
		}
	},
	{ // 2
		name: "Flame Punch",
		class: "Fire",
		text: "Attack target opponent twice.",
		initiative: 99,
		targets: ["Opponent"],
		clicked: function() {
			activateTargetingMode();
		}
	},
	{ // 3
		name: "Flow",
		class: "Air",
		text: "Enemy attacks miss this round.",
		initiative: 1,
		targets: ["None"],
		clicked: function() {
			//activateTargetingMode();
			// just directly call cardBehavior
			cardBehavior(3, null);
		}
	},
	{ // 4
		name: "Barrier",
		class: "Earth",
		text: "Target hex is impassable for two rounds.",
		initiative: 25,
		targets: ["Space"],
		clicked: function() {
			activateTargetingMode();
		}
	},
	{ // 5
		name: "Recover",
		class: "Water",
		text: "Target ally moves to target adjacent hex.",
		initiative: 75,
		targets: ["Ally"],
		clicked: function() {
			activateTargetingMode();
		}
	}
];

var neutralDeck = {
	0: 3,
	1: 4
};

var fireDeck = {
	2: 2
};

var earthDeck = {
	4: 2
};

var waterDeck = {
	5: 2
};

var airDeck = {
	3: 2
};

function buildCardString(cardId, cardIndex) {
	var string = "";
	string = '<div class="card" id="cardId' + cardIndex + '" onclick="clickCard(' + cardIndex + ')"><p>';
	string += cardDefinitions[cardId].text;
	string += '</p></div>';
	return string;
}

function shuffleCards(cardArray) {
	for(var c = cardArray.length - 1; c > 0; c--) {
		var r = Math.floor(Math.random() * c);
		var t = cardArray[c];
		cardArray[c] = cardArray[r];
		cardArray[r] = t;
	}
}