"use strict";

/* ----------------------- Module Dependencies ----------------------------- */

var Rx = require('rx');
var xhrRequest = require('superagent'); 

//For testing 
//var chai = require('chai');
//var assert = chai.assert;

//to add another module:
//var x  = require('./js/components/...');

/* ------------------------- Global Variables ------------------------------ */

//urls 
const cumulative_player_data_url = 'https://www.mysportsfeeds.com/api/feed/pull/nba/2015-2016-regular/cumulative_player_stats.json?';
const profile_data_url = 'https://www.mysportsfeeds.com/api/feed/pull/nba/2015-2016-regular/active_players.json';

//main stats variables
let all_stats_data, all_profile_data;
let search_array;
let current_player_clicked;
let player_profile, player_main_stats, player_secondary_stats;
let player_team_name, player_team_list, player_team_positions;

//compare stats variables
let compare_player_a, compare_player_b;
let player_a_profile, player_b_profile;
let player_a_main_stats, player_b_main_stats;
let player_a_sec_stats, player_b_sec_stats;
let compare_player_clicked;

//async get requests 
let getAllProfileData = Rx.Observable.create((observer) => {
  xhrRequest
    .get(profile_data_url)
    .auth('jaellen', 'adanaC4032')
    .end(function(err, res) {
      if (err) {
        return observer.onError(err);
      }
      let data = JSON.parse(res.text);
      observer.onNext(data);
    });
    return () => {};
});
let getAllStatsData = Rx.Observable.create((observer) => {
  xhrRequest
   .get(cumulative_player_data_url)
   .auth('jaellen', 'adanaC4032')
   .end(function(err, res) {
      if (err) {
        return observer.onError(err);
      }
      let data = JSON.parse(res.text);
      observer.onNext(data);
   });
   return () => {};
});

/* -------------------------- Program Logic -------------------------------- */

let setAllStatsData = function() {
  //set all_stats_data
  getAllStatsData
    .take(1)
    .subscribe({
    onNext: (data) => {
      all_stats_data = data.cumulativeplayerstats.playerstatsentry;
    },
    onError: (error) => { console.error("Error in XMLHttpRequest") },
    onCompleted: () => {
      getSearchRecommendations();
    },
  });   
};

let setAllProfileData = function() {
  //set all_profile_data
  getAllProfileData
    .take(1)
    .subscribe({
    onNext: (data) => {
      all_profile_data = data.activeplayers.playerentry;
    },
    onError: (error) => { console.error("Error in XMLHttpRequest") },
    onCompleted: () => {
    },
  });  
};

let getSearchRecommendations = function() {
  
    //set the search array
    let input = document.getElementById("searchBox")
    let ul = document.getElementById("searchResults")
    let sortedResults, prefix, inputTerms, termsArray, terms, results;

    let search = function() {
      search_array = createFirstandLastNameArray(all_stats_data);    
      inputTerms = input.value.toLowerCase();
      results = [];
      termsArray = inputTerms.split(' ');
      prefix = termsArray.length === 1 ? '' : termsArray.slice(0, -1).join(' ') + ' ';
      terms = termsArray[termsArray.length -1].toLowerCase();

      for (var i = 0; i < search_array.length; i++) {
        var a = search_array[i].toLowerCase(),
            t = a.indexOf(terms);
        if (t > -1) {
          results.push(a);
        }
      }
         
      let sortResults = function(a,b) {
        if (a.indexOf(terms) < b.indexOf(terms)) return -1;
        if (a.indexOf(terms) > b.indexOf(terms)) return 1;
        return 0;
      };

      let evaluateSearchResults = function() {
        if (results.length > 0 && inputTerms.length > 0 && terms.length !== 0) {
          sortedResults = results.sort(sortResults);
          displaySearchResults();
        }
        else if (inputTerms.length > 0 && terms.length !== 0) {
          ul.innerHTML = '<li><strong>' + inputTerms + ' is not a current active player <br></strong></li>';
        }
        else if (inputTerms.length !== 0 && terms.length === 0) {
          return;
        }
        else {
          clearResults();
        }
      };
      evaluateSearchResults();
    };

    let clearResults = function() {
      ul.className = "term-list hidden";
      ul.innerHTML = '';
    };

    let displaySearchResults = function () {
      clearResults();

      //Note: A maximum of 5 recommendations set here 
      for (let i = 0; i < sortedResults.length && i < 5; i++) {  
        let li = document.createElement("li");
        let a = document.createElement("a");

        //set click event listener that sets curent_player_clicked...
        a.setAttribute('id', i.toString());
        a.addEventListener("click", function(event) {     
          
          current_player_clicked = sortedResults[event.currentTarget.getAttribute('id')];  
          
          //clear the search field & recommendations and update the stats with that player 
          document.getElementById('searchBox').value = '';
          clearResults(); 
          updatePlayerStats();
        });

        var result = prefix + sortedResults[i].toLowerCase().replace(terms, '<strong>' + terms + '</strong>' );
        li.innerHTML = result;
        ul.appendChild(a);
        a.appendChild(li);
      }
      if (ul.className !== "term-list") {
        ul.className = "term-list";
      }
    };

    input.addEventListener("keyup", search, false);
    setAllProfileData();
};

