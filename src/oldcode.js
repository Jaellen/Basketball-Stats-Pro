/* May need later code

<script>

console.log(response.activeplayers.playerentry.length);
console.log(response.activeplayers.playerentry[0].player.LastName);

  var text;

  //create a variable that points to button
  var button = document.querySelector("button");

  //add click event listener to button
  button.addEventListener("click", function() {
    //create a new paragraph element
    document.createElement("p");

  });

</script>

function get(url) {
  //Return a new promise
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


function testAjax() {
  return Promise.resolve($.ajax({
      url: "https://api.meetup.com/2/cities",
      dataType: 'jsonp'
  }));
}

var promise = testAjax();
var stats;

promise.then(data => alert(data.results[0].city));





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
