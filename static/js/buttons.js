regionSelection = "na";

// change button name to selection, preserves other children like the arrow in dropdown menus
function adjustButton(buttonId, selection) {
	var button = $(buttonId);
	var children = button.children();
	button.html(selection + " ");
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
	$("#svg-container").prepend(register);

	register.on("click", function() {
		$.ajax({
			url: "/register",
			data: {id: summonerId, region: regionSelection},
			type: "POST",
			success: function(response) {
				$("#graphtitle").html("Registering summoner - takes about a minute. Please search again!");
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
	$("#instructions").remove();
	// remove register button if it exists
	console.log($("#register").length);
	if ($("#register").length) {
		$("#register").remove();
	}
	console.log("SUBMITTED");
	$.ajax({
        url: "/search",
        data: {name: $("input").val(), region: regionSelection},
        type: "POST",
        dataType: "json",
        success: function(response) {
        	console.time("loaddata");
        	matches = response;
            loadSummonerData(matches);
            loadList(matches)
            //
            console.timeEnd("loaddata");
        },
        error: function(error) {
        	// displays Summoner not registered and passes id to register button
        	console.log("ERROR");
        	console.log(error);
        	message = error.responseText.substring(0, 23);
			matches = [];
			removeExitingNodes(d3.selectAll(".node"));
			if (message == "Summoner not registered") {
				$("#graphtitle").html(message);
				summonerId = error.responseText.substring(23);
				console.log(summonerId);
				addRegisterButton(summonerId);
			} else {
				$("#graphtitle").html(error.responseText);
			}

            
        }
    });
    return false;
});

$("#regiondropdownlist").on("click", "a", function() {
	regionSelection = $(this).html();
	console.log(regionSelection);
	adjustButton("#regiondropdownmenu", regionSelection);
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

$("#list-selection").on("click", function() {
	console.log("toggle selection");
	var selection = $(this).html();
	if (selection === "Winrate") {
		$(this).html("Total");
	} else if (selection === "Total") {
		$(this).html("Winrate");
	}
	loadList();
});


$("#list-order").on("click", function() {
	var order = $(this).html();
	console.log(order);
	if (order === "Ascending") {
		console.log("change to descending");
		$(this).html("Descending");
	} else if (order === "Descending") {
		console.log("change to ascending");
		$(this).html("Ascending");
	}
	loadList();
});