let updatePlayerStats = function() {

  //set player_profile, player_main_stats and player_secondary_stats
  player_profile = getPlayerProfile(all_profile_data, current_player_clicked)[0];
  player_main_stats = getPlayerMainStats(all_stats_data, current_player_clicked)[0];  
  player_secondary_stats = getPlayerSecondaryStats(all_stats_data, current_player_clicked)[0];

  //set player_team_name, player_team_list, player_team_positions
  player_team_name = all_stats_data
                      .filter(function(entry) { 
                        return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === current_player_clicked })
                      .map(function(entry) { 
                        return entry.team.City + " " + entry.team.Name });

  player_team_list = all_stats_data
                      .filter(function(entry) { 
                        return (entry.team.City + " " + entry.team.Name) === player_team_name.toString() })
                      .map(function(entry) {
                        return entry.player.FirstName + " " + entry.player.LastName });

  player_team_positions = all_stats_data
                    .filter(function(entry) { 
                      return (entry.team.City + " " + entry.team.Name) === player_team_name.toString() })
                    .map(function(entry) {
                      return entry.player.Position });
  
  //call display functions for player's profile, main stats, secondary stats, and team 
  displayPlayerProfile();
  displayPlayerMainStats();
  displayPlayerSecondaryStats();
  displayPlayerTeamName();
  displayPlayerTeamList();
};

let displayPlayerProfile = function() {
  
  //clear any previous results and display player profile
  document.getElementById("profile").innerHTML = '';

  for (var prop in player_profile) {
        document.getElementById("profile").appendChild(createElement( "li", player_profile[prop] ));
  }
};

let displayPlayerMainStats = function() {
  
  //clear any previous results and display player's main stats
  document.getElementById("stats-main").innerHTML = '';

  for (var stat in player_main_stats) {
        document.getElementById("stats-main").appendChild(createElement( "li", player_main_stats[stat] ));
  }
};

let displayPlayerSecondaryStats = function() {
  
  //clear any previous results and display player's secondary stats 
  document.getElementById("stats-secondary").innerHTML = '';
  
  for (var stat in player_secondary_stats) {
        document.getElementById("stats-secondary").appendChild(createElement( "li", player_secondary_stats[stat] ));
  }
};

let displayPlayerTeamName = function() {
  
  //clear any previous results and display player team name
  document.getElementById("team-name").innerHTML = '';
  document.getElementById("team-name").appendChild(createElement( "h4", player_team_name.toString() ));
};

let displayPlayerTeamList = function() { 
  //clear any previous results 
  document.getElementById("team-list").innerHTML = '';
  
  //display player team list 
  player_team_list.forEach(function(value, i) {
    document.getElementById("team-list")
      .appendChild(createElement( "li", createElement("a", player_team_list[i], ", ", player_team_positions[i])  ))
      .setAttribute('id', player_team_list[i]);
    
    //add a click event listener  
    document.getElementById(player_team_list[i]).addEventListener("click", function(event) {            
      current_player_clicked = event.currentTarget.getAttribute('id').toLowerCase();
      //display that player's data
      updatePlayerStats();
    });
  });
};

