import json, requests
import key
import time
import sys
from pymongo import MongoClient

API_key = key.getAPIkey()
client = MongoClient()
db = client.database
hard_update = False

#gets a new array of matches without other participants from the Riot API and appends any new ones to the current array
#use this plus a begin and end index to get all of the matches of a player since the introduction of this version of match history
#returns true if there are no changes
def load_match_history(summoner_id):
    start = time.time()
    index = 0
    done_loading = False
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

        #empty json meaning all matches have been added
        if 'matches' not in matches_json:
            break
        #time.sleep(1)
        new_matches = r.json()['matches']
        done_loading = add_current_matches(summoner_id, new_matches)
        index += 15
    print "done loading"
    print "total: " + str(time.time() - start)

def add_current_matches(summoner_id, new_matches):
    for match in reversed(new_matches):
        player = match['participants'][0]
        match_details = get_other_participants(player['championId'], match['matchId'])
        match_details['player'] = player
        match_summary = abbreviate_match(match_details)
        write_result = db[str(summoner_id)].update({'_id' : match_details['matchId']}, {'$setOnInsert' : match_summary}, upsert = True)

        if write_result['updatedExisting'] == True:
            print "match already exists"
            if not hard_update:
                return True
        print "match added"
        print match_details['matchId']
    return False

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
    except requests.exceptions.ValueError as e:
        print e.message
        print match_id


if __name__ == '__main__':
    if len(sys.argv) == 2:
        args = sys.argv[1]
        if args == "hard":
            hard_update = True
    for collection in db.collection_names(include_system_collections = False):
        print db[collection].count()
        print collection + ': '
        load_match_history(collection)
        print db[collection].count()


