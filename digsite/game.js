var game = "fun";

var current_dig_progress = 0;
var current_bone = 0;
var dig_rate = 5;
var dig_progress = 0;
var dig_timer = null;
var total_bones_dug = 0;
var bones_required_for_skeleton_chart = 3;

var identify_update_in_millis = 100;
var identify_progress = 0;
var identify_cap = 5; // TODO: overwrite this later, probably should be per-bone
var current_identify_bone = 0;
var identify_timer = null;

//--------------------------------------------
// news events
var news_events = [
	{
		text: "<br />You've found quite a few bones. You might want to start identifying them!",
		valid: function() { return total_bones_dug >= bones_required_for_skeleton_chart; },
		triggered: false,
		trigger_function: function() {
			dom_identify_container.style.display = "block";
		}
	},
	{
		text: "<br />You've assembled your very first skeleton! Keep it up!",
		valid: function() {
			for(let index in skeletons) {
				var skeleton = skeletons[index];
				if(skeleton.completed) { return true; }
			}
			return false;
		},
		triggered: false,
		trigger_function: function() {
			dom_skeleton_chart.style.display = "block";
		}
	}
];

//--------------------------------------------
// DOM stuff
var dom_bone_chart = Object;
var dom_total_digs = Object;
var dom_digs_required = Object;
var dom_skeleton_chart = Object;
var dom_identify_progress = Object;
var dom_dig_progress = Object;
var dom_news_container = Object;
var dom_identify_container = Object;

function cache_doms() {
	dom_bone_chart = document.getElementById("bone_chart");
	dom_total_digs = document.getElementById("total_digs");
	dom_digs_required = document.getElementById("digs_required");
	dom_skeleton_chart = document.getElementById("skeleton_chart");
	dom_identify_progress = document.getElementById("identify_progress_bar");
	dom_dig_progress = document.getElementById("dig_progress_bar");
	dom_news_container = document.getElementById("news_container");
	dom_identify_container = document.getElementById("identify_container");
}

//--------------------------------------------
// individual bones
var bones = [];
bones[0] = {
	name: "t-rex skull",
	digs_required: 5,
	digs_completed: 0,
	identified: false,
	required_for_skeleton: 1
};

bones[1] = {
	name: "t-rex claws",
	digs_required: 2,
	digs_completed: 0,
	identified: false,
	required_for_skeleton: 5
};

bones[2] = {
	name: "eye of guldan",
	digs_required: 10,
	digs_completed: 0,
	identified: false,
	required_for_skeleton: 2
};

//--------------------------------------------
// whole skeletons
var skeletons = [];
skeletons[0] = {
	name: "t-rex",
	required_bones: [0, 1],
	completed: false
};

skeletons[1] = {
	name: "skull of guldan",
	required_bones: [2],
	completed: false
};

function choose_bone() {
	current_bone = Math.floor(Math.random() * bones.length);
}

function dig_bone(index) {
	bones[index].digs_completed++;
	total_bones_dug++;
	update_all();
}

function identify() {
	// start identification timer
	if(!identify_timer) {
		identify_timer = setInterval(update_identify_progress, identify_update_in_millis);
	}
}

function dig() {
	if(!dig_timer) {
		choose_bone();
		dig_timer = setInterval(update_dig_progress, identify_update_in_millis);
	}
}

function update_dig_progress() {
	dig_progress += (1 / (1000 / identify_update_in_millis) * dig_rate);
	var dig_progress_ratio = dig_progress / bones[current_bone].digs_required;
	dom_dig_progress.value = (100 * dig_progress_ratio);

	if(dig_progress >= bones[current_bone].digs_required) {
		dig_progress = 0;
		dom_dig_progress.value = 0;
		clearInterval(dig_timer);
		dig_timer = null;

		dig_bone(current_bone);
	}
}

function update_identify_progress() {
	identify_progress += (1 / (1000 / identify_update_in_millis));
	var identify_progress_ratio = identify_progress / identify_cap;
	dom_identify_progress.value = (100 * identify_progress_ratio);
	if(identify_progress >= identify_cap)
	{
		identify_progress = 0;
		dom_identify_progress.value = 0;
		clearInterval(identify_timer);
		identify_timer = null;

		identify_bone();
	}
}

function identify_bone() {
	var viable_bones = [];
	for(let index in bones) {
		var bone = bones[index];
		if(bone.digs_completed > 0 && !bone.identified) {
			viable_bones.push(index);
		}
	}

	if(viable_bones.length > 0) {
		var which = Math.floor(Math.random() * viable_bones.length);
		bones[viable_bones[which]].identified = true;
		update_all();
	}
}

function update_bone_chart() {
	var table_string = "";
	for(let index in bones) {
		var bone = bones[index];
		if(bone.digs_completed > 0)
		{
			if(bone.identified)
			{
				table_string += bone.name;
			}
			else
			{
				table_string += "unidentified bone";
			}
			
			table_string += ": " + bone.digs_completed + "<br />";
		}
	}

	dom_bone_chart.innerHTML = table_string;
}

function update_skeleton_chart() {
	if(total_bones_dug < bones_required_for_skeleton_chart) { return; }

	var skeleton_string = "skeletons assembled:<br />";
	for(let index in skeletons)
	{
		var skeleton = skeletons[index];
		skeleton_string += skeleton.name + ": ";
		if(skeleton.completed)
		{
			skeleton_string += "COMPLETED <br />";
			break;
		}

		var found_missing_bone = false;
		for(let bone_index in skeleton.required_bones)
		{
			var bone = bones[skeleton.required_bones[bone_index]];
			if(!bone.identified || (bone.required_for_skeleton > bone.digs_completed))
			{
				found_missing_bone = true;
				break;
			}
		}

		if(!found_missing_bone)
		{
			skeleton_string += "COMPLETED <br />";
			// this is the first time
			skeleton.completed = true;
		}
		else
		{
			skeleton_string += "NOT COMPLETED <br />";
		}
	}

	dom_skeleton_chart.innerHTML = skeleton_string;
}

function update_news() {
	for(let index in news_events)
	{
		var event = news_events[index];
		if(!event.triggered && event.valid()) {
			news_events[index].triggered = true;
			dom_news_container.innerHTML += news_events[index].text;
			news_events[index].trigger_function();
		}
	}
}

function update_all() {
	update_bone_chart();
	update_skeleton_chart();
	update_news();
}

window.onload = (function() {
	cache_doms();
	choose_bone();
});