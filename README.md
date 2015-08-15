Riftwatch
=========

www.riftwatch.net

Riftwatch is a Flask app that parses JSON data from the League of Legends API and stores it using MongoDB. It displays relevant game statistics to the user using D3 bubble graphs that the user can then interact with using various filters/settings. 

##How it works

When a user searchs for his/her summoner name, the app collects data by looping through the ranked match history endpoint for that user (and then using the match endpoint on each match by its id for data on all other participants). The database stores previous data, so a returning user would only have to update with new matches. The data from all of the user's ranked matches is returned to the client, where it is used to construct a D3 bubble graph (using the pack layout). The graph displays all the champions the user has played against, with the user's respective winrates against that champion. The bubbles' size correspond to the number of games played against that champion. The various settings such as champion played, season, role, all refer to what the user played in matches. For example, if the user selects Riven in the champion filter, then the graph will transform to display only the data from matches in which the user played Riven.

##Status

RiftWatch is up and running, but I do plan to add a few features:

- Make the site mobile-friendly
- Make the color of the bubble correspond to the champion displayed (by identifying the color palette using Vibrant.js for example)
- Add filters for items and masteries
- Add filters for skill order (problematic because skill upgrades are stored in a complicated timeline that represents all the events in the game, so I'd have to parse through that)