let setCompareButton = function() {
  //add event listener for button
  document.getElementById('button-compare').addEventListener('click', function(event) {
    
    compare_player_clicked = current_player_clicked;
  
    //if both slots empty, fill slot A
    if ( (compare_player_a === undefined) && (compare_player_b === undefined) ) {
      //update compare_player_a
      compare_player_a = compare_player_clicked;
      updateCompareStats("a");
    }
    
    //if one slot empty, fill empty slot
    else if ( (compare_player_a === undefined) || (compare_player_b === undefined) ) {
      //update compare_player_b
      compare_player_b = compare_player_clicked
      updateCompareStats("b");
    }

    //if no slots empty, prompt
    else {
      let compare_choice = window.prompt("Options: replace a  |  replace b  |  cancel", "cancel");

      if (compare_choice.toLowerCase() == "replace a" ) {
        //update compare_player_a
        compare_player_a = compare_player_clicked;
        updateCompareStats("a");
      }

      if (compare_choice.toLowerCase() == "replace b" ) {
        //update compare_player_a
        compare_player_b = compare_player_clicked;
        updateCompareStats("b");
      }
    }

  });  
};
 
let updateCompareStats = function(slot) {
  
  if (slot == "a") {
    //update player_a_profile, player_a_main_stats, player_a_sec_stats
    player_a_profile = getPlayerProfile(all_profile_data, compare_player_a)[0];
    player_a_main_stats = getPlayerMainStats(all_stats_data, compare_player_a)[0]; 
    player_a_sec_stats = getPlayerSecondaryStats(all_stats_data, compare_player_a)[0];
  }
  
  if (slot == "b") {
    //update player_b_profile, player_b_main_stats, player_b_sec_stats
    player_b_profile = getPlayerProfile(all_profile_data, compare_player_b)[0];
    player_b_main_stats = getPlayerMainStats(all_stats_data, compare_player_b)[0]; 
    player_b_sec_stats = getPlayerSecondaryStats(all_stats_data, compare_player_b)[0];
  }
  
  displayCompareProfiles();
  displayCompareMainStats();
  displayCompareSecondaryStats();
};

let displayCompareProfiles = function() {

  //clear any previous results and display player a profile
  document.getElementById("profile-data-player-a").innerHTML = '';

  for (let prop in player_a_profile) {
        document.getElementById("profile-data-player-a").appendChild(createElement( "li", player_a_profile[prop] ));
  }

  //clear any previous results and display player b profile
  document.getElementById("profile-data-player-b").innerHTML = '';

  for (let prop in player_b_profile) {
        document.getElementById("profile-data-player-b").appendChild(createElement( "li", player_b_profile[prop] ));
  } 
};

let displayCompareMainStats = function() {
  
  //clear any previous results and display player a profile
  document.getElementById("stats-main-player-a").innerHTML = '';

  for (let stat in player_a_main_stats) {
        document.getElementById("stats-main-player-a").appendChild(createElement( "li", player_a_main_stats[stat] ));
  }

  //clear any previous results and display player b profile
  document.getElementById("stats-main-player-b").innerHTML = '';

  for (let stat in player_b_main_stats) {
        document.getElementById("stats-main-player-b").appendChild(createElement( "li", player_b_main_stats[stat] ));
  }
};

let displayCompareSecondaryStats = function() {
  
  //clear any previous results and display secondary stats of player a
  document.getElementById("secondary-stats-player-a").innerHTML = '';

  for (let stat in player_a_sec_stats) {
        document.getElementById("secondary-stats-player-a").appendChild(createElement( "li", player_a_sec_stats[stat] ));
  }

  //clear any previous results and display secondary stats of player b
  document.getElementById("secondary-stats-player-b").innerHTML = '';

  for (let stat in player_b_sec_stats) {
        document.getElementById("secondary-stats-player-b").appendChild(createElement( "li", player_b_sec_stats[stat] ));
  }
};

//Start the Application
setAllStatsData();


/* -------------------------- Utility functions ---------------------------- */

function createFirstandLastNameArray(data) { 
  return data
    .map(function(entry) { 
      return entry.player.FirstName + " " + entry.player.LastName; 
    });
}

function getPlayerProfile (data, player_clicked) {
  return data
    .filter(function(entry) { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === player_clicked })
    .map(function(entry) { 
      return  { 
                name: (entry.player.FirstName + " " + entry.player.LastName),
                team: (entry.team.City + " " + entry.team.Name),
                jersey: ("Jersey #: " + entry.player.JerseyNumber),
                age: ("age: " + entry.player.Age),
                height: (entry.player.Height + " ft\'in\"" ),
                weight: (entry.player.Weight + " lbs") 
              } 
    });
}

