import json, requests
import key
import sys

API_key = key.getAPIkey();
games = []
#returns the array of matches for a given summoner in JSON format
def load_database(summoner_name):
	with open(summoner_name + 'games.json', 'r') as f:
		return json.load(f)
	#print matches

#gets a new array of matches from the Riot API and appends any new ones to the current array
def update_summoner_matches():
	changes_made = False
	r = requests.get("https://na.api.pvp.net/api/lol/na/v1.3/game/by-summoner/" + str(summonerId) + "/recent?api_key=" + API_key)
	new_games = r.json()['games']

	# goes through each game and only appends new ranked games
	for game in new_games:
		if not game in games and (game['subType'] == "RANKED_SOLO_5x5" or game['subType'] == "RANKED_PREMADE_5x5" or game['subType'] == "RANKED_TEAM_5x5"):
			games.append(game)
			changes_made = True
			print "game added"

	return changes_made

#writes the new updated array to file	
def write(summoner_name):
	with open(summoner_name + 'games.json', 'w') as fp:
   		json.dump(games, fp)

summonerName = sys.argv[1]
summonerId = sys.argv[2]

games = load_database(summonerName)
if update_summoner_matches():
	write(summonerName)
else:
	print "no changes"
