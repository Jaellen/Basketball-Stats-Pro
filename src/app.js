
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



/*
require('nav');
require('stats');
require('compare');
require('favourites');
require('account');
*/

/* May need later code

var getCumulativePlayerStats = function() {

  return  $.ajax({
    url:"https://www.mysportsfeeds.com/api/feed/pull/nba/2015-2016-regular/cumulative_player_stats.json?playerstats=",
    dataType: 'jsonp'
  });
};

var promise = getCumulativePlayerStats();

console.log(promise.success);





$.ajax({
  type:"GET",
  url:"https://www.mysportsfeeds.com/api/feed/pull/nba/2015-2016-regular/cumulative_player_stats.json?playerstats=",
  data: {
    cumulative_player_stats: cumulative_player_stats
  },
  success: function(data) {

    cumulative_player_stats = data;
    console.log(cumulative_player_stats);

    $('.text').html('');
    for (var i = 0; i < data.cumulativeplayerstats.playerstatsentry.length; i++) {
      var player = data.cumulativeplayerstats.playerstatsentry[i].player.FirstName + " " + data.cumulativeplayerstats.playerstatsentry[i].player.LastName;
      $('.text').append('<p>' + player + '</p>');
    }
  },
  dataType: 'jsonp',
});

*/
