"use strict";

/* ----------------------- Module Dependencies ----------------------------- */

var Promise = require('promise');
var Observable = require('rxjs/Observable').Observable;
  require('rxjs/add/operator/map');
  require('rxjs/add/operator/concatAll');
  require('rxjs/add/operator/filter');
  require('rxjs/add/operator/reduce');
  require('rxjs/add/operator/zip');
var searchIndex = require('./js/components/data-service.js');

//For testing 
var chai = require('chai');
var assert = chai.assert;

/* ------------------------------ Logic ------------------------------------ */

/* Program Steps:
1. XMLHttpRequest for Stats Data and AutoComplete Search Functionality  
  a) GET request for cumulative player stats data 
  b) Create an array of all players' first and last names for search recommendations
  c) Use array to recommend and display search results from user's search input   
  d) When user selects from search results, 
    - GET Request for player's profile stats
    - Display that players' relevant data from both GET requests    
*/

//1. XMLHttpRequest for Stats Data and AutoComplete Search Functionality

//Declare global variables
var cumulative_player_data;
var profile_data;
var current_player_clicked; 

// 1.a) GET request for cumulative player stats data
getJSON('https://www.mysportsfeeds.com/api/feed/pull/nba/2015-2016-regular/cumulative_player_stats.json?')
.then( function(response) {
  
  cumulative_player_data = response;

  //1.b) Create an array of all players' first and last names for search recommendations 
  var firstandLastNameArray = createFirstandLastNameArray(cumulative_player_data);

  //pass on this array to .then
  return firstandLastNameArray; 
})
.then( function(firstandLastNameArray) {
    
  var input = document.getElementById("searchBox")
  var ul = document.getElementById("searchResults")
  var inputTerms, termsArray, prefix, terms, results, sortedResults;

  //1.c) Use array to recommend and display search results from user's search input    
  var search = function() {
    inputTerms = input.value.toLowerCase();
    results = [];
    termsArray = inputTerms.split(' ');
    prefix = termsArray.length === 1 ? '' : termsArray.slice(0, -1).join(' ') + ' ';
    terms = termsArray[termsArray.length -1].toLowerCase();

    for (var i = 0; i < firstandLastNameArray.length; i++) {
      var a = firstandLastNameArray[i].toLowerCase(),
          t = a.indexOf(terms);
      if (t > -1) {
        results.push(a);
      }
    }
     evaluateResults();
  };
    
  var sortResults = function(a,b) {
    if (a.indexOf(terms) < b.indexOf(terms)) return -1;
    if (a.indexOf(terms) > b.indexOf(terms)) return 1;
    return 0;
  }

  var evaluateResults = function() {
    if (results.length > 0 && inputTerms.length > 0 && terms.length !== 0) {
      sortedResults = results.sort(sortResults);
      appendResults();
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

  //display recommendations
  var appendResults = function () {
  
    clearResults();

    //Note: A maximum of 5 recommendations set here 
    for (var i = 0; i < sortedResults.length && i < 5; i++) {
       
      var li = document.createElement("li");
      var a = document.createElement("a");

      //Set an attribute and click event listener to each recommendation result 
      a.setAttribute('id', i.toString());
      a.addEventListener("click", function(event) {
              
        //retrieve the name of the player clicked
        current_player_clicked = sortedResults[event.currentTarget.getAttribute('id')];

        //display that player's data
        displayStats();
        //displayCarousel();
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

  var clearResults = function() {
    ul.className = "term-list hidden";
    ul.innerHTML = '';
  };

  input.addEventListener("keyup", search, false);
});

var displayStats = function() {

  //Clear any current results
  document.getElementById("profile").innerHTML = '';
  document.getElementById("stats-main").innerHTML = '';
  document.getElementById("stats-secondary").innerHTML = '';

  //1.d) GET Request for player's profile stats
  getJSON('https://www.mysportsfeeds.com/api/feed/pull/nba/2015-2016-regular/active_players.json')
  .then( function(response) {

    profile_data = response;    
    
    var profile_array = getPlayerProfile(profile_data, current_player_clicked)[0];

    for (var prop in profile_array) {
      document.getElementById("profile").appendChild(createElement( "li", profile_array[prop] ));
    }
  })
  .then( function() {
    
    var main_stats_array = getPlayerMainStats(cumulative_player_data, current_player_clicked)[0];  
    var secondary_stats_array = getPlayerSecondaryStats(cumulative_player_data, current_player_clicked)[0];

    for (var main_stat in main_stats_array) {
      document.getElementById("stats-main").appendChild(createElement( "li", main_stats_array[main_stat] ));
    }

    for (var secondary_stat in secondary_stats_array) {
      document.getElementById("stats-secondary").appendChild(createElement( "li", secondary_stats_array[secondary_stat] ));
    }
  });
};


/*var displayCarousel = function() {
  
  //Clear any previous results 
  document.getElementById("team").innerHTML = '';
  document.getElementById("team-list").innerHTML = '';

  //Extract the city and team name from the current player clicked and display
  var team = stats_array.
              filter(function(entry) { 
                return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === current_player_clicked 
              }).
              map(function(entry) {
                return entry.team.City + " " + entry.team.Name
              });
  document.getElementById("team").appendChild(createElement( "h3", team.toString() ));

  //Extract the team list from the data and display 
  var team_list = stats_array.
                    filter(function(entry) { 
                      return (entry.team.City + " " + entry.team.Name) === team.toString() 
                    }).
                    map(function(entry) {
                      return entry.player.FirstName + " " + entry.player.LastName 
                    });
  var team_position = stats_array.
                    filter(function(entry) { 
                      return (entry.team.City + " " + entry.team.Name) === team.toString() 
                    }).
                    map(function(entry) {
                      return entry.player.Position
                    });
  
  //Display the team players with their positions
  team_list.forEach(function(value, i) {
    document.getElementById("team-list").
      appendChild(createElement( "li", createElement("a", team_list[i], ", ", team_position[i])  )).
      setAttribute('id', team_list[i]);
    
    //Add a click event listener for each player that will display the newly clicked player's stats    
    document.getElementById(team_list[i]).addEventListener("click", function(event) {       
      //retrieve the name of the player clicked
       current_player_clicked = event.currentTarget.getAttribute('id');
      
      //display that player's data
      //displayNewStats();
      //displayCarousel();
    });
  })
};*/

/* -------------------------- Utility functions ---------------------------- */

function getPlayerProfile (data, player_clicked) {

  return data.activeplayers.playerentry.
    filter(function(entry) { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === player_clicked }).
    map(function(entry) { 
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
  return data.cumulativeplayerstats.playerstatsentry.
    filter(function(entry) { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === player_clicked }).
    map(function(entry) { 
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
  return data.cumulativeplayerstats.playerstatsentry.
    filter(function(entry) { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === player_clicked }).
    map(function(entry) { 
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

function createFirstandLastNameArray(data) { 
  return data.cumulativeplayerstats.playerstatsentry.
    map(function(entry) { return entry.player.FirstName + " " + entry.player.LastName; });
}

function getJSON(url) {
  return get(url).then(JSON.parse);
}

function get(url) {
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

/* -------------------------- Test and Assertions -------------------------- */


