import json, requests
import key
import sys
import time

API_key = key.getAPIkey()
#registered_users = {'boxbox': 245353, 'laughinggorz': 21823701, 'wingsofdeathx': 19660288, 'nightblue3': 25850956}
registered_users = {'dizzyyy': 23109706}
#returns the array of matches for a given summoner in JSON format
# if no file exists, create a json file with an empty array for matches
def load_database(summoner_name): 
	with open(summoner_name + '.json', 'a+') as f:
		if f.tell() == 0:
			f.write('[]')
		f.seek(0)
		return json.load(f)
	#print matches

#gets a new array of matches without other participants from the Riot API and appends any new ones to the current array
#use this plus a begin and end index to get all of the matches of a player since the introduction of this version of match history
def load_match_history(summoner_id):
	index = 0
	while True: 
	#changes_made = False
		try:
			r = requests.get(match_history_query(summoner_id, index))
		except requests.exceptions.HTTPError as e:
			print e.message
			time.sleep(1)
			r = requests.get(match_history_query(summoner_id, index))

		new_matches = r.json()['matches']

		time.sleep(1)

		for match in new_matches:
			if not match in matches:
				player = match['participants'][0]
				match_details = get_other_participants(player['championId'], match['matchId'])
				match_details['player'] = player
				matches.append(match_details)
				time.sleep(1)
				#changes_made = True
				print "match added"
			else:
				print "match already exists"

		# break if no more matches remaining
		if len(new_matches) != 15:
			break
		index += 15

	#return changes_made

def match_history_query(summoner_id, index):
	return "https://na.api.pvp.net/api/lol/na/v2.2/matchhistory/" + str(summoner_id) + "?&beginIndex=" + str(index) + "&api_key=" + API_key

#gets all the other participants from a match
#can be used to initialize a users data, before using cron to simply update by most recent games
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
				#print "removed owner"
		return match
	except requests.exceptions.HTTPError as e:
		print e.message
		time.sleep(2)
		get_other_participants(match_id)


#writes the new updated array to file	
def write(summoner_name):
	with open(summoner_name + '.json', 'w') as fp:
   		json.dump(matches, fp)

# iterate through the list of summoner name and id pairs
for summoner_name, summoner_id in registered_users.items():
	matches = load_database(summoner_name)
	print summoner_name + ": "
	load_match_history(summoner_id)
	write(summoner_name)
	#print "no changes"
