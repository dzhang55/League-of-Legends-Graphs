// to query the seed data
var URL_START = "https://s3-us-west-1.amazonaws.com/riot-api/seed_data"
var QUERY = "matches1.json"

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
var svg = d3.select("body").append("svg")
	.attr("width", diameter)
	.attr("height", diameter);

var championName = [];

function loadSummonerData() {
	var dataset = [];

	d3.json("matches2.json", function(error, json) {
		// array of all the objects for match data
		matches = json.matches;
		for (var i = 0; i < matches.length; i++) {
			//console.log(matches[i].participants);
			var participants = matches[i].participantIdentities;
			for (var j = 0; j < participants.length; j++) {
				var summoner = participants[j].player.summonerName;
				console.log(summoner);
				if (summoner in dataset) {
					dataset[summoner].value++;

				} else {
					dataset[summoner] = { name : summoner, value : 1, win : 0, total : 0};
				}
				//if (matches[i].participants[j].stats.winner) {
				//	dataset[summoner].win++;
				//}
				//dataset[summoner].total++;
			}
		}
		dataset = dataset.filter(function (d) {
			return d != undefined;
		})

		visualizeData({"children" : dataset});
	});
}

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

function loadChampionInfo() {
	d3.json("champion.json", function(error, json) {

		for (var champion in json.data) {
		//	console.log(json.data[champion].key);
		//	console.log(champion);
			championName[parseInt(json.data[champion].key)] = champion;
		}
	});
}

function visualizeData(dataTree) {
			//console.log(dataTree.children);
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
console.time("test");  // log start timestamp
loadChampionInfo();
loadData();
console.timeEnd("test");