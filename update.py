import json, requests
import key

API_key = key.getAPIkey();

#returns the array of matches for a given summoner in JSON format
def load_database(summoner_name):
	with open(summoner_name + '.json', 'r') as f:
		return json.load(f)
	#print matches

#gets a new array of matches from the Riot API and appends any new ones to the current array
def update_summoner_matches():
	changes_made = False
	r = requests.get("https://na.api.pvp.net/api/lol/na/v2.2/matchhistory/245353?rankedQueues=RANKED_SOLO_5x5&api_key=" + API_key)
	new_matches = r.json()['matches']

	for match in new_matches:
		if not match in matches:
			matches.append(match)
			changes_made = True
			print "match added"

	return changes_made

#writes the new updated array to file	
def write(summoner_name):
	with open(summoner_name + '.json', 'w') as fp:
   		json.dump(matches, fp)

matches = load_database('boxbox')
if update_summoner_matches():
	write('boxbox')
else:
	print "no changes"
