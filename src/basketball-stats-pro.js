"use strict";

/*!
  rx.js v4.1.0
  License:  Microsoft Open Technologies, Inc
  https://github.com/Reactive-Extensions/RxJS/tree/master/doc
*/
var Rx = require('rx');

/*!
  superagent.js v2.3.0
  License: MIT
  https://github.com/visionmedia/superagent
*/
var xhrRequest = require('superagent'); 

/*!
  chart.js v2.4.0
  License: MIT
  https://github.com/chartjs/Chart.js/releases/tag/v2.4.0
*/
var Chart = require('chart.js'); 


//css styling
require("./css/main.css");

//For testing: 
//var chai = require('chai');
//var assert = chai.assert;

let BasketballStatsPro = (function () {

  //urls 
  const STATS_2016_2017 = 'https://www.mysportsfeeds.com/api/feed/pull/nba/2016-2017-regular/cumulative_player_stats.json?'
  const PROFILE_2016_2017 = 'https://www.mysportsfeeds.com/api/feed/pull/nba/2016-2017-regular/active_players.json'; 
  const STATS_2015_2016 = 'https://www.mysportsfeeds.com/api/feed/pull/nba/2015-2016-regular/cumulative_player_stats.json?'
  const PROFILE_2015_2016 = 'https://www.mysportsfeeds.com/api/feed/pull/nba/2015-2016-regular/active_players.json'; 

  //main stats variables
  let cumulative_player_data_url = STATS_2016_2017;
  let profile_data_url = PROFILE_2016_2017;
  let all_stats_data, all_profile_data;
  let search_array;
  let current_player_clicked;
  let player_profile, player_main_stats, player_secondary_stats;
  let player_team_name, player_team_list, player_team_positions;

  //compare stats variables
  let compare_player_a, compare_player_b;
  let player_a_profile, player_b_profile;
  let player_a_main_stats, player_b_main_stats;
  let player_a_sec_stats, player_b_sec_stats;
  let compare_player_clicked;

  //graphs and chart variables
  let data_radar_main, data_doughnut1_main, data_doughnut2_main;

  //favourites variables
  let save_player_list = [];
  let save_player_profile = {}; 
  let save_player_clicked;

  //rankings variables
  let rankings_data_table_a;
  let rankings_data_table_b;
  let rankings_data_table_c;
  let rankings_data_table_d;
  let table_a;
  let table_b; 
  let table_c;
  let table_d;

  //async get requests 
  let getAllProfileData = Rx.Observable.create((observer) => {
    xhrRequest
      .get(profile_data_url)
      .auth('jaellen', 'adanaC4032')
      .end(function(err, res) {
        if (err) {
          return observer.onError(err);
        }
        let data = JSON.parse(res.text);
        observer.onNext(data);
      });
      return () => {};
  });
  let getAllStatsData = Rx.Observable.create((observer) => {
    xhrRequest
     .get(cumulative_player_data_url)
     .auth('jaellen', 'adanaC4032')
     .end(function(err, res) {
        if (err) {
          return observer.onError(err);
        }
        let data = JSON.parse(res.text);
        observer.onNext(data);
     });
     return () => {};
  });


  /* ------------------------ Program Logic -------------------------------- */

  //Navigation
  let setNavBar = function() {

    //set navbar
    document.getElementById('nav-stats').addEventListener('click', function() {
      setNavRoute("a");
    }, false);

    document.getElementById('nav-compare').addEventListener('click', function() {
      setNavRoute("b");
    }, false);
    
    document.getElementById('nav-favourites').addEventListener('click', function() {
      setNavRoute("c");
    }, false); 

    document.getElementById('nav-rankings').addEventListener('click', function() {
      setNavRoute("d");
    }, false);
  };

  //Main stats page functionality
  let setAllStatsData = function() {
    //set all_stats_data
    getAllStatsData
      .take(1)
      .subscribe({
      onNext: (data) => { all_stats_data = data.cumulativeplayerstats.playerstatsentry; },
      onError: (error) => { console.error("Error in XMLHttpRequest") },
      onCompleted: () => {
        setSearch();
        setRankingsTables();
      },
    });   
  };

  let setAllProfileData = function() {
    //set all_profile_data
    getAllProfileData
      .take(1)
      .subscribe({
      onNext: (data) => { all_profile_data = data.activeplayers.playerentry; },
      onError: (error) => { console.error("Error in XMLHttpRequest") },
      onCompleted: () => {},
    });  
  };

  let setSearch = function() {

    //set the search array
    let input = document.getElementById('searchBox')
    let ul = document.getElementById('searchResults')
    let sortedResults, prefix, inputTerms, termsArray, terms, results;

    let search = () => {
      search_array = createFirstandLastNameArray(all_stats_data);    
      inputTerms = input.value.toLowerCase();
      results = [];
      termsArray = inputTerms.split(' ');
      prefix = termsArray.length === 1 ? '' : termsArray.slice(0, -1).join(' ') + ' ';
      terms = termsArray[termsArray.length -1].toLowerCase();

      for (var i = 0; i < search_array.length; i++) {
        var a = search_array[i].toLowerCase(),
        t = a.indexOf(terms);
        if (t > -1) {
          results.push(a);
      }
    }
           
    let sortResults = (a,b) => {
      if (a.indexOf(terms) < b.indexOf(terms)) return -1;
      if (a.indexOf(terms) > b.indexOf(terms)) return 1;
      return 0;
    }

    let evaluateSearchResults = () => {
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
    }

    let clearResults = () => {
      ul.className = 'term-list hidden';
      ul.innerHTML = '';
    }

    let displaySearchResults = () => {
      clearResults();

      //Note: A maximum of 5 recommendations set here 
      for (let i = 0; i < sortedResults.length && i < 5; i++) {  
        let li = document.createElement('li');
        let a = document.createElement('a');

        //set click event listener that sets curent_player_clicked...
        a.setAttribute('id', i.toString());
        a.addEventListener('click', playerClicked, false);

        var result = prefix + sortedResults[i].toLowerCase().replace(terms, '<strong>' + terms + '</strong>' );
        li.innerHTML = result;
        ul.appendChild(a);
        a.appendChild(li);
      }
      
      if (ul.className !== 'term-list') {
        ul.className = 'term-list';
      }
    }

    let playerClicked = () => {
      current_player_clicked = sortedResults[event.currentTarget.getAttribute('id')];  
            
      //clear the search field & recommendations and update the stats with that player 
      document.getElementById('searchBox').value = '';
      clearResults(); 
      setPlayerStats();
    }

    input.addEventListener('keyup', search, false);
    setAllProfileData();
  };

  let setPlayerStats = function() {

    //set player's profile data, main stats, and secondary stats
    player_profile = getPlayerProfile(all_profile_data, current_player_clicked)[0];
    player_main_stats = getPlayerMainStats(all_stats_data, current_player_clicked)[0];  
    player_secondary_stats = getPlayerSecondaryStats(all_stats_data, current_player_clicked)[0];

    //set player's team data
    player_team_name = getTeamName(all_stats_data, current_player_clicked)[0];
    player_team_list = getTeamList(all_stats_data, current_player_clicked);
    player_team_positions = getTeamPositions(all_stats_data, current_player_clicked);

    //set chart and graph data
    data_radar_main = getRadarChartData(all_stats_data, current_player_clicked);
    data_doughnut1_main = getDoughnutChart1Data(all_stats_data, current_player_clicked);
    data_doughnut2_main = getDoughnutChart2Data(all_stats_data, current_player_clicked);

    displayPlayerStats();
    displayMainCharts();
  };

  let displayPlayerStats = function() {

    let displayPlayerProfile = function() {
      
      //clear any previous results and display player profile
      document.getElementById('profile').innerHTML = '';

      for (let prop in player_profile) {
            document.getElementById('profile').appendChild(createElement( 'li', player_profile[prop] ));
      }
    }

    let displayPlayerMainStats = function() {
      
      //clear any previous results and display player's main stats
      document.getElementById('stats-main').innerHTML = '';

      for (let stat in player_main_stats) {
            document.getElementById('stats-main').appendChild(createElement( 'li', player_main_stats[stat] ));
      }
    }

    let displayPlayerSecondaryStats = function() {
    
      //clear any previous results and display player's secondary stats 
      document.getElementById('stats-secondary').innerHTML = '';
      
      for (let stat in player_secondary_stats) {
            document.getElementById('stats-secondary').appendChild(createElement( 'li', player_secondary_stats[stat] ));
      }
    }

    let displayPlayerTeamName = function() {
      
      //clear any previous results and display player team name
      document.getElementById('team-name').innerHTML = '';
      document.getElementById('team-name').appendChild(createElement( 'h4', player_team_name.toString() ));
    }

    let displayPlayerTeamList = function() { 
      //clear any previous results 
      document.getElementById('team-list').innerHTML = '';
      
      //display player team list 
      player_team_list.forEach((value, i) => {
        document.getElementById('team-list')
          .appendChild(createElement( 'li', createElement('a', player_team_list[i], ", ", player_team_positions[i])  ))
          .setAttribute('id', player_team_list[i]);
        
        //add a click event listener  
        document.getElementById(player_team_list[i]).addEventListener('click', function(event) {            
          current_player_clicked = event.currentTarget.getAttribute('id').toLowerCase();
          //display that player's data
          setPlayerStats();
        });
      });
    }

    displayPlayerProfile();
    displayPlayerMainStats();
    displayPlayerSecondaryStats();
    displayPlayerTeamName();
    displayPlayerTeamList();
  }

  //Compare player functionality
  let getComparePlayer = function() {

    let setComparePlayerButton = function() {

      //case: if no player is clicked as of yet
      if (current_player_clicked === undefined) {
        return;
      }

      //case: if player clicked is already in compare slot a 
      if (current_player_clicked === compare_player_a) {
        alert("This player is already in compare slot a");
        return;    
      }

      //case: if player clicked is already in compare slot b 
      if (current_player_clicked === compare_player_b) {
        alert("This player is already in compare slot b");
        return;    
      }

      compare_player_clicked = current_player_clicked;
        
      //case: if both slots empty, fill slot A
      if ( (compare_player_a === undefined) && (compare_player_b === undefined) ) {
        //update compare_player_a
        compare_player_a = compare_player_clicked;
        setComparePlayerStats("a");
        alert("Added player to slot A");
      }
      
      //case: if one slot empty, fill empty slot
      else if ( (compare_player_a === undefined) || (compare_player_b === undefined) ) {
        //update compare_player_b
        compare_player_b = compare_player_clicked
        setComparePlayerStats("b");
        alert("Added player to slot B");
      }

      //case: if no slots empty, ask user which slot to replace or neither
      else {
        let compare_choice = window.prompt("Options: replace a  |  replace b  |  cancel", "cancel");

        if (compare_choice.toLowerCase() === "replace a" ) {
          //update compare_player_a
          compare_player_a = compare_player_clicked;
          setComparePlayerStats("a");
        }

        if (compare_choice.toLowerCase() === "replace b" ) {
          //update compare_player_a
          compare_player_b = compare_player_clicked;
          setComparePlayerStats("b");
        }
      }
    };  

    //add event listener for button
    document.getElementById('button-compare').addEventListener('click', setComparePlayerButton, false); 
  };
   
  let setComparePlayerStats = function(slot) {

    if (slot === "a") {
      //update player_a_profile, player_a_main_stats, player_a_sec_stats
      player_a_profile = getPlayerProfile(all_profile_data, compare_player_a)[0];
      player_a_main_stats = getPlayerMainStats(all_stats_data, compare_player_a)[0]; 
      player_a_sec_stats = getPlayerSecondaryStats(all_stats_data, compare_player_a)[0];
    }
    
    if (slot === "b") {
      //update player_b_profile, player_b_main_stats, player_b_sec_stats
      player_b_profile = getPlayerProfile(all_profile_data, compare_player_b)[0];
      player_b_main_stats = getPlayerMainStats(all_stats_data, compare_player_b)[0]; 
      player_b_sec_stats = getPlayerSecondaryStats(all_stats_data, compare_player_b)[0];
    }

    displayComparePlayerStats();
  };

  let displayComparePlayerStats = function() {

    let displayCompareProfiles = function() {

      //clear any previous results and display player a profile
      document.getElementById('profile-data-player-a').innerHTML = '';

      for (let prop in player_a_profile) {
            document.getElementById('profile-data-player-a').appendChild(createElement( 'li', player_a_profile[prop] ));
      }

      //clear any previous results and display player b profile
      document.getElementById('profile-data-player-b').innerHTML = '';

      for (let prop in player_b_profile) {
            document.getElementById('profile-data-player-b').appendChild(createElement( 'li', player_b_profile[prop] ));
      } 
    }

    let displayCompareMainStats = function() {
      
      //clear any previous results and display player a profile
      document.getElementById('stats-main-player-a').innerHTML = '';

      for (let stat in player_a_main_stats) {
            document.getElementById('stats-main-player-a').appendChild(createElement( 'li', player_a_main_stats[stat] ));
      }

      //clear any previous results and display player b profile
      document.getElementById('stats-main-player-b').innerHTML = '';

      for (let stat in player_b_main_stats) {
            document.getElementById('stats-main-player-b').appendChild(createElement( 'li', player_b_main_stats[stat] ));
      }
    }

    let displayCompareSecondaryStats = function() {
      
      //clear any previous results and display secondary stats of player a
      document.getElementById('secondary-stats-player-a').innerHTML = '';

      for (let stat in player_a_sec_stats) {
            document.getElementById('secondary-stats-player-a').appendChild(createElement( 'li', player_a_sec_stats[stat] ));
      }

      //clear any previous results and display secondary stats of player b
      document.getElementById('secondary-stats-player-b').innerHTML = '';

      for (let stat in player_b_sec_stats) {
            document.getElementById('secondary-stats-player-b').appendChild(createElement( 'li', player_b_sec_stats[stat] ));
      }
    }

    displayCompareProfiles();
    displayCompareMainStats();
    displayCompareSecondaryStats();
  }

  //Save player functionality
  let setSavePlayerList = function() {
    
    //set save player button (main page)
    let setAddPlayer = () => {
      
      //case: if no player is clicked as of yet
      if (current_player_clicked === undefined) {
        return;
      }

      //test if player being saved is already saved
      if ( isSavePlayerRepeated(save_player_list) === true ) {
        alert("You already have this player saved"); 
      }
      
      if ( isSavePlayerRepeated(save_player_list) === false ) {
        updateSavePlayerList("add");
        alert(current_player_clicked + " has been added to favourites list!");
      } 
    };

    //add event listener for button
    document.getElementById('button-save-player').addEventListener('click', setAddPlayer, false);

    //set remove player button (favourites page)
  };

  let updateSavePlayerList = function(AddOrRemove, index) {
    
    //add player to list
    if (AddOrRemove === "add") {
      save_player_clicked = current_player_clicked;
      save_player_profile = getSavePlayerProfile(all_profile_data, save_player_clicked)[0];
      save_player_list.push(save_player_profile);
    } 

    //remove player from list
    if (AddOrRemove === "remove") {
      save_player_list.splice(index, 1);
    }

    //update the save player list
    displaySavePlayerList();
  };

  let displaySavePlayerList = function() {
    document.getElementById('favourites').innerHTML = '';

    //go through each player in the save player list and display their properties
    save_player_list.forEach( (player, i) => {   
      
      for (let prop in player) {
        document.getElementById('favourites').appendChild(createElement( 'li', player[prop] ));
      }
      //add a button to remove player from list
      let button = document.getElementById('favourites').appendChild(createElement( 'button', "remove" ));
      
      //add an id to identify each player in list 
      let identifier = ('button' + i);
      let attr = { id: identifier };
      setAttributes(button, attr);

      //add event listener for button
      document.getElementById(identifier).addEventListener('click', function() {
        updateSavePlayerList("remove", i);    
      });
      
      //add a space between player profiles
      document.getElementById('favourites').appendChild(createElement( 'br' ));
      document.getElementById('favourites').appendChild(createElement( 'br' ));
    });
  };

  //Ranking tables functionality
  let setRankingsTables = function() {

    let setRankingsButtons = function() {
      
      //when button is clicked, show the corresponding table
      document.getElementById('button-pts-g').addEventListener('click', function() {
        setTable("a");
      }, false);

      document.getElementById('button-ast-g').addEventListener('click', function() {
        setTable("b");
      }, false);
      
      document.getElementById('button-reb-g').addEventListener('click', function() {
        setTable("c");
      }, false); 

      document.getElementById('button-blk-g').addEventListener('click', function() {
        setTable("d");
      }, false);

      setChangeSeason();
    };

    table_a = createRankingsTable(rankings_data_table_a, all_stats_data, "a");
    table_b = createRankingsTable(rankings_data_table_b, all_stats_data, "b");
    table_c = createRankingsTable(rankings_data_table_c, all_stats_data, "c");
    table_d = createRankingsTable(rankings_data_table_d, all_stats_data, "d");

    setRankingsButtons();
    displayRankings();
  };

  let displayRankings = function() {
     
    //clear any previous tables in the case of changing season option
    document.getElementById('table-pts-g').innerHTML = '';
    document.getElementById('table-ast-g').innerHTML = '';
    document.getElementById('table-reb-g').innerHTML = '';
    document.getElementById('table-blk-g').innerHTML = '';

    //display tables
    displayTable(table_a, 'table-pts-g', 'table-a');
    displayTable(table_b, 'table-ast-g', 'table-b');
    displayTable(table_c, 'table-reb-g', 'table-c');
    displayTable(table_d, 'table-blk-g', 'table-d');
  };

  let setChangeSeason = function() {

    //change season to 2015/2016
    document.getElementById('seasonA').addEventListener('click', function() {
      
      //case: clicked season is already selected
      if (cumulative_player_data_url === STATS_2016_2017) {
        return;
      }

      //change source data  
      setSeason("a");

      //reset main page stats and ranking tables 
      setAllStatsData();

      //case: if stats already being displayed, reset those
      if (current_player_clicked !== undefined) {
        setPlayerStats();
      }

    }, false);

    //change season to 2016/2017
    document.getElementById('seasonB').addEventListener('click', function() {

      //case: clicked season is already selected
      // if (cumulative_player_data_url === STATS_2015_2016) {
      //   return;
      // }
      
      //change source data  
      setSeason("b");

      //reset main page stats and ranking tables 
      setAllStatsData();

      //case: if stats already being displayed, reset those
      // if (current_player_clicked !== undefined) {
      //   setPlayerStats();
      // }

    }, false);
  };

  let displayMainCharts = function() {
    
    let setRadarChart = function() { 
      
      let ctx = document.getElementById('radar-chart-main');
        
      let data = {
        labels: ["eFG%", "FT%", "3P%", "TS%", "2P%", "FG%"],
        datasets: [
            {
                label: toNameUpperCase(current_player_clicked),
                backgroundColor: "rgba(179,181,198,0.2)",
                borderColor: "rgba(179,181,198,1)",
                pointBackgroundColor: "rgba(179,181,198,1)",
                pointBorderColor: "#fff",
                pointHoverBackgroundColor: "#fff",
                pointHoverBorderColor: "rgba(179,181,198,1)",
                data: data_radar_main
            }
        ]
      };
        
      let myRadarChart = new Chart(ctx, {
        type: 'radar',
        data: data,
        options: {
            responsive: false,
            scale: {
                ticks: {
                    beginAtZero: true
                }
            }
        }
      });
    }

    let setDoughnutChart1 = function() { 
      
      let data = {
        labels: ["FGA", "FGM"],
        datasets: 
        [{
            data: data_doughnut1_main,
            backgroundColor: [
                "#4BC0C0",
                "#FFCE56"
            ],
            hoverBackgroundColor: [
                "#4BC0C0",
                "#FFCE56"
            ]
        }]
      };

      let ctx = document.getElementById('doughnut-chart1-main');
        
      let myChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        animation: { animateScale: true },
        options: {
            responsive: false
        }
      });
    } 

    let setDoughnutChart2 = function() { 
      
      let data = {
        labels: ["FTA", "FTM"],
        datasets: 
        [{
            data: data_doughnut2_main,
            backgroundColor: [
                "#4BC0C0",
                "#FFCE56"
            ],
            hoverBackgroundColor: [
                "#4BC0C0",
                "#FFCE56"
            ]
        }]
      };

      let ctx = document.getElementById('doughnut-chart2-main');
        
      let myChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        animation: { animateScale: true },
        options: {
            responsive: false
        }
      });
    }    

    setRadarChart();
    //setBarChart();
    setDoughnutChart1();
    setDoughnutChart2();
  };


  /* ------------------ Utility and Helper functions ----------------------- */

  //DOM utilities
  function getJSON(url) {
    
    return getRequest(url).then(JSON.parse);
  }

  function getRequest(url) {
    //Return a new promise
    return new Promise(function(resolve, reject) {
      var req = new XMLHttpRequest();
      req.open('GET', url, true);
      
      //Authorization details go here 
      req.setRequestHeader('Authorization', 'Basic ' + btoa("jaellen:adanaC4032"));

      req.onload = () => {
        //Check the status
        if (req.status === 200) {
          resolve(req.response);
        }
        else {
          reject(Error(req.statusText));
        }
      };
      //Handle network errors
      req.onerror = () => {
        reject(Error("Network Error"))
      };
      //Make the request
      req.send();
    });
  }

  function createElement(type) {
    var node = document.createElement(type);
    for (var i = 1; i < arguments.length; i++) {
      var child = arguments[i];
      if (typeof child == 'string') {
        child = document.createTextNode(child);
      }
      node.appendChild(child);
    }
    return node;
  } 

  function setAttributes(el, attrs) {
    // for multiple attributes, send attrs in the form of { attr: value, attr: value... }
    for(var key in attrs) {
      el.setAttribute(key, attrs[key]);
    }
  }

  function addClass(el, className) {
      if (el.classList) el.classList.add(className);
      else if (!hasClass(el, className)) el.className += ' ' + className;
  }

  function removeClass(el, className) {
      if (el.classList) el.classList.remove(className);
      else el.className = el.className.replace(new RegExp('\\b'+ className+'\\b', 'g'), '');
  }

  function hasClass(el, className) {
      
      return el.classList ? el.classList.contains(className) : new RegExp('\\b'+ className+'\\b').test(el.className);
  }

  //navbar utilities 
  function setNavRoute(option) {
    let navA = document.getElementById('stats-page');
    let navB = document.getElementById('compare-page');
    let navC = document.getElementById('favourites-page');
    let navD = document.getElementById('rankings-page');

    if (option == "a") {
      removeClass(navA, 'hidden');
      addClass(navB, 'hidden');
      addClass(navC, 'hidden');
      addClass(navD, 'hidden');
    }

    if (option == "b") {
      addClass(navA, 'hidden');
      removeClass(navB, 'hidden');
      addClass(navC, 'hidden');
      addClass(navD, 'hidden');
    } 
    
    if (option == "c") {
      addClass(navA, 'hidden');
      addClass(navB, 'hidden');
      removeClass(navC, 'hidden');
      addClass(navD, 'hidden');
    }

    if (option == "d") {
      addClass(navA, 'hidden');
      addClass(navB, 'hidden');
      addClass(navC, 'hidden');
      removeClass(navD, 'hidden');
    }
  }

  //stats and compare utilities
  function createFirstandLastNameArray(data) { 
    return data
      .filter((entry) => { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
      .map((entry) => { return entry.player.FirstName + " " + entry.player.LastName; 
      });
  }

  function getPlayerProfile(data, player_clicked) {
    return data
      .filter((entry) => { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === player_clicked })
      .map((entry) => { 
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

  function getSavePlayerProfile(data, player_clicked) {
    return data
      .filter((entry) => { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === player_clicked })
      .map((entry) => { 
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

  function getPlayerMainStats(data, player_clicked) {
    return data
      .filter((entry) => { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
      .filter((entry) => { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === player_clicked })
      .map((entry) => { 
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
          EFgPct: ("eFG%: " + getEfgPct(entry) ),
          TsPct: ("TS%: " + getTsPct(entry) ),
          PlusMinus: ("+/-: " + entry.stats.PlusMinus["#text"]),
          MinSecondsPerGame: ("MPG: " + entry.stats.MinSecondsPerGame["#text"])
        } 
      });
  }
  
  function getPlayerSecondaryStats(data, player_clicked) {
    return data
      .filter((entry) => { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
      .filter((entry) => { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === player_clicked })
      .map((entry) => { 
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

  function getTeamName(data, player_clicked) {
    return data
      .filter((entry) => { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
      .filter((entry) => { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === player_clicked })
      .map((entry) => { return entry.team.City + " " + entry.team.Name });
  }

  function getTeamList(data, player_clicked) {
    return data
      .filter((entry) => { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
      .filter((entry) => { return (entry.team.City + " " + entry.team.Name) === player_team_name.toString() })
      .filter((entry) => { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() !== player_clicked }) //remove repeat
      .map((entry) => { return entry.player.FirstName + " " + entry.player.LastName });
  }

  function getTeamPositions(data, player_clicked) {
    return data
      .filter((entry) => { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
      .filter((entry) => { return (entry.team.City + " " + entry.team.Name) === player_team_name.toString() })
      .filter((entry) => { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() !== player_clicked }) //remove repeat
      .map((entry) => { return entry.player.Position });
  }

  function getRadarChartData(data, player_clicked) {
    //return an array with numbers for the chart
    let array = data
      .filter((entry) => { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
      .filter((entry) => { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === player_clicked })
      .map((entry) => { return [
          Number(getEfgPct(entry)), 
          Number(entry.stats.FtPct["#text"]), 
          Number(entry.stats.Fg3PtPct["#text"]),  
          Number(getTsPct(entry)),
          Number(entry.stats.Fg2PtPct["#text"]),
          Number(entry.stats.FgPct["#text"])
        ]
      });

    return array[0];
  }

  function getDoughnutChart1Data(data, player_clicked) {
    //return an array with numbers for the chart
    let array = data
      .filter((entry) => { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
      .filter((entry) => { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === player_clicked })
      .map((entry) => { return [ 
          Number(entry.stats.FgAtt["#text"]), 
          Number(entry.stats.FgMade["#text"])
        ]
      });

    return array[0];
  }

  function getDoughnutChart2Data(data, player_clicked) {
    //return an array with numbers for the chart
    let array = data
      .filter((entry) => { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
      .filter((entry) => { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === player_clicked })
      .map((entry) => { return [ 
          Number(entry.stats.FtAtt["#text"]), 
          Number(entry.stats.FtMade["#text"])
        ]
      });

    return array[0];
  }

  function getEfgPct(entry) {
  
    let EfgPct = 0;
    EfgPct = ( ( Number(entry.stats.FgMade["#text"]) + 0.5*(Number(entry.stats.Fg3PtMade["#text"])) ) / Number(entry.stats.FgAtt["#text"]) )*100;
  
    if (EfgPct === Infinity || isNaN(EfgPct)) {
      return "0";
    }
    else {
      return EfgPct.toPrecision(3);
    }
  }

  function getTsPct(entry) {

    let TsPct = 0;
    TsPct = ( Number(entry.stats.Pts["#text"]) / ( 2*( Number(entry.stats.FgAtt["#text"]) + (0.44*( Number(entry.stats.FtAtt["#text"]) ) ) ) ) )*100;
  
    if (TsPct === Infinity || isNaN(TsPct)) {
      return "0";
    }
    else {
      return TsPct.toPrecision(3);
    }
  }

  function toNameUpperCase(str) {

    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  }

  //favourites utilities
  function isSavePlayerRepeated(list) {
    let test_array = list
                       .map((element) => { return element.name.toLowerCase(); })
                       .filter((element) => { return element == current_player_clicked.toLowerCase();
                       });

    if (test_array.length > 0) { return true }
    else { return false }
  }

  //rankings utilities
  function createRankingsTable(table, data, option) {
    
    //Table A: PTS/G 
    if (option === "a") {
      
      //filter the data
      table = getAllRankingsDataTable(data, option);

      //sort the data  
      table.sort((a, b) => {
        if ( Number(a.PtsPerGame) > Number(b.PtsPerGame) ) {
          return -1;
        }
        if ( Number(a.PtsPerGame) < Number(b.PtsPerGame) ) {
          return 1;
        }
        return 0;
      });
    }

    //Table B: AST/G 
    if (option === "b") {
      
      //filter the data
      table = getAllRankingsDataTable(data, option);

      //sort the data 
      table.sort(function (a, b) {
        if ( Number(a.AstPerGame) > Number(b.AstPerGame) ) {
          return -1;
        }
        if ( Number(a.AstPerGame) < Number(b.AstPerGame) ) {
          return 1;
        }
        return 0;
      });
    }

    //Table C: REB/G 
    if (option === "c") {
      
      //filter the data
      table = getAllRankingsDataTable(data, option);

      //sort the data
      table.sort(function (a, b) {
        if ( Number(a.RebPerGame) > Number(b.RebPerGame) ) {
          return -1;
        }
        if ( Number(a.RebPerGame) < Number(b.RebPerGame) ) {
          return 1;
        }
        return 0;
      });
    }

    //Table D: BLK/G 
    if (option === "d") {
      
      //filter all the stats data for the rankings
      table = getAllRankingsDataTable(data, option);

      //sort the data
      table.sort(function (a, b) {
        if ( Number(a.BlkPerGame) > Number(b.BlkPerGame) ) {
          return -1;
        }
        if ( Number(a.BlkPerGame) < Number(b.BlkPerGame) ) {
          return 1;
        }
        return 0;
      });
    }
   
    //cut the table down to top 20
    table = table.slice(0, 20);

    return table;
  }

  function getAllRankingsDataTable(data, option) {
    
    if (option === "a") {
      return data
            .filter((entry) => { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
            .map((entry) =>  { 
              return  { 
                Player: (entry.player.FirstName + " " + entry.player.LastName),
                PtsPerGame: (entry.stats.PtsPerGame["#text"]),
                GamesPlayed: (entry.stats.GamesPlayed["#text"]),
                MinSeconds: (entry.stats.MinSeconds["#text"]),
                Pts: (entry.stats.Pts["#text"]),
                FgAtt: (entry.stats.FgAtt["#text"]),
                FgMade: (entry.stats.FgMade["#text"]),
                Fg2PtMade: (entry.stats.Fg2PtMade["#text"]),
                Fg2PtAtt: (entry.stats.Fg2PtAtt["#text"]),
                Fg3PtMade: (entry.stats.Fg3PtMade["#text"]),
                Fg3PtAtt: (entry.stats.Fg3PtAtt["#text"]),
                FtAtt: (entry.stats.FtAtt["#text"]),
                FtMade: (entry.stats.FtMade["#text"]),
                OffReb: (entry.stats.OffReb["#text"]),
                DefReb: (entry.stats.DefReb["#text"]),
                Reb: (entry.stats.Reb["#text"]),
                Ast: (entry.stats.Ast["#text"]),
                Blk: (entry.stats.Blk["#text"]),
                Stl: (entry.stats.Stl["#text"]),
                Tov: (entry.stats.Tov["#text"]),
                FoulPers: (entry.stats.FoulPers["#text"])             
              } 
            });
    }

    if (option === "b") {
      return data
            .filter((entry) => { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
            .map((entry) => { 
              return  { 
                Player: (entry.player.FirstName + " " + entry.player.LastName),
                AstPerGame: (entry.stats.AstPerGame["#text"]),
                GamesPlayed: (entry.stats.GamesPlayed["#text"]),
                MinSeconds: (entry.stats.MinSeconds["#text"]),
                Pts: (entry.stats.Pts["#text"]),
                FgAtt: (entry.stats.FgAtt["#text"]),
                FgMade: (entry.stats.FgMade["#text"]),
                Fg2PtMade: (entry.stats.Fg2PtMade["#text"]),
                Fg2PtAtt: (entry.stats.Fg2PtAtt["#text"]),
                Fg3PtMade: (entry.stats.Fg3PtMade["#text"]),
                Fg3PtAtt: (entry.stats.Fg3PtAtt["#text"]),
                FtAtt: (entry.stats.FtAtt["#text"]),
                FtMade: (entry.stats.FtMade["#text"]),
                OffReb: (entry.stats.OffReb["#text"]),
                DefReb: (entry.stats.DefReb["#text"]),
                Reb: (entry.stats.Reb["#text"]),
                Ast: (entry.stats.Ast["#text"]),
                Blk: (entry.stats.Blk["#text"]),
                Stl: (entry.stats.Stl["#text"]),
                Tov: (entry.stats.Tov["#text"]),
                FoulPers: (entry.stats.FoulPers["#text"])             
              } 
            });
    }

    if (option === "c") {
      return data
            .filter((entry) => { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
            .map((entry) => { 
              return  { 
                Player: (entry.player.FirstName + " " + entry.player.LastName),
                RebPerGame: (entry.stats.RebPerGame["#text"]),
                GamesPlayed: (entry.stats.GamesPlayed["#text"]),
                MinSeconds: (entry.stats.MinSeconds["#text"]),
                Pts: (entry.stats.Pts["#text"]),
                FgAtt: (entry.stats.FgAtt["#text"]),
                FgMade: (entry.stats.FgMade["#text"]),
                Fg2PtMade: (entry.stats.Fg2PtMade["#text"]),
                Fg2PtAtt: (entry.stats.Fg2PtAtt["#text"]),
                Fg3PtMade: (entry.stats.Fg3PtMade["#text"]),
                Fg3PtAtt: (entry.stats.Fg3PtAtt["#text"]),
                FtAtt: (entry.stats.FtAtt["#text"]),
                FtMade: (entry.stats.FtMade["#text"]),
                OffReb: (entry.stats.OffReb["#text"]),
                DefReb: (entry.stats.DefReb["#text"]),
                Reb: (entry.stats.Reb["#text"]),
                Ast: (entry.stats.Ast["#text"]),
                Blk: (entry.stats.Blk["#text"]),
                Stl: (entry.stats.Stl["#text"]),
                Tov: (entry.stats.Tov["#text"]),
                FoulPers: (entry.stats.FoulPers["#text"])             
              } 
            });
    }

    if (option === "d") {
      return data
            .filter((entry) => { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
            .map((entry) => { 
              return  { 
                Player: (entry.player.FirstName + " " + entry.player.LastName),
                BlkPerGame: (entry.stats.BlkPerGame["#text"]),
                GamesPlayed: (entry.stats.GamesPlayed["#text"]),
                MinSeconds: (entry.stats.MinSeconds["#text"]),
                Pts: (entry.stats.Pts["#text"]),
                FgAtt: (entry.stats.FgAtt["#text"]),
                FgMade: (entry.stats.FgMade["#text"]),
                Fg2PtMade: (entry.stats.Fg2PtMade["#text"]),
                Fg2PtAtt: (entry.stats.Fg2PtAtt["#text"]),
                Fg3PtMade: (entry.stats.Fg3PtMade["#text"]),
                Fg3PtAtt: (entry.stats.Fg3PtAtt["#text"]),
                FtAtt: (entry.stats.FtAtt["#text"]),
                FtMade: (entry.stats.FtMade["#text"]),
                OffReb: (entry.stats.OffReb["#text"]),
                DefReb: (entry.stats.DefReb["#text"]),
                Reb: (entry.stats.Reb["#text"]),
                Ast: (entry.stats.Ast["#text"]),
                Blk: (entry.stats.Blk["#text"]),
                Stl: (entry.stats.Stl["#text"]),
                Tov: (entry.stats.Tov["#text"]),
                FoulPers: (entry.stats.FoulPers["#text"])             
            } 
          });
    }
  }

  function displayTable(table, tableId, rowId) {
    
    //set the table header for column three  
    let rank_header = "";

    if (tableId === 'table-pts-g') {
      rank_header = 'PTS/G';
    }

    if (tableId === 'table-ast-g') {
      rank_header = 'AST/G';
    }

    if (tableId === 'table-reb-g') {
      rank_header = 'REB/G';
    }

    if (tableId === 'table-blk-g') {
      rank_header = 'BLK/G';
    }

    //add table headers 
    document.getElementById(tableId).appendChild(
      createElement('tr',
        createElement('th', 'Rank'),
        createElement('th', 'Player'),
        createElement('th', rank_header),
        createElement('th', 'GP'),
        createElement('th', 'MIN'),
        createElement('th', 'PTS'),
        createElement('th', 'FGA'),
        createElement('th', 'FGM'),
        createElement('th', '2PM'),
        createElement('th', '2PA'),
        createElement('th', '3PM'),
        createElement('th', '3PA'),
        createElement('th', 'FTA'),
        createElement('th', 'FTM'),
        createElement('th', 'OREB'),
        createElement('th', 'DREB'),
        createElement('th', 'REB'),
        createElement('th', 'AST'),
        createElement('th', 'BLK'),
        createElement('th', 'STL'),
        createElement('th', 'TOV'),
        createElement('th', 'PF')
      ));

    table.forEach((player, i) => {   
      
      //for each player, create a row and add it to the appropriate table
      let row = document.getElementById(tableId).appendChild(createElement('tr'));
        
      //give each row an id of 'row'+i where i is the index of the ranked list
      setAttributes(row, { id: (rowId + i) });

      //add the ranking position to that row
      document.getElementById(rowId + i).appendChild(createElement( 'td', (i + 1).toString() ));

      //for each row, loop through all the properties and create a cell for each stat
      for (let stat in player) {
        document.getElementById(rowId + i).appendChild(createElement( 'td', player[stat] ));
      }
    });
  }

  function setTable(option) {
    let tableA = document.getElementById('section-table-a');
    let tableB = document.getElementById('section-table-b');
    let tableC = document.getElementById('section-table-c');
    let tableD = document.getElementById('section-table-d');

    if (option == "a") {
      removeClass(tableA, 'hidden');
      addClass(tableB, 'hidden');
      addClass(tableC, 'hidden');
      addClass(tableD, 'hidden');
    }

    if (option == "b") {
      addClass(tableA, 'hidden');
      removeClass(tableB, 'hidden');
      addClass(tableC, 'hidden');
      addClass(tableD, 'hidden');
    } 
    
    if (option == "c") {
      addClass(tableA, 'hidden');
      addClass(tableB, 'hidden');
      removeClass(tableC, 'hidden');
      addClass(tableD, 'hidden');
    }

    if (option == "d") {
      addClass(tableA, 'hidden');
      addClass(tableB, 'hidden');
      addClass(tableC, 'hidden');
      removeClass(tableD, 'hidden');
    }
  }

  function setSeason(option) {
    if (option === "a") {
      cumulative_player_data_url = STATS_2016_2017;
      profile_data_url = PROFILE_2016_2017;
    }

    if (option === "b") {
      cumulative_player_data_url = STATS_2015_2016;
      profile_data_url = PROFILE_2015_2016;
    }
  }

  return {

    init: function() {

      setNavBar();
      setAllStatsData();
      getComparePlayer();
      setSavePlayerList();
    }
  }; 
})();

module.exports = BasketballStatsPro;