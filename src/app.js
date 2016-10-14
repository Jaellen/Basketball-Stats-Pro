"use strict";

var chai = require('chai');
var assert = chai.assert;
var $ = require('jquery');
var Promise = require('promise');


//Program Declarations

  //Utility functions

function showMessage(msg) {
  var elt = document.createElement("div");
  elt.textContent = msg
  return document.body.appendChild(elt);
}

function get(url) {
  return new Promise(function(resolve, reject) {
    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.addEventListener("load", function() {
      if (req.status < 400) { resolve(req.responseText); }
      else { reject(new Error("Request failed: " + req.statusText)); }
    });
    req.addEventListener("error", function() {
      reject(new Error("Network error"));
    });
    req.send(null);
  });
}

function getJSON(url) {
  return get(url).then(JSON.parse);
}

//Program Logic
var loading = showMessage("Loading...");

getJSON("https://api.meetup.com/2/cities").then(function(){
    console.log(req.responseText);
});



//Test and Assertions
