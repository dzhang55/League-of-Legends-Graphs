import json, requests
import key
import time
from pymongo import MongoClient

API_key = key.getAPIkey()
client = MongoClient()
db = client.database

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
            print "error"
            print e.message
            time.sleep(2)
            continue
        matches_json = r.json()

        #empty json meaning all matches have been added
        if 'matches' not in matches_json:
            break;
        time.sleep(1)
        new_matches = r.json()['matches']

        done_loading = add_current_matches(summoner_id, new_matches)
        index += 15
    print "done loading"

def add_current_matches(summoner_id, new_matches):
    for match in reversed(new_matches):
        player = match['participants'][0]
        match_details = get_other_participants(player['championId'], match['matchId'])
        match_details['player'] = player
        write_result = db[str(summoner_id)].update({'matchId' : match_details['matchId']}, {'$setOnInsert' : match_details}, upsert = True)

        if write_result['updatedExisting'] == True:
            print "match already exists"
            return True
        print "match added"
        print match_details['matchId']
        time.sleep(1)
    return False


def match_history_query(summoner_id, index):
    return 'https://na.api.pvp.net/api/lol/na/v2.2/matchhistory/' + str(summoner_id) + '?&beginIndex=' + str(index) + '&api_key=' + API_key

#gets all the other participants from a match
def get_other_participants(champion_id, match_id):
    try:
        r = requests.get('https://na.api.pvp.net/api/lol/na/v2.2/match/' + str(match_id) +  '?api_key=' + API_key)
        match = r.json()

        if 'status' in match:
            print match['status']['message']
            time.sleep(10)
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
        print 'error in getting other participants'
        time.sleep(2)
        get_other_participants(match_id)

def main():
    for collection in db.collection_names(include_system_collections = False):
        print db[collection].count()
        print collection + ': '
        load_match_history(collection)
        print db[collection].count()

# iterate through the list of summoner name and id pairs
if __name__ == '__main__':
    main()

