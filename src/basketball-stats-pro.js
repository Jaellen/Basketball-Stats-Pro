"use strict";

/* FIND ALL INSTANCES OF 'TEMP' TO USE AJAX REQUEST AGAIN */

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
require("./css/main.scss");

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
  let current_season_picked;
  let player_profile, player_main_stats;
  let player_secondary_stats1, player_secondary_stats2;
  let player_team_name, player_team_list;
  let player_team_positions, player_team_jerseys;

  //compare stats variables
  let compare_player_a, compare_player_b;
  let player_a_profile, player_b_profile;
  let player_a_main_stats, player_b_main_stats;
  let player_a_sec_stats, player_b_sec_stats;
  let compare_player_clicked;

  //graphs and chart variables
  let data_doughnut1_main, data_doughnut2_main;
  let data_doughnut3_main, data_doughnut4_main, data_radar_main;
  let data_radar_compare_a, data_radar_compare_b;
  let data_bar_compare_a, data_bar_compare_b;
  let data_doughnut1_compare_a, data_doughnut1_compare_b;
  let data_doughnut2_compare_a, data_doughnut2_compare_b;
  let data_doughnut3_compare_a, data_doughnut3_compare_b;
  let data_doughnut4_compare_a, data_doughnut4_compare_b;

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

  //TEMP DATA FROM AJAX
  all_stats_data = require("./js/data1");
  all_profile_data = require("./js/data2");

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
  let setNav = function() {
    let button_a = document.getElementById('sidebar-stats');
    let button_b = document.getElementById('sidebar-compare');
    let button_c = document.getElementById('sidebar-rankings');
    let button_d = document.getElementById('sidebar-favourites');

    //button 'stats'
    button_a.addEventListener('click', function() { 
      //change page
      setNavRoute('a');
      //set title of current page and button to active
      setNavActive('a');
    }, false);

    //button 'compare'
    button_b.addEventListener('click', function() {
      //change page
      setNavRoute('b');
      //set title of current page and button to active
      setNavActive('b');
    }, false);
    
    //button 'rankings'
    button_c.addEventListener('click', function() {
      //change page
      setNavRoute('c');
      //set the title of current page and button to active
      setNavActive('c');
    }, false);

    //button 'favourites'
    button_d.addEventListener('click', function() {
      //change page
      setNavRoute('d');
      //set the title of current page and button to active
      setNavActive('d');
    }, false); 


    //setAdminBar 
    document.getElementById('header-season').addEventListener('click', function() {

    }, false);

    document.getElementById('header-settings').addEventListener('click', function() {
    
    }, false);

    document.getElementById('header-info').addEventListener('click', function() {
    
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
    player_profile = getPlayerProfile(all_profile_data, current_player_clicked);
    player_main_stats = getPlayerMainStats(all_stats_data, current_player_clicked);  
    player_secondary_stats1 = getPlayerSecondaryStats1(all_stats_data, current_player_clicked);
    player_secondary_stats2 = getPlayerSecondaryStats2(all_stats_data, current_player_clicked);
    current_season_picked = '2016-2017';

    //set player's team data
    player_team_name = getTeamName(all_stats_data, current_player_clicked);
    player_team_list = getTeamList(all_stats_data, current_player_clicked);
    player_team_positions = getTeamPositions(all_stats_data, current_player_clicked);
    player_team_jerseys = getTeamJerseyNumbers(all_stats_data, current_player_clicked);

    //set chart and graph data
    data_doughnut1_main = getDoughnutChart1Data(all_stats_data, current_player_clicked);
    data_doughnut2_main = getDoughnutChart2Data(all_stats_data, current_player_clicked);
    data_doughnut3_main = getDoughnutChart3Data(all_stats_data, current_player_clicked);
    data_doughnut4_main = getDoughnutChart4Data(all_stats_data, current_player_clicked);
    data_radar_main = getRadarChartData(all_stats_data, current_player_clicked);

    displayPlayerStats();
    displayMainCharts();
    displaySecondaryChart();
  };

  let displayPlayerStats = function() {

    let displayPlayerProfile = function() {
      
      //clear any previous results
      clearInnerHtml('profile-name', 'profile-team', 'profile-jersey', 
        'profile-position', 'profile-age', 'profile-height', 'profile-weight');

      //display profile info
      document.getElementById('profile-name').appendChild(createElement('p', player_profile.name));
      document.getElementById('profile-team').appendChild(createElement('p', player_profile.team));
      document.getElementById('profile-jersey').appendChild(createElement('p', player_profile.jersey, " | ",
                                                              createElement('span', player_profile.position)));
      document.getElementById('profile-age').appendChild(createElement('p', player_profile.age));
      document.getElementById('profile-height').appendChild(createElement('p', player_profile.height));
      document.getElementById('profile-weight').appendChild(createElement('p', player_profile.weight));
    }

    let displayPlayerMainStats = function() {
      
      //clear any previous results
      clearInnerHtml('stats-season', 'stats-season-text', 'stats-main');

      //display season
      document.getElementById('stats-season').appendChild(createElement('p', current_season_picked));
      document.getElementById('stats-season-text').appendChild(createElement('p', "per game stats"));

      //display stats table
      displayMainStatsTable(player_main_stats, 'table-stats-main');
    }

    let displayPlayerSecondaryStats = function() {
      
      //clear any previous results
      clearInnerHtml('secondary-stats-text');

      //display secondary stats section header text
      document.getElementById('secondary-stats-text').appendChild(createElement('p', current_season_picked));
      document.getElementById('secondary-stats-text').appendChild(createElement('p', "season stats"));

      //display stats table
      displaySecondaryStatsTable1(player_secondary_stats1, 'table1-stats-secondary');
      displaySecondaryStatsTable2(player_secondary_stats2, 'table2-stats-secondary');
    }

    let displayPlayerTeamName = function() {
      
      //clear any previous results and display player team name
      clearInnerHtml('team-name');
      document.getElementById('team-name').appendChild(createElement( 'div', player_team_name.toString(), " Team Players" ));
    }

    let displayPlayerTeamList = function() { 
      
      //clear any previous results 
      clearInnerHtml('team-list');
      
      //display each team player 
      //i = 1 in order to achieve a loop where every third element adds a break
      for (let i = 1; i <= player_team_list.length; i++ ) {

        //after every third element in the list, start a new line
        if (i % 3 === 0) {
        document.getElementById('team-list')
          .appendChild(createElement( 'span', 
                         createElement('a', player_team_list[(i-1)], " #", player_team_jerseys[(i-1)], " | ", player_team_positions[(i-1)] ) ))
          .setAttribute('id', player_team_list[(i-1)]);

        //note: these two lines are the difference between the if else code
        document.getElementById('team-list').appendChild(createElement('br'));
        document.getElementById('team-list').appendChild(createElement('br'));
        document.getElementById('team-list').appendChild(createElement('br'));
        }

        else {
          document.getElementById('team-list')
          .appendChild(createElement( 'span', 
                         createElement('a', player_team_list[(i-1)], " #", player_team_jerseys[(i-1)], " | ", player_team_positions[(i-1)] ) ))
          .setAttribute('id', player_team_list[(i-1)]);
        }

        //add a click event listener  
        document.getElementById(player_team_list[(i-1)]).addEventListener('click', function(event) {            
          current_player_clicked = event.currentTarget.getAttribute('id').toLowerCase();
          //display that player's data
          setPlayerStats();
        });

      }
    }

    displayPlayerProfile();
    displayPlayerMainStats();
    displayPlayerSecondaryStats();
    displayPlayerTeamName();
    displayPlayerTeamList();
  }

  let displayMainCharts = function() {
    
    //clear any previous results
    clearInnerHtml('doughnut-section-text');
    
    //display doughnut charts section header text
    document.getElementById('doughnut-section-text').appendChild(createElement('p', current_season_picked));
    document.getElementById('doughnut-section-text').appendChild(createElement('p', "key percentage stats"));

    //chart global config
    Chart.scaleService.updateScaleDefaults('linear', {
      ticks: {
        min: 0
      }
    })

    let setDoughnutChart1 = function() { 
      
      //clear any previous charts
      clearInnerHtml('doughnut1-section-main');

      //add a new canvas 
      let canvas_section = document.getElementById('doughnut1-section-main');
      let canvas = canvas_section.appendChild(createElement('canvas'));
      setAttributes(canvas, {id: 'doughnut-chart1-main'});

      //set the center number
      let center_number;
      if (player_main_stats.FgPct === "0.0" ) {
        center_number = "0";
      } 
      else {
        center_number = player_main_stats.FgPct;
      }

      canvas_section.appendChild(createElement('span', center_number));

      //create the new chart
      let chart = document.getElementById('doughnut-chart1-main');
      
      let data = {
        datasets: 
        [{
          data: data_doughnut1_main,
          backgroundColor: [
            "#FFCE56",
            "#4BC0C0"
          ],
          hoverBackgroundColor: [
            "#FFCE56",
            "#4BC0C0"
          ]
        }]
      };
  
      let myChart = new Chart(chart, {
        type: 'doughnut',
        data: data,
        animation: { animateScale: true },
        options: {
          responsive: false,
          cutoutPercentage: 80,
          events: [],
          title: {
            display: true,
            text: "Field Goal %",
            fontSize: 20,
            fontColor: "#9E9E9E"
          }
        }
      });
    } 

    let setDoughnutChart2 = function() { 
      
      //clear any previous charts
      clearInnerHtml('doughnut2-section-main');

      //add a new canvas 
      let canvas_section = document.getElementById('doughnut2-section-main');
      let canvas = canvas_section.appendChild(createElement('canvas'));
      setAttributes(canvas, {id: 'doughnut-chart2-main'});

      //set the center number
      let center_number;
      if (player_main_stats.FtPct === "0.0" ) {
        center_number = "0";
      } 
      else {
        center_number = player_main_stats.FtPct;
      }

      canvas_section.appendChild(createElement('span', center_number));

      //create the new chart
      let chart = document.getElementById('doughnut-chart2-main');
      
      let data = {
        datasets: 
        [{
          data: data_doughnut2_main,
          backgroundColor: [
            "#FFCE56",
            "#4BC0C0"
          ],
          hoverBackgroundColor: [
            "#FFCE56",
            "#4BC0C0"
          ]
        }]
      };
  
      let myChart = new Chart(chart, {
        type: 'doughnut',
        data: data,
        animation: { animateScale: true },
        options: {
          responsive: false,
          cutoutPercentage: 80,
          events: [],
          title: {
            display: true,
            text: "Free Throw %",
            fontSize: 20,
            fontColor: "#9E9E9E"
          }
        }
      });
    }     

    let setDoughnutChart3 = function() { 
      
      //clear any previous charts
      clearInnerHtml('doughnut3-section-main');

      //add a new canvas 
      let canvas_section = document.getElementById('doughnut3-section-main');
      let canvas = canvas_section.appendChild(createElement('canvas'));
      setAttributes(canvas, {id: 'doughnut-chart3-main'});

      //set the center number
      let center_number;
      if (player_main_stats.Fg2PtPct === "0.0" ) {
        center_number = "0";
      } 
      else {
        center_number = player_main_stats.Fg2PtPct;
      }

      canvas_section.appendChild(createElement('span', center_number));

      //create the new chart
      let chart = document.getElementById('doughnut-chart3-main');
      
      let data = {
        datasets: 
        [{
          data: data_doughnut3_main,
          backgroundColor: [
            "#FFCE56",
            "#4BC0C0"
          ],
          hoverBackgroundColor: [
            "#FFCE56",
            "#4BC0C0"
          ]
        }]
      };
  
      let myChart = new Chart(chart, {
        type: 'doughnut',
        data: data,
        animation: { animateScale: true },
        options: {
          responsive: false,
          cutoutPercentage: 80,
          events: [],
          title: {
            display: true,
            text: "2 Point %",
            fontSize: 20,
            fontColor: "#9E9E9E"
          }
        }
      });
    }  

    let setDoughnutChart4 = function() { 
      
      //clear any previous charts
      clearInnerHtml('doughnut4-section-main');

      //add a new canvas 
      let canvas_section = document.getElementById('doughnut4-section-main');
      let canvas = canvas_section.appendChild(createElement('canvas'));
      setAttributes(canvas, {id: 'doughnut-chart4-main'});

      //set the center number
      let center_number;
      if (player_main_stats.Fg3PtPct === "0.0" ) {
        center_number = "0";
      } 
      else {
        center_number = player_main_stats.Fg3PtPct;
      }
      
      canvas_section.appendChild(createElement('span', center_number));

      //create the new chart
      let chart = document.getElementById('doughnut-chart4-main');
      
      let data = {
        datasets: 
        [{
          data: data_doughnut4_main,
          backgroundColor: [
            "#FFCE56",
            "#4BC0C0"
          ],
          hoverBackgroundColor: [
            "#FFCE56",
            "#4BC0C0"
          ]
        }]
      };
  
      let myChart = new Chart(chart, {
        type: 'doughnut',
        data: data,
        animation: { animateScale: true },
        options: {
          responsive: false,
          cutoutPercentage: 80,
          events: [],
          title: {
            display: true,
            text: "3 Point %",
            fontSize: 20,
            fontColor: "#9E9E9E"
          }
        }
      });
    } 

    setDoughnutChart1();
    setDoughnutChart2();
    setDoughnutChart3();
    setDoughnutChart4();
  };

  let displaySecondaryChart = function() {

    //chart global config
    Chart.scaleService.updateScaleDefaults('linear', {
      ticks: {
        min: 0
      }
    })

    //display radar chart
    let setRadarChart = function() { 
      
      //clear any previous charts
      clearInnerHtml('radar-section-main');

      //add a new canvas 
      let canvas_section = document.getElementById('radar-section-main');
      let canvas = canvas_section.appendChild(createElement('canvas'));
      setAttributes(canvas, {id: 'radar-chart-main', width: '300', height: '300'});

      //create the new chart
      let chart = document.getElementById('radar-chart-main');

      let data = {
        labels: ["eFG%", "FT%", "3P%", "TS%", "2P%", "FG%"],
        datasets: [
          {
            label: toNameUpperCase(current_player_clicked),
            backgroundColor: "rgba(38,165,154,0.2)",
            borderColor: "rgba(75,192,192,1)",
            pointBackgroundColor: "rgba(38,165,154,1)",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "rgba(38,165,154,1)",
            pointHoverBorderColor: "rgba(75,192,192,1)",
            data: data_radar_main
          }
        ],
        yLabels: [0, 20, 40, 60, 80, 100]
      };
        
      let myRadarChart = new Chart(chart, {
        type: 'radar',
        data: data,
        options: {
          legend: {
            labels: {
              fontSize: 18,
              fontColor: "#939393",
              fontStyle: "bold"
            }
          },
          responsive: false,
          scale: {
            scaleLabel: {
              fontSize: 14,
              fontStyle: "bold"
            },    
            ticks: {
              beginAtZero: true,
              max: 100
            }
          },
        }
      });
    }

    setRadarChart();
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
      player_a_profile = getPlayerProfile(all_profile_data, compare_player_a);
      player_a_main_stats = getPlayerMainStats(all_stats_data, compare_player_a); 
      player_a_sec_stats = getPlayerSecondaryStats(all_stats_data, compare_player_a);
      data_radar_compare_a = getRadarChartData(all_stats_data, compare_player_a);
      data_bar_compare_a = getBarChartData(all_stats_data, compare_player_a);
      data_doughnut1_compare_a = getDoughnutChart1Data(all_stats_data, compare_player_a);
      data_doughnut2_compare_a = getDoughnutChart2Data(all_stats_data, compare_player_a);
    }
    
    if (slot === "b") {
      //update player_b_profile, player_b_main_stats, player_b_sec_stats
      player_b_profile = getPlayerProfile(all_profile_data, compare_player_b);
      player_b_main_stats = getPlayerMainStats(all_stats_data, compare_player_b); 
      player_b_sec_stats = getPlayerSecondaryStats(all_stats_data, compare_player_b);
      data_radar_compare_b = getRadarChartData(all_stats_data, compare_player_b); 
      data_bar_compare_b = getBarChartData(all_stats_data, compare_player_b);
      data_doughnut1_compare_b = getDoughnutChart1Data(all_stats_data, compare_player_b);
      data_doughnut2_compare_b = getDoughnutChart2Data(all_stats_data, compare_player_b);
    }

    displayComparePlayerStats();
    displayCompareCharts();
  };

  let displayComparePlayerStats = function() {

    let displayCompareProfiles = function() {

      //clear any previous results and display player a profile
      clearInnerHtml('profile-data-player-a');

      for (let prop in player_a_profile) {
            document.getElementById('profile-data-player-a').appendChild(createElement( 'li', player_a_profile[prop] ));
      }

      //clear any previous results and display player b profile
      clearInnerHtml('profile-data-player-b');

      for (let prop in player_b_profile) {
            document.getElementById('profile-data-player-b').appendChild(createElement( 'li', player_b_profile[prop] ));
      } 
    }

    let displayCompareMainStats = function() {
      
      //clear any previous results and display player a profile
      clearInnerHtml('stats-main-player-a');

      for (let stat in player_a_main_stats) {
            document.getElementById('stats-main-player-a').appendChild(createElement( 'li', player_a_main_stats[stat] ));
      }

      //clear any previous results and display player b profile
      clearInnerHtml('stats-main-player-b');

      for (let stat in player_b_main_stats) {
            document.getElementById('stats-main-player-b').appendChild(createElement( 'li', player_b_main_stats[stat] ));
      }
    }

    let displayCompareSecondaryStats = function() {
      
      //clear any previous results and display secondary stats of player a
      clearInnerHtml('secondary-stats-player-a');

      for (let stat in player_a_sec_stats) {
            document.getElementById('secondary-stats-player-a').appendChild(createElement( 'li', player_a_sec_stats[stat] ));
      }

      //clear any previous results and display secondary stats of player b
      clearInnerHtml('secondary-stats-player-b');

      for (let stat in player_b_sec_stats) {
            document.getElementById('secondary-stats-player-b').appendChild(createElement( 'li', player_b_sec_stats[stat] ));
      }
    }

    displayCompareProfiles();
    displayCompareMainStats();
    displayCompareSecondaryStats();
  }

  let displayCompareCharts = function() {
    
    //charts global config
    Chart.scaleService.updateScaleDefaults('linear', {
      ticks: {
        min: 0
      }
    })

    let setRadarCompareChart = function() { 
      
      //clear any previous charts
      clearInnerHtml('radar-section-compare');

      //add a new canvas 
      let canvas_section = document.getElementById('radar-section-compare');
      let canvas = canvas_section.appendChild(createElement('canvas'));
      setAttributes(canvas, {id: 'radar-chart-compare', width: '300', height: '300'});

      //create the new chart
      let chart = document.getElementById('radar-chart-compare');

      let data = {
        labels: ["eFG%", "FT%", "3P%", "TS%", "2P%", "FG%"],
        datasets: [
          {
            label: compare_player_a,
            backgroundColor: "rgba(75,192,192,0.2)",
            borderColor: "rgba(75,192,192,1)",
            pointBackgroundColor: "rgba(75,192,192,1)",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgba(75,192,192,1)",
            data: data_radar_compare_a
          },
          {
            label: compare_player_b,
            backgroundColor: "rgba(255,61,103,0.2)",
            borderColor: "rgba(255,61,103,1)",
            pointBackgroundColor: "rgba(255,61,103,1)",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgba(255,61,103,1)",
            data: data_radar_compare_b
          }
        ],
        yLabels: [0, 20, 40, 60, 80, 100]
      };
        
      let myRadarChart = new Chart(chart, {
        type: 'radar',
        data: data,
        options: {
          responsive: false,
          scale: {
            ticks: {
              beginAtZero: true,
              max: 100
            }
          }
        }
      });
    }

    let setBarCompareChart = function() {

      //clear any previous charts
      clearInnerHtml('bar-section-compare');

      //add a new canvas 
      let canvas_section = document.getElementById('bar-section-compare');
      let canvas = canvas_section.appendChild(createElement('canvas'));
      setAttributes(canvas, {id: 'bar-chart-compare', width: '400', height: '300'});

      //create the new chart
      let chart = document.getElementById('bar-chart-compare');
      
      var data = {
        labels: ["PTS/G", "AST/G", "REB/G", "BLK/G", "PF/G", "2PM/G", "3PM/G"],
        datasets: [
          {
            label: compare_player_a,
            backgroundColor: [
              'rgba(34,206,206,0.2)',
              'rgba(34,206,206,0.2)',
              'rgba(34,206,206,0.2)',
              'rgba(34,206,206,0.2)',
              'rgba(34,206,206,0.2)',
              'rgba(34,206,206,0.2)',
              'rgba(34,206,206,0.2)'
            ],
            borderColor: [
              'rgba(34,206,206,1)',
              'rgba(34,206,206,1)',
              'rgba(34,206,206,1)',
              'rgba(34,206,206,1)',
              'rgba(34,206,206,1)',
              'rgba(34,206,206,1)',
              'rgba(34,206,206,1)'
            ],
            borderWidth: 1,
            data: data_bar_compare_a
          },
          {
            label: compare_player_b,
            backgroundColor: [
              'rgba(255,61,103,0.2)',
              'rgba(255,61,103,0.2)',
              'rgba(255,61,103,0.2)',
              'rgba(255,61,103,0.2)',
              'rgba(255,61,103,0.2)',
              'rgba(255,61,103,0.2)',
              'rgba(255,61,103,0.2)'
            ],
            borderColor: [
              'rgba(255,61,103,1)',
              'rgba(255,61,103,1)',
              'rgba(255,61,103,1)',
              'rgba(255,61,103,1)',
              'rgba(255,61,103,1)',
              'rgba(255,61,103,1)',
              'rgba(255,61,103,1)'
            ],
            borderWidth: 1,
            data: data_bar_compare_b,
          }
        ],
        xLabels: [0, 5, 10, 15, 20, 25, 30, 35, 40]
      };

      let myBarChart = new Chart(chart, {
        type: 'horizontalBar',
        data: data
      });
    }

    let setDoughnutCompareChart1 = function() {

      //clear any previous charts
      clearInnerHtml('doughnut1-section-compare');

      //add a new canvas 
      let canvas_section = document.getElementById('doughnut1-section-compare');
      let canvas = canvas_section.appendChild(createElement('canvas'));
      setAttributes(canvas, {id: 'doughnut-chart1-compare', width: '300', height: '300'});

      //create the new chart
      let chart = document.getElementById('doughnut-chart1-compare');
      
      let data = 
      {
        labels: ["FGA", "FGM", "FGA2", "FGA2"],
        datasets: 
        [{
          data: data_doughnut1_compare_a,
          backgroundColor: 
          [
            "#22CECE",
            "#D3F5F5"
          ],
          hoverBackgroundColor: 
          [
            "#22CECE",
            "#D3F5F5"
          ]
         },
         {
          data: data_doughnut1_compare_b,
          backgroundColor: 
          [
            "#FF6384",
            "#FFE0E6"
          ],
          hoverBackgroundColor: [
            "#FF6384",
            "#FFE0E6"
          ]
        }]
      }
  
      let myChart = new Chart(chart, {
        type: 'doughnut',
        data: data,
        animation: { animateScale: true },
        options: {
          responsive: false
        }
      });
    }

    let setDoughnutCompareChart2 = function() {
      
      //clear any previous charts
      clearInnerHtml('doughnut2-section-compare');

      //add a new canvas 
      let canvas_section = document.getElementById('doughnut2-section-compare');
      let canvas = canvas_section.appendChild(createElement('canvas'));
      setAttributes(canvas, {id: 'doughnut-chart2-compare', width: '300', height: '300'});

      //create the new chart
      let chart = document.getElementById('doughnut-chart2-compare');
      
      let data = {
        labels: ["FTA", "FTM"],
        datasets: 
        [{
          data: data_doughnut2_compare_a,
          backgroundColor: 
          [
            "#22CECE",
            "#D3F5F5"
          ],
          hoverBackgroundColor: 
          [
            "#22CECE",
            "#D3F5F5"
          ]
        },
        {
          data: data_doughnut2_compare_b,
          backgroundColor: 
          [
            "#FF6384",
            "#FFE0E6"
          ],
          hoverBackgroundColor: 
          [
            "#FF6384",
            "#FFE0E6"
          ]
        }]
      };
  
      let myChart = new Chart(chart, {
        type: 'doughnut',
        data: data,
        animation: { animateScale: true },
        options: {
          responsive: false
        }
      });
    }

    setRadarCompareChart();
    setBarCompareChart();
    setDoughnutCompareChart1();
    setDoughnutCompareChart2();
  };

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
    
    //clear any previous list
    clearInnerHtml('favourites');

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
        setCurrentRankingsTable("a");
      }, false);

      document.getElementById('button-ast-g').addEventListener('click', function() {
        setCurrentRankingsTable("b");
      }, false);
      
      document.getElementById('button-reb-g').addEventListener('click', function() {
        setCurrentRankingsTable("c");
      }, false); 

      document.getElementById('button-blk-g').addEventListener('click', function() {
        setCurrentRankingsTable("d");
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
    clearInnerHtml('table-pts-g', 'table-ast-g', 'table-reb-g', 'table-blk-g');

    //display tables
    displayRankingsTable(table_a, 'table-pts-g', 'table-a');
    displayRankingsTable(table_b, 'table-ast-g', 'table-b');
    displayRankingsTable(table_c, 'table-reb-g', 'table-c');
    displayRankingsTable(table_d, 'table-blk-g', 'table-d');
  };

  let setChangeSeason = function() {

    // //change season to 2015/2016
    // document.getElementById('seasonA').addEventListener('click', function() {
      
    //   //case: clicked season is already selected
    //   if (cumulative_player_data_url === STATS_2016_2017) {
    //     return;
    //   }

    //   //change source data  
    //   setSeason("a");

    //   //reset main page stats and ranking tables 
    //   // setAllStatsData(); TEMP!! REMOVE COMMENT TO USE AJAX REQUEST 

    //   //case: if stats already being displayed, reset those
    //   if (current_player_clicked !== undefined) {
    //     setPlayerStats();
    //   }

    // }, false);

    // //change season to 2016/2017
    // document.getElementById('seasonB').addEventListener('click', function() {

    //   //case: clicked season is already selected
    //   // if (cumulative_player_data_url === STATS_2015_2016) {
    //   //   return;
    //   // }
      
    //   //change source data  
    //   setSeason("b");

    //   //reset main page stats and ranking tables 
    //   // setAllStatsData(); TEMP!! REMOVE COMMENT TO USE AJAX REQUEST 

    //   //case: if stats already being displayed, reset those
    //   // if (current_player_clicked !== undefined) {
    //   //   setPlayerStats();
    //   // }

    // }, false);

    /* old buttons
      <div class="col-md-4">
        <button class="btn btn-warning" id="seasonA">2016/2017</button>
        <button class="btn btn-warning" id="seasonB">2015/2016</button>
      </div> 
    */
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
    for(let key in attrs) {
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

  function clearInnerHtml(ids) {
    //can take multiple arguments  
    for(let id in arguments) {
      document.getElementById(arguments[id]).innerHTML = "";
    }
  }

  //navbar utilities 
  function setNavRoute(option) {
    let pageA = document.getElementById('stats-page');
    let pageB = document.getElementById('compare-page');
    let pageC = document.getElementById('rankings-page');
    let pageD = document.getElementById('favourites-page');

    if (option === 'a') {
      removeClass(pageA, 'hidden');
      addClass(pageB, 'hidden');
      addClass(pageC, 'hidden');
      addClass(pageD, 'hidden');
    }

    if (option === 'b') {
      addClass(pageA, 'hidden');
      removeClass(pageB, 'hidden');
      addClass(pageC, 'hidden');
      addClass(pageD, 'hidden');
    } 
    
    if (option === 'c') {
      addClass(pageA, 'hidden');
      addClass(pageB, 'hidden');
      removeClass(pageC, 'hidden');
      addClass(pageD, 'hidden');
    }

    if (option === 'd') {
      addClass(pageA, 'hidden');
      addClass(pageB, 'hidden');
      addClass(pageC, 'hidden');
      removeClass(pageD, 'hidden');
    }
  }

  function setNavActive(option) {
    let title_div = document.getElementById('title-div')
    let button_a = document.getElementById('sidebar-stats');
    let button_b = document.getElementById('sidebar-compare');
    let button_c = document.getElementById('sidebar-rankings');
    let button_d = document.getElementById('sidebar-favourites');

    if (option === 'a') {
      //clear current title
      title_div.innerHTML = '';

      //set the title of the clicked page
      title_div.appendChild(
        createElement('h1', 
          createElement('span', "Basketball Stats Pro |"), " stats overview"));
    
      //set the button clicked to active
      addClass(button_a, 'sidebar-active');

      //remove active class from previously clicked button
      removeClass(button_b, 'sidebar-active');
      removeClass(button_c, 'sidebar-active');
      removeClass(button_d, 'sidebar-active');
    }

    if (option === 'b') {
      //clear current title
      title_div.innerHTML = '';

      //set the title of the clicked page
      title_div.appendChild(
        createElement('h1', 
          createElement('span', "Basketball Stats Pro |"), " compare players"));

      //set the button clicked to active
      addClass(button_b, 'sidebar-active');

      //remove active class from previously clicked button
      removeClass(button_a, 'sidebar-active');
      removeClass(button_c, 'sidebar-active');
      removeClass(button_d, 'sidebar-active');
    } 
    
    if (option === 'c') {
      //clear current title
      title_div.innerHTML = '';

      //set the title of the clicked page
      title_div.appendChild(
        createElement('h1', 
          createElement('span', "Basketball Stats Pro |"), " player rankings"));

      //set the button clicked to active
      addClass(button_c, 'sidebar-active');

      //remove active class from previously clicked button
      removeClass(button_a, 'sidebar-active');
      removeClass(button_b, 'sidebar-active');
      removeClass(button_d, 'sidebar-active');
    }

    if (option === 'd') {
      //clear the title of current page
      title_div.innerHTML = '';

      //set the title of the clicked page
      title_div.appendChild(
        createElement('h1', 
          createElement('span', "Basketball Stats Pro |"), " saved players"));

      //set the button clicked to active
      addClass(button_d, 'sidebar-active');

      //remove active class from previously clicked button
      removeClass(button_a, 'sidebar-active');
      removeClass(button_b, 'sidebar-active');
      removeClass(button_c, 'sidebar-active');

      //set the button clicked to active
      let button_clicked = document.getElementById('sidebar-favourites');
      addClass(button_clicked, 'sidebar-active');
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
    let array = data
      .filter((entry) => { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === player_clicked })
      .map((entry) => { 
        return  { 
          name: (entry.player.FirstName + " " + entry.player.LastName),
          team: (entry.team.City + " " + entry.team.Name),
          jersey: ("#" + entry.player.JerseyNumber),
          position: (entry.player.Position),
          age: (entry.player.Age + "yrs"),
          height: (entry.player.Height + " ft\'in" ),
          weight: (entry.player.Weight + " lbs") 
        } 
      });
    return array[0];
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
    let array = data
      .filter((entry) => { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
      .filter((entry) => { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === player_clicked })
      .map((entry) => { 
        return  { 
          PtsPerGame: (entry.stats.PtsPerGame["#text"]),
          AstPerGame: (entry.stats.AstPerGame["#text"]),
          RebPerGame: (entry.stats.RebPerGame["#text"]),
          BlkPerGame: (entry.stats.BlkPerGame["#text"]),
          FoulPersPerGame: (entry.stats.FoulPersPerGame["#text"]),
          FgPct: (entry.stats.FgPct["#text"]),
          FtPct: (entry.stats.FtPct["#text"]),
          Fg2PtPct: (entry.stats.Fg2PtPct["#text"]),
          Fg3PtPct: (entry.stats.Fg3PtPct["#text"]),
          Fg2PtMadePerGame: (entry.stats.Fg2PtMadePerGame["#text"]),
          Fg3PtMadePerGame: (entry.stats.Fg3PtMadePerGame["#text"]),
          EFgPct: (getEfgPct(entry)),
          TsPct: (getTsPct(entry)),
          PlusMinus: (entry.stats.PlusMinus["#text"]),
          MinSecondsPerGame: ( (Number(entry.stats.MinSecondsPerGame["#text"]) / 60).toPrecision(3) )
        } 
      });
      return array[0];
  }
  
  function displayMainStatsTable(data, tableId) {
    
    //clear any current table
    clearInnerHtml(tableId);

    //create table headers 
    document.getElementById(tableId).appendChild(
      createElement('tr',
        createElement('th', 'PTS/G'),
        createElement('th', 'AST/G'),
        createElement('th', 'REB/G'),
        createElement('th', 'BLK/G'),
        createElement('th', 'PF/G'),
        createElement('th', 'FG%'),
        createElement('th', 'FT%'),
        createElement('th', '2P%'),
        createElement('th', '3P%'),
        createElement('th', '2PM/G'),
        createElement('th', '3PM/G'),
        createElement('th', 'eFG%'),
        createElement('th', 'TS%'),
        createElement('th', '+/-'),
        createElement('th', 'MIN/G')
      ));

    //create a row for the stats
    let row = document.getElementById(tableId).appendChild(createElement('tr'));
    setAttributes(row, {id: 'stats-row'});

    //display each stat
    for (let stat in data) {
      document.getElementById('stats-row').appendChild(createElement('td', data[stat]));  
    }
  }

  function getPlayerSecondaryStats1(data, player_clicked) {
    let array = data
      .filter((entry) => { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
      .filter((entry) => { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === player_clicked })
      .map((entry) => { 
        return  { 
          GamesPlayed: (entry.stats.GamesPlayed["#text"]),
          MinSeconds: ((Number(entry.stats.MinSeconds["#text"]) / 60).toPrecision(3)),
          Pts: (entry.stats.Pts["#text"]),
          FgAtt: (entry.stats.FgAtt["#text"]),
          FgMade: (entry.stats.FgMade["#text"]),
          Fg2PtMade: (entry.stats.Fg2PtMade["#text"]),
          Fg2PtAtt: (entry.stats.Fg2PtAtt["#text"]),
          Fg3PtMade: (entry.stats.Fg3PtMade["#text"]),
          Fg3PtAtt: (entry.stats.Fg3PtAtt["#text"])
          } 
      });
    return array[0];
  }

  function getPlayerSecondaryStats2(data, player_clicked) {
    let array = data
      .filter((entry) => { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
      .filter((entry) => { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === player_clicked })
      .map((entry) => { 
        return  { 
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
    return array[0];
  }

  function displaySecondaryStatsTable1(data, tableId) {
    
    //clear any current table
    clearInnerHtml(tableId);

    //create table headers 
    document.getElementById(tableId).appendChild(
      createElement('tr',
        createElement('th', 'GP'),
        createElement('th', 'MIN'),
        createElement('th', 'PTS'),
        createElement('th', 'FGA'),
        createElement('th', 'FGM'),
        createElement('th', '2PM'),
        createElement('th', '2PA'),
        createElement('th', '3PM'),
        createElement('th', '3PA')
      ));

    //create a row for the stats
    let row = document.getElementById(tableId).appendChild(createElement('tr'));
    setAttributes(row, {id: 'stats-row-table1'});

    //display each stat
    for (let stat in data) {
      document.getElementById('stats-row-table1').appendChild(createElement('td', data[stat]));  
    }
  }

  function displaySecondaryStatsTable2(data, tableId) {
    
    //clear any current table
    clearInnerHtml(tableId);

    //create table headers 
    document.getElementById(tableId).appendChild(
      createElement('tr',
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

    //create a row for the stats
    let row = document.getElementById(tableId).appendChild(createElement('tr'));
    setAttributes(row, {id: 'stats-row-table2'});

    //display each stat
    for (let stat in data) {
      document.getElementById('stats-row-table2').appendChild(createElement('td', data[stat]));  
    }
  }

  function getPlayerSecondaryStats(data, player_clicked) {
    let array = data
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
    return array[0];
  }

  function getTeamName(data, player_clicked) {
    let array = data
      .filter((entry) => { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
      .filter((entry) => { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === player_clicked })
      .map((entry) => { return entry.team.City + " " + entry.team.Name });
    return array[0];
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

  function getTeamJerseyNumbers(data, player_clicked) {
    return data
      .filter((entry) => { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
      .filter((entry) => { return (entry.team.City + " " + entry.team.Name) === player_team_name.toString() })
      .filter((entry) => { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() !== player_clicked }) //remove repeat
      .map((entry) => { return entry.player.JerseyNumber });
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

  function getBarChartData(data, player_clicked) {
    //return an array with numbers for the chart
    let array = data
      .filter((entry) => { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
      .filter((entry) => { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === player_clicked })
      .map((entry) => { return [ 
          Number(entry.stats.PtsPerGame["#text"]), 
          Number(entry.stats.AstPerGame["#text"]),
          Number(entry.stats.RebPerGame["#text"]),
          Number(entry.stats.BlkPerGame["#text"]),
          Number(entry.stats.FoulPersPerGame["#text"]),
          Number(entry.stats.Fg2PtMadePerGame["#text"]),
          Number(entry.stats.Fg3PtMadePerGame["#text"])
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
          Number(entry.stats.FgMade["#text"]), 
          Number( Number(entry.stats.FgAtt["#text"]) - Number(entry.stats.FgMade["#text"]) )
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
          Number(entry.stats.FtMade["#text"]), 
          Number( Number(entry.stats.FtAtt["#text"]) - Number(entry.stats.FtMade["#text"]) )
        ]
      });

    return array[0];
  }

  function getDoughnutChart3Data(data, player_clicked) {
    //return an array with numbers for the chart
    let array = data
      .filter((entry) => { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
      .filter((entry) => { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === player_clicked })
      .map((entry) => { return [ 
          Number(entry.stats.Fg2PtPct["#text"]), 
          Number( 100 - Number(entry.stats.Fg2PtPct["#text"]) )
        ]
      });

    return array[0];
  }

  function getDoughnutChart4Data(data, player_clicked) {
    //return an array with numbers for the chart
    let array = data
      .filter((entry) => { return (entry.stats.PtsPerGame !== undefined) }) //filter out undefined stats in the data set
      .filter((entry) => { return (entry.player.FirstName + " " + entry.player.LastName).toLowerCase() === player_clicked })
      .map((entry) => { return [ 
          Number(entry.stats.Fg3PtPct["#text"]), 
          Number( 100 - Number(entry.stats.Fg3PtPct["#text"]) )
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

  function displayRankingsTable(table, tableId, rowId) {
    
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

  function setCurrentRankingsTable(option) {
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

      setNav();
      // setAllStatsData(); TEMP!! REMOVE TO USE AJAX REQUEST
      setSearch(); //TEMP!! REMOVE THIS LINE ONCE COMMENT ABOVE REMOVED!
      setRankingsTables(); //TEMP!! REMOVE THIS LINE ONCE COMMENT ABOVE REMOVED!
      
      getComparePlayer();
      setSavePlayerList();
    }
  }; 
})();

module.exports = BasketballStatsPro;