import json, requests
import key
import sys
import time
from pymongo import MongoClient

API_key = key.getAPIkey()
#registered_users = {'boxbox': 245353, 'laughinggorz': 21823701, 'wingsofdeathx': 19660288, 'nightblue3': 25850956}
registered_users = {'dizzyyy': 23109706}

client = MongoClient()
db = client.database

def load_registered_users():
	with open('json/summoners.json', 'r') as f:
		if f.tell() == 0:
			f.write('[]')
		users = json.load(f)
	return users

def update_registered_users(summoner_name, summoner_id):
	users = load_registered_users()
	users[summoner_name] = summoner_id
	with open('json/summoners.json', 'w') as f:
   		json.dump(users, f)


#gets a new array of matches without other participants from the Riot API and appends any new ones to the current array
#use this plus a begin and end index to get all of the matches of a player since the introduction of this version of match history
#returns true if there are no changes
def load_match_history(summoner_id):
	index = 0
	done_loading = False
	while not done_loading: 
		try:
			r = requests.get(match_history_query(summoner_id, index))
		except requests.exceptions.HTTPError as e:
			print e.message
			time.sleep(1)
			r = requests.get(match_history_query(summoner_id, index))
		matches_json = r.json()
		if 'matches' not in matches_json:
			break;
		time.sleep(1)
		new_matches = r.json()['matches']

		done_loading = add_current_matches(summoner_id, new_matches)
		index += 15

def add_current_matches(summoner_id, new_matches):
	for match in reversed(new_matches):
		player = match['participants'][0]
		match_details = get_other_participants(player['championId'], match['matchId'])
		match_details['player'] = player
		write_result = db[str(summoner_id)].update({'matchId' : match_details['matchId']}, {'$setOnInsert' : match_details}, upsert = True)
		print write_result
		if write_result['updatedExisting'] == True:
			print "match already exists"
			return True
		print "match added"
		print match_details['matchId']
		time.sleep(1)


def match_history_query(summoner_id, index):
	return "https://na.api.pvp.net/api/lol/na/v2.2/matchhistory/" + str(summoner_id) + "?&beginIndex=" + str(index) + "&api_key=" + API_key

#gets all the other participants from a match
def get_other_participants(champion_id, match_id):
	try:
		r = requests.get("https://na.api.pvp.net/api/lol/na/v2.2/match/" + str(match_id) +  "?api_key=" + API_key)
		match = r.json()

		if 'status' in match:
			print match['status']['message']
		#else : 
			#print "match details added"

		# remove the player from the participants	
		for participant in match['participants']:
			if champion_id == participant['championId']:
				match['participants'].remove(participant)
				break
				#print "removed owner"
		return match
	except requests.exceptions.HTTPError as e:
		print e.message
		time.sleep(2)
		get_other_participants(match_id)


# iterate through the list of summoner name and id pairs
for summoner_name, summoner_id in registered_users.items():
	print db[str(summoner_id)].count()
	print summoner_name + ": "
	load_match_history(summoner_id)
	print db[str(summoner_id)].count()
