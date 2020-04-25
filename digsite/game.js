var game = "fun";

var current_dig_progress = 0;
var current_bone = 0;
var dig_rate = 1;
var digs_done = 0;

var identify_update_in_millis = 100;
var identify_progress = 0;
var identify_cap = 5; // TODO: overwrite this later, probably should be per-bone
var current_identify_bone = 0;
var identify_timer = null;

//--------------------------------------------
// DOM stuff
var dom_bone_chart = Object;
var dom_total_digs = Object;
var dom_digs_required = Object;
var dom_skeleton_chart = Object;
var dom_identify_progress = Object;

function cache_doms() {
	dom_bone_chart = document.getElementById("bone_chart");
	dom_total_digs = document.getElementById("total_digs");
	dom_digs_required = document.getElementById("digs_required");
	dom_skeleton_chart = document.getElementById("skeleton_chart");
	dom_identify_progress = document.getElementById("identify_progress_bar");
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
	required_bones: [0, 1]
};

skeletons[1] = {
	name: "skull of guldan",
	required_bones: [2]
};

function choose_bone() {
	current_bone = Math.floor(Math.random() * bones.length);

	dom_digs_required.innerText = bones[current_bone].digs_required;
}

function dig_bone(index) {
	bones[index].digs_completed++;
	update_bone_chart();
}

function identify() {
	// start identification timer
	if(!identify_timer) {
		identify_timer = setInterval(update_identify_progress, identify_update_in_millis);
	}
}

function update_identify_progress() {
	identify_progress += (1 / (1000 / identify_update_in_millis));
	console.log(identify_progress);
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
		update_bone_chart();
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

	update_skeleton_chart();
}

function update_skeleton_chart() {
	var skeleton_string = "";
	for(let index in skeletons)
	{
		var skeleton = skeletons[index];
		console.log(skeleton);
		var found_missing_bone = false;
		for(let bone_index in skeleton.required_bones)
		{
			var bone = bones[skeleton.required_bones[bone_index]];
			console.log(bone);
			if(!bone.identified || (bone.required_for_skeleton > bone.digs_completed))
			{
				found_missing_bone = true;
				break;
			}
		}

		skeleton_string += skeleton.name + ": ";
		if(!found_missing_bone)
		{
			skeleton_string += "COMPLETED <br />";
		}
		else
		{
			skeleton_string += "NOT COMPLETED <br />";
		}
	}

	dom_skeleton_chart.innerHTML = skeleton_string;
}

function dig() {
	current_dig_progress += dig_rate;
	if(current_dig_progress >= bones[current_bone].digs_required)
	{
		current_dig_progress = 0;
		dig_bone(current_bone);
		choose_bone();
	}

	dom_total_digs.innerHTML = current_dig_progress;
}

window.onload = (function() {
	cache_doms();
	choose_bone();
});