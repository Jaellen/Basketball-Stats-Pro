"use strict";

var chai = require('chai');
var assert = chai.assert;
var $ = require('jquery');
var Promise = require('promise');

/* --- Program Logic --- */


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
