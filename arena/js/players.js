function Player() {
	this.team = "";
	this.characters = [];
	this.deck = [];
	this.hand = [];
	this.discardPile = [];

	this.addClassCardsToDeck = function(c) {
		var deckToAdd = {};
		if(c == "Earth") {
			deckToAdd = earthDeck;
		} else if(c == "Air") {
			deckToAdd = airDeck;
		} else if(c == "Water") {
			deckToAdd = waterDeck;
		} else if(c == "Fire") {
			deckToAdd = fireDeck;
		} else if(c == "neutral") {
			deckToAdd = neutralDeck;
		}

		for(var key of Object.keys(deckToAdd)) {
			for(var i = 0; i < deckToAdd[key]; i++) {
				this.deck.push(key);
			}
		}
	}

	this.drawCard = function() {
		if(this.deck.length == 0) {
			// shuffle discard pile into deck
			for(var c = 0; c < this.discardPile.length; c++) {
				this.deck.push(this.discardPile[c]);
			}

			this.discardPile = [];
			shuffleCards(this.deck);
		}

		var card = this.deck.shift();
		this.hand.push(card);
	}

	this.discardCard = function(cardIndex) {
		if(cardIndex >= this.hand.length) {
			console.log("tried to discard an invalid index " + cardIndex);
			return;
		}

		this.discardPile.push(this.hand.splice(cardIndex, 1)[0]);
	}
}