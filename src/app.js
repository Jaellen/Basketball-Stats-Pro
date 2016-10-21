"use strict";

/* ----------------------- Module Dependencies ----------------------------- */

var Promise = require('promise');
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
var stats_array;
var profile_array;
var current_player_clicked; 

// 1.a) GET request for cumulative player stats data
getJSON('https://www.mysportsfeeds.com/api/feed/pull/nba/2015-2016-regular/cumulative_player_stats.json?')
.then( function(response) {

  //Set the global variable to the array needed from the JSON object   
  stats_array = response.cumulativeplayerstats.playerstatsentry;

  //1.b) Create an array of all players' first and last names for search recommendations 
  var createFirstandLastNameArray = function () {
    var array = [];
    for (var i = 0; i < stats_array.length; i++) {
      array[i] = stats_array[i].player.FirstName + " " + stats_array[i].player.LastName;
    }
    return array;
  };
  
  var activePlayers = createFirstandLastNameArray();
  return activePlayers;
})
.then( function(activePlayers) {
    
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

    for (var i = 0; i < activePlayers.length; i++) {
      var a = activePlayers[i].toLowerCase(),
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
        var player_clicked = sortedResults[event.currentTarget.getAttribute('id')];
        current_player_clicked = sortedResults[event.currentTarget.getAttribute('id')];

        // display that player's data
        playerClickedEvent(player_clicked);
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

var playerClickedEvent = function(player) {

  var index = findPlayerClickedIndex(stats_array, player); 
  console.log(stats_array[index].team.City);

  //1.d) GET Request for player's profile stats
  getJSON('https://www.mysportsfeeds.com/api/feed/pull/nba/2015-2016-regular/active_players.json')
  .then( function(response) {

    profile_array = response.activeplayers.playerentry;
    
    // 1.d) Display that players' relevant data from both GET requests 
    console.log(current_player_clicked);
    var a_index = findPlayerClickedIndex(profile_array, current_player_clicked);
    
    console.log(profile_array[a_index].player.Height);
  });
};


/* -------------------------- Utility functions ---------------------------- */

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

function findPlayerClickedIndex (array, player) {
      var index;
  
      for (var i = 0; i < array.length; i++) {
        if (  (array[i].player.FirstName + " " + array[i].player.LastName).toLowerCase() == player ) {
          index = i;
          return index;
        }  
      }  
}

/* -------------------------- Test and Assertions -------------------------- */
