var characterClasses = ["Water, Earth, Fire, Air"];
var teams = ["South", "North"];

function Character() {
	this.class = "";
	this.health = 100;
	this.position = {q: 0, r: 0};
	this.team = "";
	this.assignedCard = -1;
}