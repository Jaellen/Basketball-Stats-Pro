"use strict";

/* ----------------------- Module Dependencies ----------------------------- */

var Rx = require('rx');
var xhrRequest = require('superagent'); 

//For testing 
//var chai = require('chai');
//var assert = chai.assert;

//to add another module:
//var x  = require('./js/components/...');

/* -------------------------- Program Logic -------------------------------- */

const cumulative_player_data_url = 'https://www.mysportsfeeds.com/api/feed/pull/nba/2015-2016-regular/cumulative_player_stats.json?';
const profile_data_url = 'https://www.mysportsfeeds.com/api/feed/pull/nba/2015-2016-regular/active_players.json';
let cumulative_player_data, profile_data, current_player_clicked;


let getCumulativePlayerData = Rx.Observable.create((observer) => {
  xhrRequest
   .get(cumulative_player_data_url)
   .auth('jaellen', 'adanaC4032')
   .end(function(err, res) {
      if (err) {
        return observer.onError(err);
      }
      let data = JSON.parse(res.text);
      cumulative_player_data = data.cumulativeplayerstats.playerstatsentry;
      
      observer.onNext(cumulative_player_data);
   });
   return () => {
   };
});

getCumulativePlayerData
.take(1)
.subscribe({
  onNext: (cumulative_player_data) => {   
    let firstandLastNameArray = createFirstandLastNameArray(cumulative_player_data);  
    let input = document.getElementById("searchBox")
    let ul = document.getElementById("searchResults")
    let sortedResults, prefix, inputTerms, termsArray, terms, results;

    let search = function() {
      
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

        //Set an attribute and click event listener to each recommendation result 
        a.setAttribute('id', i.toString());
        a.addEventListener("click", function(event) {
          //retrieve the name of the player clicked
          current_player_clicked = sortedResults[event.currentTarget.getAttribute('id')];

          //display that player's data
          displayStats();
          //displayCarousel();
        });


        //a.addEventListener("click", function(event) {
                
          //retrieve the name of the player clicked
          //current_player_clicked = sortedResults[event.currentTarget.getAttribute('id')];

          //display that player's data
          //displayStats();
          //displayCarousel();
        //});
     
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
  },
  onError: (error) => {
    console.error("Error in XMLHttpRequest");
  },
  onCompleted: () => {
  }, 
});

let displayStats = function() {

  //Clear any current results
  document.getElementById("profile").innerHTML = '';
  document.getElementById("stats-main").innerHTML = '';
  document.getElementById("stats-secondary").innerHTML = '';

  //1.d) GET Request for player's profile stats
  let getProfileData = Rx.Observable.create((observer) => {
    xhrRequest
     .get(profile_data_url)
     .auth('jaellen', 'adanaC4032')
     .end(function(err, res) {
        if (err) {
          return observer.onError(err);
        }
        let data = JSON.parse(res.text);
        profile_data = data.activeplayers.playerentry;
        
        observer.onNext(profile_data);
     });
     return () => {};
  });

  getProfileData
  .take(1)
  .subscribe({
    onNext: (profile_data) => {
      let profile_array = getPlayerProfile(profile_data, current_player_clicked)[0];
      let main_stats_array = getPlayerMainStats(cumulative_player_data, current_player_clicked)[0];  
      let secondary_stats_array = getPlayerSecondaryStats(cumulative_player_data, current_player_clicked)[0];

      for (var prop in profile_array) {
        document.getElementById("profile").appendChild(createElement( "li", profile_array[prop] ));
      }
      for (var main_stat in main_stats_array) {
        document.getElementById("stats-main").appendChild(createElement( "li", main_stats_array[main_stat] ));
      }
      for (var secondary_stat in secondary_stats_array) {
        document.getElementById("stats-secondary").appendChild(createElement( "li", secondary_stats_array[secondary_stat] ));
      }
      displayCarousel();
    },
    onError: (error) => {
      console.error("Error in XMLHttpRequest");
    },
    onCompleted: () => {
    },
  });
};

var displayCarousel = function() {
  
  let team, team_list, team_position;

  //Clear any previous results 
  document.getElementById("team").innerHTML = '';
  document.getElementById("team-list").innerHTML = '';

  //Extract the city and team name from the current player clicked and display
  team = cumulative_player_data
            .filter(function(entry) { 
              return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === current_player_clicked })
            .map(function(entry) { 
              return entry.team.City + " " + entry.team.Name });
  
  document.getElementById("team").appendChild(createElement( "h3", team.toString() ));

  //Extract the team list from the data and display 
  team_list = cumulative_player_data
                .filter(function(entry) { 
                  return (entry.team.City + " " + entry.team.Name) === team.toString() })
                .map(function(entry) {
                  return entry.player.FirstName + " " + entry.player.LastName });

  team_position = cumulative_player_data
                    .filter(function(entry) { 
                      return (entry.team.City + " " + entry.team.Name) === team.toString() })
                    .map(function(entry) {
                      return entry.player.Position });
  
  //Display the team players with their positions
  team_list.forEach(function(value, i) {
    document.getElementById("team-list")
      .appendChild(createElement( "li", createElement("a", team_list[i], ", ", team_position[i])  ))
      .setAttribute('id', team_list[i]);
    
    //Add a click event listener for each player that will display the newly clicked player's stats    
    //document.getElementById(team_list[i]).addEventListener("click", function(event) {       
      //retrieve the name of the player clicked
      // current_player_clicked = event.currentTarget.getAttribute('id');
      
      //display that player's data
      //displayStats();
      //displayCarousel();
    //});
  });
};


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
