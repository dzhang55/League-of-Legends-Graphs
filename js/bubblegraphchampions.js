// to query the seed data
var URL_START = "https://s3-us-west-1.amazonaws.com/riot-api/seed_data";
var QUERY = "matches1.json";

// diameter for the entire svg
var diameter = 1000;

// transition time in ms
var time = 1000;

// d3 function that provides a scale with a selection of 20 colors 
var color = d3.scale.category20c();

// uses d3 pack function which creates the bubble layout
var bubbleLayout = d3.layout.pack()
	.sort(d3.descending)
	.size([diameter, diameter])
	.padding(5);

// creates the svg
var svg = d3.select("div.svg-container").append("svg")
	.attr("width", diameter)
	.attr("height", diameter);

var championNames = [];
var registeredUsers = [];
var summoner = "";
var currChampionId = 0;

// TO USE: booleans that each match must go through
var filters = [];

// constructs an array of champion names with indices corresponding to champion ids
// loads asynchonously because dropdown menu is dependent on it
function loadChampionNames() {
	d3.json("../json/champion.json", function(error, champions) {

		var menu = document.getElementById("dropdownlist");
 		for (var champion in champions.data) {
 		//	console.log(json.data[champion].key);
 		//	console.log(champion);
			championNames[parseInt(champions.data[champion].key)] = champion;
			var node = document.createElement("li");
			var link = document.createElement("a");
			link.setAttribute("role", "menuitem");
			link.setAttribute("tabindex", "-1");
			link.href = "#";
			link.innerHTML = champion;
			node.appendChild(link);
			menu.appendChild(node);
 		}
	});
}

// temporary for testing, adds filter for only riven games
function onlyRiven() {
	filters.push(function (match){
		return match.player.championId == 92;
	})
}

// adds a filter function based on specific champion
// function filterByChampion(championName) {
// 	filters.push(function (match){
// 		championId = championNames.indexOf(championName);
// 		return match.player.championId == championId;
// 	})
// }

// true if in this match, the player plays the selected champion or if no champion is selected
function filterByChampion(match, championId) {
	if (championId == 0) {
		return true;
	} else {
		return match.player.championId == championId;
	}

}

function filterByDate() {

}

// passes a given match through all filter functions
function validMatch(match) {
	for (var i = 0; i < filters.length; i++) {
		if (!filters[i](match)) {
			console.log("not riven!!!");
			return false;
		}
	}
	return true;
}

