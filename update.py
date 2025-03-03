import json, requests
import key
import time
import sys
from pymongo import MongoClient
from threading import Thread

API_key = key.getAPIkey()
client = MongoClient()
db = client.database
hard_update = False
done_loading = False

#use this plus a begin and end index to get all of the matches of a player since the introduction of this version of match history
def load_match_history(region, summoner_id):
    global done_loading
    done_loading = False
    try:
        r = requests.get(match_history_query(region, summoner_id))
        matches_json = r.json()
        if 'status' in matches_json:
            print matches_json['status']['message']
            print "during load match history"
            time.sleep(2)
            load_match_history(region, summoner_id)

    except requests.exceptions.HTTPError as e:
        print "error"
        print e.message
        time.sleep(2)
        load_match_history(region, summoner_id)
    except ValueError as e:
        print e.message
        time.sleep(2)
        # server error 500
        load_match_history(region, summoner_id)

        #empty json meaning all matches have been added
    if 'matches' not in matches_json:
        return
    new_matches = r.json()['matches']
    if not hard_update and up_to_date(region + summoner_id, new_matches[-1]['matchId']):
        print "up to date"
        return
    add_current_matches(region, summoner_id, new_matches)
    print summoner_id + " is done loading"

#checks if the most recent match is in the database
def up_to_date(collection, match_id):
    return db[collection].find({'_id': match_id}).count() == 1

#start threads for loading each match in the list of current matches
def add_current_matches(region, summoner_id, new_matches):
    global done_loading
    for match in reversed(new_matches):
        if not done_loading:
            match_thread = Thread(target=load_single_match, args=[region, summoner_id, match])
            match_thread.start()

#writes a single match to the database
def load_single_match(region, summoner_id, match):
    global done_loading
    player_champion = match['champion']
    match_details = get_other_participants(region, match['matchId'])
    match_summary = abbreviate_match(match_details, player_champion)
    write_result = db[region + str(summoner_id)].update({'_id' : match_details['matchId']}, {'$setOnInsert' : match_summary}, upsert = True)
    
    # if the match already exists and this is a soft update, this will stop loading matches
    if not hard_update and write_result['updatedExisting'] == True:
        print "match already exists"
        done_loading = True
    else: 
        print match_details['matchId']

#retrieves relevant statistics from a match
def abbreviate_match(match, champion_id):
    match_summary = {}
    match_summary['season'] = match['season']
    match_summary['player'] = {}

    match_summary['participants'] = []
    for participant in match['participants']:
        if champion_id == participant['championId']:
            match_summary['player']['championId'] = participant['championId']
            match_summary['player']['teamId'] = participant['teamId']
            match_summary['player']['role'] = participant['timeline']['role']
            match_summary['player']['lane'] = participant['timeline']['lane']
            match_summary['player']['winner'] = participant['stats']['winner']
        else:
            match_summary['participants'].append(
                {'championId': participant['championId'],
                'teamId': participant['teamId']})

    return match_summary

def match_history_query(region, summoner_id):
    return ('https://' + region + '.api.pvp.net/api/lol/' + region
     + '/v2.2/matchlist/by-summoner/' + str(summoner_id) + '?&api_key=' + API_key)

#gets all the other participants from a match
def get_other_participants(region, match_id):
    try:
        r = requests.get('https://' + region + '.api.pvp.net/api/lol/' + region + '/v2.2/match/' + str(match_id) +  '?api_key=' + API_key)
        match = r.json()
        while 'status' in match:
            print match['status']['message']
            print "during getting other participants"
            time.sleep(2)
            r = requests.get('https://na.api.pvp.net/api/lol/na/v2.2/match/' + str(match_id) +  '?api_key=' + API_key)
            match = r.json()

        return match
    except requests.exceptions.HTTPError as e:
        print e.message
    except ValueError as e:
        print e.message
        print match_id
        time.sleep(2)
        get_other_participants(region, match_id)

def get_region_and_id(name):
    region = ''
    summoner_id = ''
    for char in name:
        if char.isdigit():
            summoner_id = summoner_id + char
        else:
            region = region + char
    print region
    print summoner_id
    return {'region': region, 'summoner_id': summoner_id}


if __name__ == '__main__':
    if len(sys.argv) == 2:
        args = sys.argv[1]
        if args == "hard":
            hard_update = True
    #hard_update of single summoner by region and id
    if len(sys.argv) == 3:
        region = sys.argv[1]
        summoner_id = sys.argv[2]
        hard_update = True
        load_match_history(region, summoner_id)
        sys.exit()
            
    for collection in db.collection_names(include_system_collections = False):
        done_loading = False
        print db[collection].count()
        print collection + ': '
        info = get_region_and_id(collection)
        load_match_history(info['region'], info['summoner_id'])
        print db[collection].count()


