"use strict";

var chai = require('chai');
var assert = chai.assert;
var $ = require('jquery');
var Promise = require('promise');
var searchIndex = require('./js/components/data-service.js');

/* --- Program Logic --- */

// Search Recommendation Feature

var input = document.getElementById("searchBox"),
    ul = document.getElementById("searchResults"),
    inputTerms, termsArray, prefix, terms, results, sortedResults;


var search = function() {
  inputTerms = input.value.toLowerCase();
  results = [];
  termsArray = inputTerms.split(' ');
  prefix = termsArray.length === 1 ? '' : termsArray.slice(0, -1).join(' ') + ' ';
  terms = termsArray[termsArray.length -1].toLowerCase();

  for (var i = 0; i < searchIndex.length; i++) {
    var a = searchIndex[i].toLowerCase(),
        t = a.indexOf(terms);

    if (t > -1) {
      results.push(a);
    }
  }

  evaluateResults();
};

var evaluateResults = function() {
  if (results.length > 0 && inputTerms.length > 0 && terms.length !== 0) {
    sortedResults = results.sort(sortResults);
    appendResults();
  }
  else if (inputTerms.length > 0 && terms.length !== 0) {
    ul.innerHTML = '<li>Whoah! <strong>' + inputTerms + '</strong> is not in the index. <br></li>';

  }
  else if (inputTerms.length !== 0 && terms.length === 0) {
    return;
  }
  else {
    clearResults();
  }
};

var sortResults = function (a,b) {
  if (a.indexOf(terms) < b.indexOf(terms)) return -1;
  if (a.indexOf(terms) > b.indexOf(terms)) return 1;
  return 0;
}

var appendResults = function () {
  clearResults();

  for (var i=0; i < sortedResults.length && i < 5; i++) {
    var li = document.createElement("li"),
        result = prefix + sortedResults[i].toLowerCase().replace(terms, '<strong>' + terms +'</strong>');

    li.innerHTML = result;
    ul.appendChild(li);
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


// Retrieve API data

getJSON('https://api.meetup.com/2/cities').then(function(response) {
  console.log(response.results[0].city);
}, function(error) {
  console.error("Failed", console.error);
})


/* --- Utility functions --- */

function showMessage(msg) {
  var elt = document.createElement("div");
  elt.textContent = msg
  return document.body.appendChild(elt);
}


function get(url) {
  //Return a new promise
  return new Promise(function(resolve, reject) {
    var req = new XMLHttpRequest();
    req.open("GET", url, true);

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

function getJSON(url) {
  return get(url).then(JSON.parse);
}

/* --- Test and Assertions --- */
