"use strict";

/* ----------------------- Module Dependencies ----------------------------- */

var Rx = require('rx');
var xhrRequest = require('superagent'); 
require("./css/main.css");

//For testing 
//var chai = require('chai');
//var assert = chai.assert;

//to add another module:
//var x  = require('./js/components/...');

/* ------------------------- Global Variables ------------------------------ */


//urls 
const STATS_2016_2017 = 'https://www.mysportsfeeds.com/api/feed/pull/nba/2016-2017-regular/cumulative_player_stats.json?'
const PROFILE_2016_2017 = 'https://www.mysportsfeeds.com/api/feed/pull/nba/2016-2017-regular/active_players.json'; 
const STATS_2015_2016 = 'https://www.mysportsfeeds.com/api/feed/pull/nba/2015-2016-regular/cumulative_player_stats.json?'
const PROFILE_2015_2016 = 'https://www.mysportsfeeds.com/api/feed/pull/nba/2015-2016-regular/active_players.json'; 

//main stats variables
let cumulative_player_data_url = STATS_2016_2017;
let profile_data_url = PROFILE_2016_2017;
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

//favourites variables
let save_player_list = [];
let save_player_profile = {}; 
let save_player_clicked;

//rankings variables
let rankings_data_table_a;
let rankings_data_table_b;
let rankings_data_table_c;
let rankings_data_table_d;
let table_a;
let table_b; 
let table_c;
let table_d;

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

//Navbar functionality
let setNavBar = function() {

  //set navbar
  //stats
  document.getElementById('nav-stats').addEventListener('click', function() {
    activateNav("a");
  }, false);

  //compare
  document.getElementById('nav-compare').addEventListener('click', function() {
    activateNav("b");
  }, false);
  
  //favourites
  document.getElementById('nav-favourites').addEventListener('click', function() {
    activateNav("c");
  }, false); 

  //rankings 
  document.getElementById('nav-rankings').addEventListener('click', function() {
    activateNav("d");
  }, false);
};

