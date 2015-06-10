// to query the seed data
var URL_START = "https://s3-us-west-1.amazonaws.com/riot-api/seed_data";
var QUERY = "matches1.json";

// diameter for the entire svg
var diameter = 900;

// d3 function that provides a scale with a selection of 20 colors 
var color = d3.scale.category20c();

// uses d3 pack function which creates the bubble layout
var bubbleLayout = d3.layout.pack()
	.sort(null)
	.size([diameter, diameter])
	.padding(1);

// creates the svg
var svg = d3.select("div.svg-container").append("svg")
	.attr("width", diameter)
	.attr("height", diameter);

var championName = [];
var registeredUsers = [];

// TO USE: booleans that each match must go through
var filters = [];

function onlyRiven() {
	filters.push(function (match){
		return match.player.championId == 92;
	})
}

function validMatch(match) {
	for (var i = 0; i < filters.length; i++) {
		if (!filters[i](match)) {
			return false;
		}
	}
	return true;
}

// loads data from games.json file to calculate winrate against specific champions
// 100% Malphite means you win 100% of the time against Malphite
function loadSummonerData(json) {
	var dataset = [];

	// change from hardcoding later
	//d3.json("../json/dizzyyy30games.json", function(error, matches) {
	d3.json(json, function(error, matches) {
		// array of all the objects for match data
		for (var i = 0; i < matches.length; i++) {
			
			// INSERT BOOLEAN TO SKIP CERTAIN MATCHES THAT CAN BE ADJUSTED FOR ITEM, CHAMPION, MATCH LENGTH, ETC
			var team = matches[i].player.teamId;

			// fellowPlayers if using games.json, participants if using .json
			var participants = matches[i].participants;
			var win = matches[i].player.stats.winner;
			if (!validMatch(matches[i])) {
				continue;
			}
			for (var j = 0; j < participants.length; j++) {
				if (participants[j].teamId != team) {
					var champion = participants[j].championId;

					if (champion in dataset) {
						dataset[champion].value++;
					} else {
						dataset[champion] = {name : champion, value : 1, win : 0, total : 0};
					} 
					if (win) {
						dataset[champion].win++;
					}
					dataset[champion].total++;
					}
				}
				//	dataset[summoner].win++;
				//}
				//dataset[summoner].total++;
			}
		dataset = dataset.filter(function (d) {
			return d != undefined;
		})
		console.log(sumDataset(dataset));

		visualizeData({"children" : dataset});
	});
}

// no longer using this function
function loadData() {
	var dataset = [];

	d3.json("matches2.json", function(error, json) {
		// array of all the objects for match data
		matches = json.matches;
		for (var i = 0; i < matches.length; i++) {
			//console.log(matches[i].participants);
			var participants = matches[i].participants;
			for (var j = 0; j < participants.length; j++) {
				var champion = participants[j].championId;
				if (champion in dataset) {
					dataset[champion].value++;

				} else {
					dataset[champion] = { name : champion, value : 1, win : 0, total : 0};
				}
				if (participants[j].stats.winner) {
					dataset[champion].win++;
				}
				dataset[champion].total++;
			}
		}
		dataset = dataset.filter(function (d) {
			return d != undefined;
		})

		visualizeData({"children" : dataset});
	});
}

function loadChampionNames() {
	d3.json("../json/champion.json", function(error, champions) {

		for (var champion in champions.data) {
		//	console.log(json.data[champion].key);
		//	console.log(champion);
			championName[parseInt(json.data[champion].key)] = champion;
		}
	});
}

function visualizeData(dataTree) {
			//console.log(dataTree.children);
	// removes the current graph
	svg.selectAll(".node").remove();

	// selects all (currently non-existent nodes) in svg and uses nodes made from a tree of the dataset (with the root node filtered out)
	// enter() creates placeholders and then uses the dataset to fill these placeholders
	var node = svg.selectAll(".node")
		.data(bubbleLayout.nodes(dataTree)
			.filter(function (d) { 
				return !d.children;
				}))
		.enter()
		// group container
		.append("g")
		.attr("class", "node")
		.attr("transform", function(d) {
			return "translate(" + d.x + "," + d.y + ")";
		});

	node.append("circle")
		.attr("r", function (d) {
			return d.r;
		})
		.style("fill", function (d) {
			return color(d.name);
		});

	node.append("text")
		.style("text-anchor", "middle")
		// shift text down closer to center
		.attr("dy", ".3em")
		.text(function (d) {
			var winRate = 100 * d.win / d.total;
			return championName[d.name] + ' ' +  winRate.toFixed(2) + '%';
		});
}

// test to see if filtering by smite works
function loadSummonerDataSmite() {
	var dataset = [];

	// change from hardcoding later
	d3.json("../json/wingsofdeathxgames.json", function(error, matches) {
		// array of all the objects for match data
		for (var i = 0; i < matches.length; i++) {
			if (matches[i].spell1 != 11) continue;
			console.log(championName[matches[i].championId]);
			var team = matches[i].teamId;
			var players = matches[i].fellowPlayers;
			var win = matches[i].stats.win;
			for (var j = 0; j < players.length; j++) {
				if (players[j].teamId != team) {
					var champion = players[j].championId;
					if (champion in dataset) {
						dataset[champion].value++;
					} else {
						dataset[champion] = {name : champion, value : 1, win : 0, total : 0};
					} 
					if (win) {
						dataset[champion].win++;
					}
					dataset[champion].total++;
					}
				}
				//	dataset[summoner].win++;
				//}
				//dataset[summoner].total++;
			}
		dataset = dataset.filter(function (d) {
			return d != undefined;
		})

		visualizeData({"children" : dataset});
	});
}

function sumDataset(dataset) {
	var sum = 0;
	for (var i = 0; i < dataset.length; i++) {
		//console.log(dataset[i].value)
		sum += dataset[i].value;
	}
	return sum;
}

function loadUser(input) {
	loadSummonerData("../json/" + input.toLowerCase() + ".json")
	console.log("user loaded");
}

function clearData() {
	console.log("cleared");
	d3.svg.selectAll(".node").remove();
}

function loadRegisteredUsers() {
	d3.json("../json/summoners.json", function(error, users) {
		registeredUsers = users;
	})
}

console.time("test");  // log start timestamp
loadChampionNames();
registeredUsers = loadRegisteredUsers();
//onlyRiven();
//loadSummonerData();
$("form").submit(function() {
	console.log("SUBMITTED");
	var input = $("input").val();
	console.log(input);
	//clearData();
	loadUser(input);
	return false;
});
console.timeEnd("test");