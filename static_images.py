import json
import requests
import key

API_key = key.getAPIkey()

#load all champion pictures
def load_champion_pictures(champion_json): 
	print len(champion_json['data'])
	version = champion_json['version']
	print "version: " + version
	for champion in champion_json['data']:
		print champion
		r = requests.get('http://ddragon.leagueoflegends.com/cdn/' + version + '/img/champion/' + champion + '.png')
		if r.status_code == 200:
			img = r.content
			with open('static/images/champions/' + champion_json['data'][champion]['name'] + '.png', 'w') as f:
				f.write(img)
			print "img created"
		else:
			print "pictures: something went wrong"

#load champion json
#converts to python dict using json() and json.dump() for error checking
def load_champion_json():
	try:
		r = requests.get('https://global.api.pvp.net/api/lol/static-data/na/v1.2/champion?&api_key=' + API_key)
		champion_json = r.json()
		if 'status' in champion_json:
			print champion_json['status']['message']
			return
		load_champion_pictures(champion_json)
		# quick fix to change MonkeyKing to Wukong so that sort_keys sorts it properly
		champion_json['data']['Wukong'] = champion_json['data']['MonkeyKing']
		del champion_json['data']['MonkeyKing']
	except ValueError as e:
		print e.message
		return

	with open('static/json/champion.json', 'w') as f:
		json.dump(champion_json, f, sort_keys=True)

load_champion_json()