// loads data from games.json file to calculate winrate against specific champions
// 100% Malphite means you win 100% of the time against Malphite
function loadSummonerData(json) {
	dataset = [];

	// change from hardcoding later
	//d3.json("../json/dizzyyy30games.json", function(error, matches) {
	d3.json(json, function(error, matches) {
		// array of all the objects for match data
		for (var i = 0; i < matches.length; i++) {
			
			var team = matches[i].player.teamId;

			// fellowPlayers if using games.json, participants if using .json
			var participants = matches[i].participants;
			var win = matches[i].player.stats.winner;

			//SKIP CERTAIN MATCHES THAT CAN BE ADJUSTED FOR ITEM, CHAMPION, MATCH LENGTH, ETC
			// if (!validMatch(matches[i])) {
			// 	console.log("filtered out match");
			// 	continue;
			// }

			if (!filterByChampion(matches[i], currChampionId)) {
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

		// if there is no data, create 404 teemo graph
		if (dataset.length == 0) {
			dataset.push({name : 17, value : 1, win : 404, total : 10000});
		}


		visualizeData({"children" : dataset});
	});
}

// takes a dataset and constructs a bubble graph
// displays winrates against champions with size relative to total games
function visualizeData(dataTree) {

	var allNodes = svg.selectAll(".node")
		.data(bubbleLayout.nodes(dataTree)
			// filters out the parent node
			.filter(function (d) { 
				return !d.children;
				}), 
			// key function to identify nodes
			function (d) {
				return d.name;
			});


	// exit() refers to the selection with elements but missing data 
	// i.e. removes nodes of champions with no bubbles
	removeExitingNodes(allNodes.exit());

	// selection of existing nodes with data
	updateExistingNodes(allNodes);

	// enter() refers to the selection with data but missing elements
	addEnteringNodes(allNodes.enter().append("g"));
}

function removeExitingNodes(nodes) {
	nodes.transition()
		.duration(time)
		.attr("transform", "translate(" + diameter + ",0)")
		.style("opacity", 0)
		.remove();
}
function updateExistingNodes(nodes) {
	nodes.transition()
	 	.duration(time)
	 	.attr("transform", function(d) {
	 		return "translate(" + d.x + "," + d.y + ")";
	 	});

	setCircle(nodes.select("circle")
		.transition()
		.duration(time));

	setImage(nodes.select("image")
		.transition()
		.duration(time));

    setText(nodes.select("text")
    	.transition()
		.duration(time));

    setHover(nodes.select(".hover"))
}

function addEnteringNodes(nodes) {

	nodes.attr("class", "node")
		.attr("transform", "translate(" + diameter + ",0)")
		.transition()
		.duration(1.5 * time)
		.attr("transform", function(d) {
	 		return "translate(" + d.x + "," + d.y + ")";
	 	});

	// append circles  	
	var circle = nodes.append("circle");
	setCircle(circle);
	circle.attr("stroke-width", "2px")
		.style("fill", function (d) {
			return color(d.name);
		})
		.attr("stroke", function(d) {
			return d3.rgb(color(d.name)).darker(3);
		});
	fadeIn(circle);

	// append images
	var image = nodes.append("svg:image");
	setImage(image);
	image.attr("xlink:href", function (d) {
        return "/images/champions/" + championNames[d.name] + ".png";
    });
	fadeIn(image);

	// append text
	var text = nodes.append("text");
	setText(text);
	text.style("text-anchor", "middle")
		.style("fill", "white");
	fadeIn(text);

	// append hover
	var hover = nodes.append("circle");
	setHover(hover);
	hover.style("fill", "black")
		.style("opacity", 0)
		.attr("data-toggle","popover")
		.attr("title", function (d) {
			return championNames[d.name];
		})
		.attr("data-content", function (d) {
			var winRate = 100 * d.win / d.total;
			return "Won " + winRate.toFixed(2) + "% of " + d.total + " games";
		})
		.on("mouseover", function (d) {
			d3.select(this)
				.style("opacity", 0.2);
		})
		.on("mouseout", function (d) {
			d3.select(this)
				.style("opacity", 0);
		});
	// settings for the popover display
	$(".hover").popover({trigger: "hover", container: "body", placement: "auto top"});
}

function setCircle(circle) {
	circle.attr("r", function (d) {
			return d.r;
	});
}

// sets the attrs updated for existing and entering nodes
function setImage(image) {
	// using attr instead of style allows d3 to transition properly
	image.attr("style", function (d) {
        	return "height : " + 0.95 * Math.sqrt(2) * d.r + "px; width : " + 0.95 * Math.sqrt(2) * d.r + "px"
    })
        // must be transitioned in udpate but not append because the circles may change in size
        .attr("x", function (d) {
			return - 0.95 * d.r / Math.sqrt(2) + "px";
		})
		.attr("y", function (d) {
			return - 0.95 * d.r / Math.sqrt(2) + "px";
		});
}

// sets the attrs updated for existing and entering nodes
function setText(text) {
	text.text(function (d) {
		// displays winrate with precision depending on the size of the bubble
		var winRate = 100 * d.win / d.total;
		if (d.r > 35) {
			return winRate.toFixed(2) + '%';
		} else if (d.r > 20) {
			return winRate.toFixed(0) + '%';
		} else {
			return "";
		}
	})
		.attr("y", function (d) {
	 		return 0.6 * d.r;
	 	});
}

// sets the attrs updated for existing and entering nodes
function setHover(hoverCircle) {
	hoverCircle.attr("class", "hover")
		.attr("r", function (d) {
			return d.r;
		})
		.attr("data-content", function (d) {
			var winRate = 100 * d.win / d.total;
			return "Won " + winRate.toFixed(2) + "% of " + d.total + " games";
		})
}

// takes in a selection and applies a fade in transition to it
function fadeIn (selection) {
	    return selection.style("opacity", 0)
			.transition()
			.delay(time / 2)
			.duration(time)
			.style("opacity", 1);
		}

function sumDataset(dataset) {
	var sum = 0;
	for (var i = 0; i < dataset.length; i++) {
		//console.log(dataset[i].value)
		sum += dataset[i].value;
	}
	return sum;
}

// uses the summoner name to load the corresponding json
function loadUser(input) {
	loadSummonerData("../json/" + input.toLowerCase() + ".json")
	console.log("user loaded");
}

// not in use, clears graph
function clearData() {
	console.log("cleared");
	d3.svg.selectAll(".node").remove();
}

// not in use yet, loads the list of registered users
function loadRegisteredUsers() {
	d3.json("../json/summoners.json", function(error, users) {
		registeredUsers = users;
	})
}

// change button name to selected champion
function adjustButton(championName) {
	var button = $("#dropdownmenu1");
	var children = button.children();
	button.html(championName + " ");
	button.append(children);

}

console.time("test");  // log start timestamp
loadChampionNames();

// on submission of search, load the graph for a given user
$("#summoner").submit(function() {
	console.log("SUBMITTED");
	var input = $("input").val();
	summoner = input;
	console.log(input);
	loadUser(input);

	// stops default events and propagation
	return false;
});

// on click of a menu item, filter the matches by champion and reload graph
$("#dropdownlist").on("click", "a", function() {
	var championName = $(this).html();
	console.log(championName);
	//console.log($("#dropdownmenu1"));
	adjustButton(championName);
	//filterByChampion(championName);
	if (championName == "All Champions") {
		currChampionId = 0;
	} else {
		currChampionId = championNames.indexOf(championName);
	}
	console.log(currChampionId);
	loadUser(summoner)
});
console.log("a function loaded");

$(".svg-container").popover({placement : "top", viewport : ".svg-container"});

//$('.dropdown-toggle').dropdown()

// var datepicker = $('.datepicker').datepicker();
// datepicker.on('show', function() {
// 	console.log("hi");
// 	});
// datepicker.on('changeDate', function(e) {
// 	datepicker.datepicker('hide');
// 	 console.log($('#date').input);
// 	//datepicker.datepicker('setValue', value)
// 	});
//registeredUsers = loadRegisteredUsers();
//onlyRiven();
//loadSummonerData();

console.timeEnd("test");