//Search recommendations and Select Player Functionality
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
      setRankingsTables();
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
                      .filter(function(entry) { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
                      .filter(function(entry) { 
                        return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === current_player_clicked })
                      .map(function(entry) { 
                        return entry.team.City + " " + entry.team.Name });

  player_team_list = all_stats_data
                      .filter(function(entry) { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
                      .filter(function(entry) { 
                        return (entry.team.City + " " + entry.team.Name) === player_team_name.toString() })
                      .filter(function(entry) {
                        return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() !== current_player_clicked }) //remove repeat
                      .map(function(entry) {
                        return entry.player.FirstName + " " + entry.player.LastName });

  player_team_positions = all_stats_data
                    .filter(function(entry) { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
                    .filter(function(entry) { 
                      return (entry.team.City + " " + entry.team.Name) === player_team_name.toString() })
                    .filter(function(entry) {
                      return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() !== current_player_clicked }) //remove repeat
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

  for (let prop in player_profile) {
        document.getElementById("profile").appendChild(createElement( "li", player_profile[prop] ));
  }
};

let displayPlayerMainStats = function() {
  
  //clear any previous results and display player's main stats
  document.getElementById("stats-main").innerHTML = '';

  for (let stat in player_main_stats) {
        document.getElementById("stats-main").appendChild(createElement( "li", player_main_stats[stat] ));
  }
};

let displayPlayerSecondaryStats = function() {
  
  //clear any previous results and display player's secondary stats 
  document.getElementById("stats-secondary").innerHTML = '';
  
  for (let stat in player_secondary_stats) {
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


//Compare Player Functionality
let setComparePlayer = function() {

  let setComparePlayerButton = function() {

    //case: if no player is clicked as of yet
    if (current_player_clicked === undefined) {
      return;
    }

    //case: if player clicked is already in compare slot a 
    if (current_player_clicked == compare_player_a) {
      alert("This player is already in compare slot a");
      return;    
    }

    //case: if player clicked is already in compare slot b 
    if (current_player_clicked == compare_player_b) {
      alert("This player is already in compare slot b");
      return;    
    }

    compare_player_clicked = current_player_clicked;
      
    //case: if both slots empty, fill slot A
    if ( (compare_player_a === undefined) && (compare_player_b === undefined) ) {
      //update compare_player_a
      compare_player_a = compare_player_clicked;
      updateCompareStats("a");
      alert("Added player to slot A");
    }
    
    //case: if one slot empty, fill empty slot
    else if ( (compare_player_a === undefined) || (compare_player_b === undefined) ) {
      //update compare_player_b
      compare_player_b = compare_player_clicked
      updateCompareStats("b");
      alert("Added player to slot B");
    }

    //case: if no slots empty, ask user which slot to replace or neither
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
  };  

  //add event listener for button
  document.getElementById('button-compare').addEventListener('click', setComparePlayerButton, false); 
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


//Save Player Functionality
let setSavePlayerList = function() {
  
  //set save player button (main page)
  let setAddPlayer = function() {
    
    //case: if no player is clicked as of yet
    if (current_player_clicked === undefined) {
      return;
    }

    //test if player being saved is already saved
    if ( isSavePlayerRepeated() === true ) {
      alert("You already have this player saved"); 
    }
    
    if ( isSavePlayerRepeated() === false ) {
      updateSavePlayerList("add");
      alert(current_player_clicked + " has been added to favourites list!");
    } 
  };

  //add event listener for button
  document.getElementById('button-save-player').addEventListener('click', setAddPlayer, false);

  //set remove player button (favourites page)
};

let updateSavePlayerList = function(AddOrRemove, index) {
  
  //add player to list
  if (AddOrRemove == "add") {
    save_player_clicked = current_player_clicked;
    save_player_profile = getSavePlayerProfile(all_profile_data, save_player_clicked)[0];
    save_player_list.push(save_player_profile);
  } 

  //remove player from list
  if (AddOrRemove == "remove") {
    save_player_list.splice(index, 1);
  }

  //update the save player list
  displaySavePlayerList();
};

let displaySavePlayerList = function() {
  document.getElementById("favourites").innerHTML = '';

  //go through each player in the save player list and display their properties
  save_player_list.forEach( (player, i) => {   
    
    for (let prop in player) {
      document.getElementById("favourites").appendChild(createElement( "li", player[prop] ));
    }
    //add a button to remove player from list
    let button = document.getElementById("favourites").appendChild(createElement( "button", "remove" ));
    
    //add an id to identify each player in list 
    let identifier = ("button" + i);
    let attr = { id: identifier };
    setAttributes(button, attr);

    //add event listener for button
    document.getElementById(identifier).addEventListener('click', function() {
      updateSavePlayerList("remove", i);    
    });
    
    //add a space between player profiles
    document.getElementById("favourites").appendChild(createElement( "br" ));
    document.getElementById("favourites").appendChild(createElement( "br" ));
  });
};


//Rankings Page Functionality
let setRankingsTables = function() {

  table_a = createRankingsTable(rankings_data_table_a, all_stats_data, "a");
  table_b = createRankingsTable(rankings_data_table_b, all_stats_data, "b");
  table_c = createRankingsTable(rankings_data_table_c, all_stats_data, "c");
  table_d = createRankingsTable(rankings_data_table_d, all_stats_data, "d");

  //display the sorted table
  displayRankings();
};

let displayRankings = function() {
   
  //clear any previous tables in the case of changing season option
  document.getElementById("table-pts-g").innerHTML = '';
  document.getElementById("table-ast-g").innerHTML = '';
  document.getElementById("table-reb-g").innerHTML = '';
  document.getElementById("table-blk-g").innerHTML = '';

  //display tables
  displayTable(table_a, "table-pts-g", "table-a");
  displayTable(table_b, "table-ast-g", "table-b");
  displayTable(table_c, "table-reb-g", "table-c");
  displayTable(table_d, "table-blk-g", "table-d");

  //activate click event listeners
  setRankingsButtons();
};

let setRankingsButtons = function() {
  
  //when button is clicked, show the corresponding table
  document.getElementById('button-pts-g').addEventListener('click', function() {
    activateTable("a");
  }, false);

  document.getElementById('button-ast-g').addEventListener('click', function() {
    activateTable("b");
  }, false);
  
  document.getElementById('button-reb-g').addEventListener('click', function() {
    activateTable("c");
  }, false); 

  document.getElementById('button-blk-g').addEventListener('click', function() {
    activateTable("d");
  }, false);

  setChangeSeason();
};

let setChangeSeason = function() {

  //change season to 2015/2016
  document.getElementById('seasonA').addEventListener('click', function() {
    
    //case: clicked season is already selected
    if (cumulative_player_data_url === STATS_2016_2017) {
      return;
    }

    //change source data  
    setSeason("a");

    //reset main page stats and ranking tables 
    setAllStatsData();

    //case: if stats already being displayed, reset those
    if (current_player_clicked !== undefined) {
      updatePlayerStats();
    }

  }, false);

  //change season to 2016/2017
  document.getElementById('seasonB').addEventListener('click', function() {

    //case: clicked season is already selected
    // if (cumulative_player_data_url === STATS_2015_2016) {
    //   return;
    // }
    
    //change source data  
    setSeason("b");

    //reset main page stats and ranking tables 
    setAllStatsData();

    //case: if stats already being displayed, reset those
    // if (current_player_clicked !== undefined) {
    //   updatePlayerStats();
    // }

  }, false);
};

//Start the Application
setNavBar();
setAllStatsData();
setComparePlayer();
setSavePlayerList();

/* -------------------- Utility and Helper functions ----------------------- */

//DOM utilities
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

function createElement(type) {
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

function setAttributes(el, attrs) {
  // for multiple attributes, send attrs in the form of { attr: value, attr: value... }
  for(var key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
}

function addClass(el, className) {
    if (el.classList) el.classList.add(className);
    else if (!hasClass(el, className)) el.className += ' ' + className;
}

function removeClass(el, className) {
    if (el.classList) el.classList.remove(className);
    else el.className = el.className.replace(new RegExp('\\b'+ className+'\\b', 'g'), '');
}

function hasClass(el, className) {
    
    return el.classList ? el.classList.contains(className) : new RegExp('\\b'+ className+'\\b').test(el.className);
}

//navbar utilities 
function activateNav(option) {
  let navA = document.getElementById("stats-page");
  let navB = document.getElementById("compare-page");
  let navC = document.getElementById("favourites-page");
  let navD = document.getElementById("rankings-page");

  if (option == "a") {
    removeClass(navA, "hidden");
    addClass(navB, "hidden");
    addClass(navC, "hidden");
    addClass(navD, "hidden");
  }

  if (option == "b") {
    addClass(navA, "hidden");
    removeClass(navB, "hidden");
    addClass(navC, "hidden");
    addClass(navD, "hidden");
  } 
  
  if (option == "c") {
    addClass(navA, "hidden");
    addClass(navB, "hidden");
    removeClass(navC, "hidden");
    addClass(navD, "hidden");
  }

  if (option == "d") {
    addClass(navA, "hidden");
    addClass(navB, "hidden");
    addClass(navC, "hidden");
    removeClass(navD, "hidden");
  }
}

//'stats' and 'compare' utilities
function createFirstandLastNameArray(data) { 
  return data
    .filter(function(entry) { return (entry.stats.PtsPerGame !== undefined) }) //This is to filter out undefined stats in the data set
    .map(function(entry) { 
      return entry.player.FirstName + " " + entry.player.LastName; 
    });
}

function getPlayerProfile(data, player_clicked) {
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

function getSavePlayerProfile(data, player_clicked) {
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

function getPlayerMainStats(data, player_clicked) {
  return data
    .filter(function(entry) { return (entry.stats.PtsPerGame !== undefined) }) //This is to filter out undefined stats in the data set
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
    .filter(function(entry) { return (entry.stats.PtsPerGame !== undefined) }) //This is to filter out undefined stats in the data set
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

//'favourites' utilities
function isSavePlayerRepeated() {
  let test_array = save_player_list
                     .map(function(element) {
                       return element.name.toLowerCase();
                     })
                     .filter(function(element){
                       return element == current_player_clicked.toLowerCase();
                     });

  if (test_array.length > 0) { return true }
  else { return false }
}

//'rankings' utilities
function createRankingsTable(table, data, option) {
  
  //Table A: PTS/G 
  if (option === "a") {
    
    //filter the data
    table = getAllRankingsDataTableA(data);

    //sort the data  
    table.sort(function (a, b) {
      if ( Number(a.PtsPerGame) > Number(b.PtsPerGame) ) {
        return -1;
      }
      if ( Number(a.PtsPerGame) < Number(b.PtsPerGame) ) {
        return 1;
      }
      return 0;
    });
  }

  //Table B: AST/G 
  if (option === "b") {
    
    //filter the data
    table = getAllRankingsDataTableB(data);

    //sort the data 
    table.sort(function (a, b) {
      if ( Number(a.AstPerGame) > Number(b.AstPerGame) ) {
        return -1;
      }
      if ( Number(a.AstPerGame) < Number(b.AstPerGame) ) {
        return 1;
      }
      return 0;
    });
  }

  //Table C: REB/G 
  if (option === "c") {
    
    //filter the data
    table = getAllRankingsDataTableC(data);

    //sort the data
    table.sort(function (a, b) {
      if ( Number(a.RebPerGame) > Number(b.RebPerGame) ) {
        return -1;
      }
      if ( Number(a.RebPerGame) < Number(b.RebPerGame) ) {
        return 1;
      }
      return 0;
    });
  }

  //Table D: BLK/G 
  if (option === "d") {
    
    //filter all the stats data for the rankings
    table = getAllRankingsDataTableD(data);

    //sort the data
    table.sort(function (a, b) {
      if ( Number(a.BlkPerGame) > Number(b.BlkPerGame) ) {
        return -1;
      }
      if ( Number(a.BlkPerGame) < Number(b.BlkPerGame) ) {
        return 1;
      }
      return 0;
    });
  }
 
  //cut the table down to top 20
  table = table.slice(0, 20);

  return table;
}

function getAllRankingsDataTableA(data) {
  
  return data
          .filter(function(entry) { return (entry.stats.PtsPerGame !== undefined) }) //This is to filter out undefined stats in the data set
          .map(function(entry)  { 
            return  { 
              Player: (entry.player.FirstName + " " + entry.player.LastName),
              PtsPerGame: (entry.stats.PtsPerGame["#text"]),
              GamesPlayed: (entry.stats.GamesPlayed["#text"]),
              MinSeconds: (entry.stats.MinSeconds["#text"]),
              Pts: (entry.stats.Pts["#text"]),
              FgAtt: (entry.stats.FgAtt["#text"]),
              FgMade: (entry.stats.FgMade["#text"]),
              Fg2PtMade: (entry.stats.Fg2PtMade["#text"]),
              Fg2PtAtt: (entry.stats.Fg2PtAtt["#text"]),
              Fg3PtMade: (entry.stats.Fg3PtMade["#text"]),
              Fg3PtAtt: (entry.stats.Fg3PtAtt["#text"]),
              FtAtt: (entry.stats.FtAtt["#text"]),
              FtMade: (entry.stats.FtMade["#text"]),
              OffReb: (entry.stats.OffReb["#text"]),
              DefReb: (entry.stats.DefReb["#text"]),
              Reb: (entry.stats.Reb["#text"]),
              Ast: (entry.stats.Ast["#text"]),
              Blk: (entry.stats.Blk["#text"]),
              Stl: (entry.stats.Stl["#text"]),
              Tov: (entry.stats.Tov["#text"]),
              FoulPers: (entry.stats.FoulPers["#text"])             
            } 
          });
}

function getAllRankingsDataTableB(data) {
  
  return data
          .filter(function(entry) { return (entry.stats.PtsPerGame !== undefined) }) //This is to filter out undefined stats in the data set
          .map(function(entry) { 
            return  { 
              Player: (entry.player.FirstName + " " + entry.player.LastName),
              AstPerGame: (entry.stats.AstPerGame["#text"]),
              GamesPlayed: (entry.stats.GamesPlayed["#text"]),
              MinSeconds: (entry.stats.MinSeconds["#text"]),
              Pts: (entry.stats.Pts["#text"]),
              FgAtt: (entry.stats.FgAtt["#text"]),
              FgMade: (entry.stats.FgMade["#text"]),
              Fg2PtMade: (entry.stats.Fg2PtMade["#text"]),
              Fg2PtAtt: (entry.stats.Fg2PtAtt["#text"]),
              Fg3PtMade: (entry.stats.Fg3PtMade["#text"]),
              Fg3PtAtt: (entry.stats.Fg3PtAtt["#text"]),
              FtAtt: (entry.stats.FtAtt["#text"]),
              FtMade: (entry.stats.FtMade["#text"]),
              OffReb: (entry.stats.OffReb["#text"]),
              DefReb: (entry.stats.DefReb["#text"]),
              Reb: (entry.stats.Reb["#text"]),
              Ast: (entry.stats.Ast["#text"]),
              Blk: (entry.stats.Blk["#text"]),
              Stl: (entry.stats.Stl["#text"]),
              Tov: (entry.stats.Tov["#text"]),
              FoulPers: (entry.stats.FoulPers["#text"])             
            } 
          });
}

function getAllRankingsDataTableC(data) {
  
  return data
          .filter(function(entry) { return (entry.stats.PtsPerGame !== undefined) }) //This is to filter out undefined stats in the data set
          .map(function(entry) { 
            return  { 
              Player: (entry.player.FirstName + " " + entry.player.LastName),
              RebPerGame: (entry.stats.RebPerGame["#text"]),
              GamesPlayed: (entry.stats.GamesPlayed["#text"]),
              MinSeconds: (entry.stats.MinSeconds["#text"]),
              Pts: (entry.stats.Pts["#text"]),
              FgAtt: (entry.stats.FgAtt["#text"]),
              FgMade: (entry.stats.FgMade["#text"]),
              Fg2PtMade: (entry.stats.Fg2PtMade["#text"]),
              Fg2PtAtt: (entry.stats.Fg2PtAtt["#text"]),
              Fg3PtMade: (entry.stats.Fg3PtMade["#text"]),
              Fg3PtAtt: (entry.stats.Fg3PtAtt["#text"]),
              FtAtt: (entry.stats.FtAtt["#text"]),
              FtMade: (entry.stats.FtMade["#text"]),
              OffReb: (entry.stats.OffReb["#text"]),
              DefReb: (entry.stats.DefReb["#text"]),
              Reb: (entry.stats.Reb["#text"]),
              Ast: (entry.stats.Ast["#text"]),
              Blk: (entry.stats.Blk["#text"]),
              Stl: (entry.stats.Stl["#text"]),
              Tov: (entry.stats.Tov["#text"]),
              FoulPers: (entry.stats.FoulPers["#text"])             
            } 
          });
}

function getAllRankingsDataTableD(data) {
  
  return data
          .filter(function(entry) { return (entry.stats.PtsPerGame !== undefined) }) //This is to filter out undefined stats in the data set
          .map(function(entry) { 
            return  { 
              Player: (entry.player.FirstName + " " + entry.player.LastName),
              BlkPerGame: (entry.stats.BlkPerGame["#text"]),
              GamesPlayed: (entry.stats.GamesPlayed["#text"]),
              MinSeconds: (entry.stats.MinSeconds["#text"]),
              Pts: (entry.stats.Pts["#text"]),
              FgAtt: (entry.stats.FgAtt["#text"]),
              FgMade: (entry.stats.FgMade["#text"]),
              Fg2PtMade: (entry.stats.Fg2PtMade["#text"]),
              Fg2PtAtt: (entry.stats.Fg2PtAtt["#text"]),
              Fg3PtMade: (entry.stats.Fg3PtMade["#text"]),
              Fg3PtAtt: (entry.stats.Fg3PtAtt["#text"]),
              FtAtt: (entry.stats.FtAtt["#text"]),
              FtMade: (entry.stats.FtMade["#text"]),
              OffReb: (entry.stats.OffReb["#text"]),
              DefReb: (entry.stats.DefReb["#text"]),
              Reb: (entry.stats.Reb["#text"]),
              Ast: (entry.stats.Ast["#text"]),
              Blk: (entry.stats.Blk["#text"]),
              Stl: (entry.stats.Stl["#text"]),
              Tov: (entry.stats.Tov["#text"]),
              FoulPers: (entry.stats.FoulPers["#text"])             
            } 
          });
}

function displayTable(table, tableId, rowId) {
  
  //set the table header for column three  
  let rank_header = "";

  if (tableId === "table-pts-g") {
    rank_header = "PTS/G";
  }

  if (tableId === "table-ast-g") {
    rank_header = "AST/G";
  }

  if (tableId === "table-reb-g") {
    rank_header = "REB/G";
  }

  if (tableId === "table-blk-g") {
    rank_header = "BLK/G";
  }

  //add table headers 
  document.getElementById(tableId).appendChild(
    createElement("tr",
      createElement("th", "Rank"),
      createElement("th", "Player"),
      createElement("th", rank_header),
      createElement("th", "GP"),
      createElement("th", "MIN"),
      createElement("th", "PTS"),
      createElement("th", "FGA"),
      createElement("th", "FGM"),
      createElement("th", "2PM"),
      createElement("th", "2PA"),
      createElement("th", "3PM"),
      createElement("th", "3PA"),
      createElement("th", "FTA"),
      createElement("th", "FTM"),
      createElement("th", "OREB"),
      createElement("th", "DREB"),
      createElement("th", "REB"),
      createElement("th", "AST"),
      createElement("th", "BLK"),
      createElement("th", "STL"),
      createElement("th", "TOV"),
      createElement("th", "PF")
    ));

  table.forEach( function(player, i) {   
    
    //for each player, create a row and add it to the appropriate table
    let row = document.getElementById(tableId).appendChild(createElement("tr"));
      
    //give each row an id of "row"+i where i is the index of the ranked list
    setAttributes(row, { id: (rowId + i) });

    //add the ranking position to that row
    document.getElementById(rowId + i).appendChild(createElement( "td", (i + 1).toString() ));

    //for each row, loop through all the properties and create a cell for each stat
    for (let stat in player) {
      document.getElementById(rowId + i).appendChild(createElement( "td", player[stat] ));
    }
  });
}

function activateTable(option) {
  let tableA = document.getElementById("section-table-a");
  let tableB = document.getElementById("section-table-b");
  let tableC = document.getElementById("section-table-c");
  let tableD = document.getElementById("section-table-d");

  if (option == "a") {
    removeClass(tableA, "hidden");
    addClass(tableB, "hidden");
    addClass(tableC, "hidden");
    addClass(tableD, "hidden");
  }

  if (option == "b") {
    addClass(tableA, "hidden");
    removeClass(tableB, "hidden");
    addClass(tableC, "hidden");
    addClass(tableD, "hidden");
  } 
  
  if (option == "c") {
    addClass(tableA, "hidden");
    addClass(tableB, "hidden");
    removeClass(tableC, "hidden");
    addClass(tableD, "hidden");
  }

  if (option == "d") {
    addClass(tableA, "hidden");
    addClass(tableB, "hidden");
    addClass(tableC, "hidden");
    removeClass(tableD, "hidden");
  }
}

function setSeason(option) {
  if (option == "a") {
    cumulative_player_data_url = STATS_2016_2017;
    profile_data_url = PROFILE_2016_2017;
  }

  if (option == "b") {
    cumulative_player_data_url = STATS_2015_2016;
    profile_data_url = PROFILE_2015_2016;
  }
}


