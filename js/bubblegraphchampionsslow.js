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

function idToName(championId) {
	
}

function addToExistingChampion(champion, dataset) {
	for (var k = 0; k < dataset.length; k++) {
		if (dataset[k].name == champion) {
			dataset[k].value++;
			return true;
		}
	}
	return false;
}

function loadData() {
	var dataset = [];

	d3.json("matches1.json", function(error, json) {
		// array of all the objects for match data
		matches = json.matches;
		for (var i = 0; i < matches.length; i++) {
			//console.log(matches[i].participants);
			var participants = matches[i].participants;
			for (var j = 0; j < participants.length; j++) {
				var champion = participants[j].championId;
				if (!addToExistingChampion(champion, dataset)) {
					dataset.push( {
						name : champion,
						value : 1
					});
				}
			}
		}
		visualizeData({"children" : dataset});
	});
}

function visualizeData(dataTree) {
			console.log(dataTree.children);
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
		.text(function (d) {
			return d.name;
		});
}

console.time("test");  // log start timestamp
loadData();
console.timeEnd("test");