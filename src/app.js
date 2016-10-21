"use strict";

/* ----------------------- Module Dependencies ----------------------------- */

var chai = require('chai');
var assert = chai.assert;
var $ = require('jquery');
var Promise = require('promise');
var searchIndex = require('./js/components/data-service.js');

/* ------------------------------ Logic ------------------------------------ */

/* Program Steps:
1. Retrieve player first and last name data 
  a) Make GET request and create sorted array of players first and last names
  b) Use 'activePlayers' array to recommend resuts from user's search input   
  c) Display the results of recommendations if they exist
  d) When user selects player from search, display data on that player  
*/

var cumulative_stats_array;
var active_players_array;
var current_player_clicked; 

// 1.a) Make GET request and create sorted array of players first and last names
getJSON('https://www.mysportsfeeds.com/api/feed/pull/nba/2015-2016-regular/cumulative_player_stats.json?')
.then( function(response) {
    
    cumulative_stats_array = response.cumulativeplayerstats.playerstatsentry;

    // Create an array of all players' first and last name called 'activePlayers'
    var activePlayers = [];
    for (var i = 0; i < cumulative_stats_array.length; i++) {
      activePlayers[i] = cumulative_stats_array[i].player.FirstName + " " + cumulative_stats_array[i].player.LastName;
    }
    //Pass this array to 'then'
    return activePlayers;

    //Throw error if request fails  
    }, function(error) {
      console.error("GET Request Failed", console.error);
})
.then( function(activePlayers) {
    
    var input = document.getElementById("searchBox"),
    ul = document.getElementById("searchResults"),
    inputTerms, termsArray, prefix, terms, results, sortedResults;

    //1.b) Use 'activePlayers' array to recommend resuts from user's search input  
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
    
    //1.c) Display the results of recommendations if they exist
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

    var appendResults = function () {
  
      clearResults();

      //Note: A maximum of 5 recommendations set here 
      for (var i = 0; i < sortedResults.length && i < 5; i++) {
       
          var li = document.createElement("li");
          var a = document.createElement("a");

          //This sets an attribute and event listener to recommendations that triggers another function
          a.setAttribute('id', i.toString());
          
          a.addEventListener("click", function(event) {
              
              //retrieve the name of the player clicked
              var player_clicked = sortedResults[event.currentTarget.getAttribute('id')];
              current_player_clicked = sortedResults[event.currentTarget.getAttribute('id')];

              //pass player clicked into getCumulativeStats function
              getCumulativeStats(player_clicked);
          });

          //set the result to display for recommendations    
          var result = prefix + sortedResults[i].toLowerCase().replace(terms, '<strong>' + terms + '</strong>' );
          li.innerHTML = result;

          //create and append elemnets together
          ul.appendChild(a);
          a.appendChild(li);
      }

          if ( ul.className !== "term-list") {
            ul.className = "term-list";
          }
    };

    var clearResults = function() {
      ul.className = "term-list hidden";
      ul.innerHTML = '';
    };

    input.addEventListener("keyup", search, false);
});

//1.d) When user selects player from search, display data on that player  
var getCumulativeStats = function(player) {

  var index = findPlayerClickedIndex(cumulative_stats_array, player); 
  console.log(cumulative_stats_array[index].team.City);


  getJSON('https://www.mysportsfeeds.com/api/feed/pull/nba/2015-2016-regular/active_players.json')
  .then( function(response) {

    active_players_array = response.activeplayers.playerentry;
    
    console.log(current_player_clicked);
    var a_index = findPlayerClickedIndex(active_players_array, current_player_clicked);
    
    console.log(active_players_array[a_index].player.Height);

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

function showMessage(msg) {
  var elt = document.createElement("div");
  elt.textContent = msg
  return document.body.appendChild(elt);
}


/* -------------------------- Test and Assertions -------------------------- */
