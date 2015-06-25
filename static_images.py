import json
import requests

#load all champion pictures
def load_champion_pictures(): 
	with open('json/champion.json', 'r') as f:
		champion_json = json.load(f)
	print len(champion_json['data'])
	for champion in champion_json['data']:
		print champion
		# currently version number is hardcoded to 5.11.1
		r = requests.get('http://ddragon.leagueoflegends.com/cdn/5.11.1/img/champion/' + champion + '.png')
		if r.status_code == 200:
			img = r.content
			with open('images/champions/' + champion + '.png', 'w') as f:
				f.write(img)
			print "img created"
		else:
			print "something went wrong"

load_champion_pictures()
