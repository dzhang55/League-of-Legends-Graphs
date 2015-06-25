import json, requests
from flask import Flask, request, render_template
from pymongo import MongoClient
from bson import json_util
import key
import update
from threading import Thread
import time

app = Flask(__name__)

client = MongoClient()
db = client.database
API_key = key.getAPIkey()

@app.route('/')
def homepage():
    print 'homepage!'
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search():
    print 'posted to search!'
    summoner_name = request.form['name']
    try:
        r = requests.get('https://na.api.pvp.net/api/lol/na/v1.4/summoner/by-name/'
                      + summoner_name +  '?api_key=' + API_key)
        json = r.json()

        # repeat if rate limit exceeded
        if 'status' in json:
            print json['status']['message']
            time.sleep(2)
            r = requests.get('https://na.api.pvp.net/api/lol/na/v2.2/match/' + str(match_id) +  '?api_key=' + API_key)
            json = r.json()
    except ValueError:
        return 'Summoner not found'

    #TO DO: is there a case with multiple summoners?

    #should only have one key so this loop executes once
    #this is done to access the key
    for summoner in json:
        id = str(json[summoner]['id'])
    print id
    print db.collection_names()

    # return all matches
    if id in db.collection_names():
        data = db[id].find({}, {'_id': 0})
        return json_util.dumps(data)
    else:
        return 'Summoner not registered' + id

@app.route('/register', methods=['POST'])
def register():
    print 'posted to register'
    summoner_id = request.form['id']
    print summoner_id
    #start thread in order to respond to client while registering user
    update_thread = Thread(target=update.load_match_history, args=[summoner_id])
    update_thread.start()
    return "registered!"

if __name__ == "__main__":
    app.run()
