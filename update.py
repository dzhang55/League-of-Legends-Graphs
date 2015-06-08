import json, requests
import key
import sys

API_key = key.getAPIkey()
registered_users = {'boxbox': 245353, 'laughinggorz': 21823701, 'wingsofdeathx': 19660288}

#returns the array of matches for a given summoner in JSON format
def load_database(summoner_name):
	with open(summoner_name + '.json', 'r') as f:
		return json.load(f)
	#print matches

#gets a new array of matches without other participants from the Riot API and appends any new ones to the current array
def update_match_history(summoner_id):
	changes_made = False
	r = requests.get("https://na.api.pvp.net/api/lol/na/v2.2/matchhistory/" + str(summoner_id) + "?rankedQueues=RANKED_SOLO_5x5&api_key=" + API_key)
	new_matches = r.json()['matches']

	for match in new_matches:
		if not match in matches:
			matches.append(match)
			changes_made = True
			print "match added"

	return changes_made

def get_other_participants(match_id):
	pass

#writes the new updated array to file	
def write(summoner_name):
	with open(summoner_name + '.json', 'w') as fp:
   		json.dump(matches, fp)

# iterate through the list of summoner name and id pairs
for summoner_name, summoner_id in registered_users.items():
	matches = load_database(summoner_name)
	print summoner_name + ": "
	if update_match_history(summoner_id):
		write(summoner_name)
	else:
		print "no changes"