function getPlayerMainStats (data, player_clicked) {
  return data
    .filter(function(entry) { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === player_clicked })
    .map(function(entry) { 
      return  { 
                PtsPerGame: ("PTS/G: " + entry.stats.PtsPerGame["#text"]),
                AstPerGame: ("AST/G: " + entry.stats.AstPerGame["#text"]),
                RebPerGame: ("REB/G: " + entry.stats.RebPerGame["#text"]),
                BlkPerGame: ("BLK/G: " + entry.stats.BlkPerGame["#text"]),
                FoulPersPerGame: ("PF/G: " + entry.stats.FoulPersPerGame["#text"]),
                FgPct: ("FG%: " + entry.stats.FgPct["#text"]),
                FtPct: ("FT%: " + entry.stats.FtPct["#text"]),
                Fg2PtPct: ("2P%: " + entry.stats.Fg2PtPct["#text"]),
                Fg3PtPct: ("3P%: " + entry.stats.Fg3PtPct["#text"]),
                Fg2PtMadePerGame: ("2PM/G: " + entry.stats.Fg2PtMadePerGame["#text"]),
                Fg3PtMadePerGame: ("3PM/G: " + entry.stats.Fg3PtMadePerGame["#text"]),
                PlusMinus: ("+/-: " + entry.stats.PlusMinus["#text"]),
                MinSecondsPerGame: ("MPG: " + entry.stats.MinSecondsPerGame["#text"])
              } 
    });
}
 
function getPlayerSecondaryStats(data, player_clicked) {
  return data
    .filter(function(entry) { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === player_clicked })
    .map(function(entry) { 
      return  { 
                GamesPlayed: ("GP: " + entry.stats.GamesPlayed["#text"]),
                MinSeconds: ("MIN: " + entry.stats.MinSeconds["#text"]),
                Pts: ("PTS: " + entry.stats.Pts["#text"]),
                FgAtt: ("FGA: " + entry.stats.FgAtt["#text"]),
                FgMade: ("FGM: " + entry.stats.FgMade["#text"]),
                Fg2PtMade: ("2PM: " + entry.stats.Fg2PtMade["#text"]),
                Fg2PtAtt: ("2PA: " + entry.stats.Fg2PtAtt["#text"]),
                Fg3PtMade: ("3PM: " + entry.stats.Fg3PtMade["#text"]),
                Fg3PtAtt: ("3PA: " + entry.stats.Fg3PtAtt["#text"]),
                FtAtt: ("FTA: " + entry.stats.FtAtt["#text"]),
                FtMade: ("FTM: " + entry.stats.FtMade["#text"]),
                OffReb: ("OREB: " + entry.stats.OffReb["#text"]),
                DefReb: ("DREB: " + entry.stats.DefReb["#text"]),
                Reb: ("REB: " + entry.stats.Reb["#text"]),
                Ast: ("AST: " + entry.stats.Ast["#text"]),
                Blk: ("BLK: " + entry.stats.Blk["#text"]),
                Stl: ("STL: " + entry.stats.Stl["#text"]),
                Tov: ("TOV: " + entry.stats.Tov["#text"]),
                FoulPers: ("PF: " + entry.stats.FoulPers["#text"])             
              } 
    });
}

function getJSON(url) {
  
  return getRequest(url).then(JSON.parse);
}

function getRequest(url) {
  //Return a new promise
  return new Promise(function(resolve, reject) {
    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    
    //Authorization details go here 
    req.setRequestHeader("Authorization", "Basic " + btoa("jaellen:adanaC4032"));

    req.onload = function() {
      //Check the status
      if (req.status === 200) {
        resolve(req.response);
      }
      else {
        reject(Error(req.statusText));
      }
    };
    //Handle network errors
    req.onerror = function() {
      reject(Error("Network Error"))
    };
    //Make the request
    req.send();
  });
}

function createElement(type){
  var node = document.createElement(type);
  for (var i = 1; i < arguments.length; i++) {
    var child = arguments[i];
    if (typeof child == "string") {
      child = document.createTextNode(child);
    }
    node.appendChild(child);
  }
  return node;
} 
