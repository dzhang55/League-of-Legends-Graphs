import json, requests
import key
import time
import sys
from pymongo import MongoClient
from threading import Thread

API_key = key.getAPIkey()
client = MongoClient()
db = client.database
soft_update = False
done_loading = False

#use this plus a begin and end index to get all of the matches of a player since the introduction of this version of match history
def load_match_history(summoner_id):
    index = 0
    while not done_loading:
        try:
            r = requests.get(match_history_query(summoner_id, index))
            matches_json = r.json()
            if 'status' in matches_json:
                print matches_json['status']['message']
                print "during load match history"
                time.sleep(2)
                continue

        except requests.exceptions.HTTPError as e:
            print "error"
            print e.message
            time.sleep(2)
            continue
        except requests.exceptions.ValueError as e:
            print e.message

        #empty json meaning all matches have been added
        if 'matches' not in matches_json:
            break
        new_matches = r.json()['matches']
        add_current_matches(summoner_id, new_matches)
        #time.sleep(0.1)
        index += 15
    print "done loading"

#start threads for loading each match in the list of current matches
def add_current_matches(summoner_id, new_matches):
    for match in reversed(new_matches):
        match_thread = Thread(target=load_single_match, args=[summoner_id, match])
        match_thread.start()

#writes a single match to the database
def load_single_match(summoner_id, match):
    global done_loading
    player = match['participants'][0]
    match_details = get_other_participants(player['championId'], match['matchId'])
    match_details['player'] = player
    match_summary = abbreviate_match(match_details)
    write_result = db[str(summoner_id)].update({'_id' : match_details['matchId']}, {'$setOnInsert' : match_summary}, upsert = True)
    
    # if the match already exists and this is a soft update, this will stop loading matches
    if write_result['updatedExisting'] == True:
        print "match already exists"
        if soft_update:
            done_loading = True
    print "match added"
    print match_details['matchId']

#retrieves relevant statistics from a match
def abbreviate_match(match):
    print "abbreviated"
    match_summary = {}
    match_summary['season'] = match['season']
    match_summary['player'] = {}
    match_summary['player']['championId'] = match['player']['championId']
    match_summary['player']['teamId'] = match['player']['teamId']
    match_summary['player']['role'] = match['player']['timeline']['role']
    match_summary['player']['lane'] = match['player']['timeline']['lane']
    match_summary['player']['winner'] = match['player']['stats']['winner']

    match_summary['participants'] = []
    for participant in match['participants']:
        match_summary['participants'].append(
            {'championId': participant['championId'],
             'teamId': participant['teamId']})

    return match_summary

def match_history_query(summoner_id, index):
    return 'https://na.api.pvp.net/api/lol/na/v2.2/matchhistory/' + str(summoner_id) + '?&beginIndex=' + str(index) + '&api_key=' + API_key

#gets all the other participants from a match
def get_other_participants(champion_id, match_id):
    try:
        r = requests.get('https://na.api.pvp.net/api/lol/na/v2.2/match/' + str(match_id) +  '?api_key=' + API_key)
        match = r.json()
        while 'status' in match:
            print match['status']['message']
            print "during getting other participants"
            time.sleep(2)
            r = requests.get('https://na.api.pvp.net/api/lol/na/v2.2/match/' + str(match_id) +  '?api_key=' + API_key)
            match = r.json()

        # remove the player from the participants
        for participant in match['participants']:
            if champion_id == participant['championId']:
                match['participants'].remove(participant)
                break
                #print "removed owner"
        return match
    except requests.exceptions.HTTPError as e:
        print e.message
    except ValueError as e:
        print e.message
        print match_id


if __name__ == '__main__':
    if len(sys.argv) == 2:
        args = sys.argv[1]
        if args == "soft":
            soft_update = True
    for collection in db.collection_names(include_system_collections = False):
        db[collection].remove()
        done_loading = False
        print db[collection].count()
        print collection + ': '
        load_match_history(collection)
        print db[collection].count()


