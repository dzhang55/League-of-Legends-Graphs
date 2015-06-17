import json, requests
from flask import Flask, request, render_template
from pymongo import MongoClient
from bson import json_util
import key

app = Flask(__name__)

client = MongoClient()
db = client.database
API_key = key.getAPIkey()

@app.route('/')
def homepage():
    print "homepage!"
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search():
    print "posted to search!"
    summoner_name = request.form['name']
    try:
        r = requests.get("https://na.api.pvp.net/api/lol/na/v1.4/summoner/by-name/"
                      + summoner_name +  "?api_key=" + API_key)
        print "query made"
    except requests.exceptions.HTTPError as e:
		return render_template('index.html', message = "User not found")

    #TO DO: deal with multiple summoners
    #should only have one key so this loop executes once
    #this is done to access the ke
    json = r.json()
    for summoner in json:
        id = str(json[summoner]['id'])
        print id
    if id in db.collection_names():
        print "found database"
        return json_util.dumps(db[id].find())
    else:
        print "no database for some reason"
        return render_template('index.html', message = "User not registered")


if __name__ == '__main__':
    app.run()
