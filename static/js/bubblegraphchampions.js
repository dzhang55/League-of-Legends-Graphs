// diameter for the entire svg
var diameter = 800;

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
var currChampionId = 0;
var currTeam = 0;
var currLane = "";
var currRole = ""
var currSkillOrder = "All Skill Orders";
var currSeason = "";
var matches = [];

// constructs an array of champion names with indices corresponding to champion ids
// loads asynchonously because dropdown menu is dependent on it
function loadChampionNames() {
	d3.json("static/json/champion.json", function(error, champions) {

		var menu = document.getElementById("championdropdownlist");
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

// true if in this match, the player plays the selected champion or if no champion is selected
function filterByChampion(match) {
	if (currChampionId == 0) {
		return true;
	} else {
		return match.player.championId == currChampionId;
	}

}

function filterByDate() {

}

function filterByItem() {

}

function filterByTeam(match) {
	if (currTeam == 0) {
		return true;
	} else {
		return match.player.teamId == currTeam;
	}
}

function filterBySeason(match) {
	if (currSeason == "") {
		return true;
	} else {
		return match.season == currSeason;
	}
}

function filterByRole(match) {
	if (currRole == "" && currLane == "") {
		return true;
	} else {
		return match.player.lane == currLane && match.player.role == currRole;
	}
}

// loads data from games.json file to calculate winrate against specific champions
// 100% Malphite means you win 100% of the time against Malphite
function loadSummonerData(matches) {
	dataset = [];
	console.log("LOADING SUMMONER DATA");

		// array of all the objects for match data
		for (var i = 0; i < matches.length; i++) {
			var team = matches[i].player.teamId;

			var participants = matches[i].participants;
			var win = matches[i].player.winner;

			// skip matches that don't match the settings
			if (!filterByChampion(matches[i])) {
				continue;
			}
			if (!filterByTeam(matches[i])) {
				continue;
			}
			if (!filterByRole(matches[i])) {
				continue;
			}
			if (!filterBySeason(matches[i])) {
				continue;
			}

			for (var j = 0; j < participants.length; j++) {
				if (participants[j].teamId == team) {
					continue;
				}
				var champion = participants[j].championId;

				if (champion in dataset) {
					dataset[champion].value++;
				} else {
					dataset[champion] = {name : champion, value : 1, win : 0};
				} 
				if (win) {
					dataset[champion].win++;
				}
			}
		}

		dataset = dataset.filter(function (d) {
			return d !== undefined;
		});

		console.log(sumDataset(dataset));

		// if there is no data, create 404 teemo graph
		if (dataset.length == 0) {
			dataset.push({name : 17, value : 100, win : 404});
			$("#graphtitle").html("No data for this selection");
		} else {
			$("#graphtitle").html("Played against");
		}

		visualizeData({"children" : dataset});
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

    setHover(nodes.select(".hover"));
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
        return "static/images/champions/" + championNames[d.name] + ".png";
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
			var winRate = 100 * d.win / d.value;
			return "Won " + winRate.toFixed(2) + "% of " + d.value + " games";
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

// sets the attrs updated for existing and entering nodes
function setCircle(circle) {
	circle.attr("r", function (d) {
			return d.r;
	});
}

// sets the attrs updated for existing and entering nodes
function setImage(image) {
	// using attr instead of style allows d3 to transition properly
	image.attr("height", function (d) {
			return 0.95 * Math.sqrt(2) * d.r;
		})
		.attr("width", function (d) { 
			return 0.95 * Math.sqrt(2) * d.r;
		})
        // must be transitioned in update but not append because the circles may change in size
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
		var winRate = 100 * d.win / d.value;
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
			var winRate = 100 * d.win / d.value;
			return "Won " + winRate.toFixed(2) + "% of " + d.value + " games";
		});
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

// change button name to selected champion
function adjustButton(buttonId, championName) {
	var button = $(buttonId);
	var children = button.children();
	button.html(championName + " ");
	button.append(children);

}

function addRegisterButton(summonerId) {
	// create register button centered in svg container
	var register= $('<input id="register" class="btn btn-default" align="center" type="button" value="Click to register summoner"/>');
	register.css("width", 195);
	register.css("position", "absolute");
	register.css("left", "0");
	register.css("right", "0");
	register.css("margin", "auto");
	$(".svg-container").prepend(register);

	register.on("click", function() {
		$.ajax({
			url: "/register",
			data: {id: summonerId},
			type: "POST",
			success: function(response) {
				$("#graphtitle").html("Registering summoner! Search again in a few minutes");
				register.remove();
			},
			error: function(error) {
				$("#graphtitle").html(error.responseText);
				register.remove();
			}
		});
		return false;
	});
}

loadChampionNames();

// on submission of search, load the graph for a given user
$("#summoner").submit(function() {
	// remove register button if it exists
	console.log($("#register").length);
	if ($("#register").length) {
		$("#register").remove();
	}
	console.log("SUBMITTED");
	$.ajax({
        url: "/search",
        data: {name: $("input").val()},
        type: "POST",
        dataType: "json",
        success: function(response) {
        	console.time("loaddata");
        	matches = response;
            loadSummonerData(matches);
            console.timeEnd("loaddata");
        },
        error: function(error) {
        	// displays Summoner not registered and passes id to register button
        	console.log("ERROR");
        	console.log(error);
        	message = error.responseText.substring(0, 23);
			$("#graphtitle").html(message);
			matches = [];
			removeExitingNodes(d3.selectAll(".node"));
			if (message == "Summoner not registered") {
				summonerId = error.responseText.substring(23);
				console.log(summonerId);
				addRegisterButton(summonerId);
			}

            
        }
    });
    return false;
});

// on click of a menu item, filter the matches by champion and reload graph
$("#championdropdownlist").on("click", "a", function() {
	var championSelection = $(this).html();
	console.log(championSelection);
	//console.log($("#dropdownmenu1"));
	adjustButton("#championdropdownmenu", championSelection);
	//filterByChampion(championName);
	if (championSelection == "All Champions") {
		currChampionId = 0;
	} else {
		currChampionId = championNames.indexOf(championSelection);
	}
	console.log(currChampionId);
	loadSummonerData(matches);
});

$("#teamdropdownlist").on("click", "a", function() {
	var teamSelection = $(this).html();
	adjustButton("#teamdropdownmenu", teamSelection);
	switch (teamSelection) {
		case "All Teams":
			currTeam = 0;
			break;
		case "Blue Team":
			currTeam = 100;
			break;
		case "Red Team":
			currTeam = 200;
	}
	console.log(currTeam);
	loadSummonerData(matches);
});

$("#roledropdownlist").on("click", "a", function() {
	var roleSelection = $(this).html();
	adjustButton("#roledropdownmenu", roleSelection);

	switch (roleSelection) {
		case "All Roles":
			currLane = "";
			currRole = ""; 
			break;
		case "Top":
			currLane = "TOP";
			currRole = "SOLO";
			break;
		case "Mid":
			currLane = "MIDDLE";
			currRole = "SOLO";
			break;
		case "Marksman":
			currLane = "BOTTOM";
			currRole = "DUO_CARRY";
			break;
		case "Support":
			currLane = "BOTTOM";
			currRole = "DUO_SUPPORT";
			break;
		case "Jungle":
			currLane = "JUNGLE";
			currRole = "NONE";
	}
	console.log(currLane + " " + currRole);
	loadSummonerData(matches);
});

$("#seasondropdownlist").on("click", "a", function() {
	var seasonSelection = $(this).html();
	adjustButton("#seasondropdownmenu", seasonSelection);

	switch (seasonSelection) {
		case "All Seasons":
			currSeason = "";
			break;
		case "Season 4":
			currSeason = "SEASON2014";
			break;
		case "Pre-Season 5":
			currSeason = "PRESEASON2015";
			break;
		case "Season 5":
			currSeason = "SEASON2015";
			break;
	}
	console.log(currSeason);
	loadSummonerData(matches);
});
