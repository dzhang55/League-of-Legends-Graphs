import json, requests
import key
import sys

API_key = key.getAPIkey();
registered_users = {'boxbox': 245353, 'laughinggorz': 21823701, 'wingsofdeathx': 19660288}
games = []
#returns the array of matches for a given summoner in JSON format
def load_database(summoner_name):
	with open(summoner_name + 'games.json', 'r') as f:
		return json.load(f)
	#print matches

#gets a new array of matches from the Riot API and appends any new ones to the current array
def update_recent_games(summoner_id):
	changes_made = False
	r = requests.get("https://na.api.pvp.net/api/lol/na/v1.3/game/by-summoner/" + str(summoner_id) + "/recent?api_key=" + API_key)
	new_games = r.json()['games']

	# goes through each game and only appends new ranked games
	for game in new_games:
		if not game in games and (game['subType'] == "RANKED_SOLO_5x5" or game['subType'] == "RANKED_PREMADE_5x5" or game['subType'] == "RANKED_TEAM_5x5"):
			games.append(game)
			changes_made = True
			print "game added"

	return changes_made

#writes the new updated array to file	
def write_games(summoner_name):
	with open(summoner_name + 'games.json', 'w') as fp:
   		json.dump(games, fp)

# iterate through the list of summoner name and id pairs
for summoner_name, summoner_id in registered_users.items():
	games = load_database(summoner_name)
	print summoner_name + ": "
	if update_recent_games(summoner_id):
		write_games(summoner_name)
	else:
		print "no changes"
