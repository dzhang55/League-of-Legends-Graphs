import json
import key
import requests
import sys
from pymongo import MongoClient

API_key = key.getAPIkey()
client = MongoClient()
db = client.database
champion_url = "https://global.api.pvp.net/api/lol/static-data/na/v1.2/champion?api_key=" + API_key

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

def load_champions():
	r = requests.get(champion_url)
	if r.status_code == 200:
		champion_json = r.json()
		for champion, obj in champion_json['data'].iteritems():
			print champion
			db.champion.insert({'id': obj['id'], 'key': obj['key'], 'name': obj['name']})
	else:
		print "could not get champion.json"

#load_champions()
print db.collection_names
for d in db.champion.find():
    print d
print "done with loop"
print db.champion.find_one({'name':'Aatrox'})
print db.champion.find().count()
