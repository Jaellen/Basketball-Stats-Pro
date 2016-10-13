"use strict";


var chai = require('chai');
var assert = chai.assert;
var $ = require('jquery');
var Promise = require('promise');


console.log('');

//APP START HERE

function testAjax() {
  return Promise.resolve($.ajax({
      url: "https://api.meetup.com/2/cities",
      dataType: 'jsonp'
  }));
}

var promise = testAjax();
var stats;

promise.then(data => alert(data.results[0].city));



/* Modules
require('nav');
require('stats');
require('compare');
require('favourites');
require('account');
*/
