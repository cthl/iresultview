// Wait for result tables to become available.
var tbody_race = null;
var tbody_qual = null;
var tbody_prac = null;
var checker = setInterval(check_tables, 100);
function check_tables()
{
  tbody_race = document.querySelector("#resultsDiv > div.single-results-container.window-0 > table > tbody");  
  tbody_qual = document.querySelector("#resultsDiv > div.single-results-container.window--1 > table > tbody");
  tbody_prac = document.querySelector("#resultsDiv > div.single-results-container.window--2 > table > tbody");
  if (tbody_race && tbody_qual && tbody_prac) {
    clearInterval(checker);
    iresultview_main();
  }
}

function iresultview_main()
{
  // Check if dynamic weather was used for the session.
  if (result.weather.weatherType == 1 || result.weather.weatherType == 2) {
    update_weather(result);
  }

  // Highlight own result.
  highlight_self(result, tbody_race);
  highlight_self(result, tbody_qual);
  highlight_self(result, tbody_prac);

  // Add divisions for laptime charts.
  var result_div = document.querySelector("#resultsDiv");
  var padding = result_div.removeChild(result_div.lastChild);
  var fastest_qual_lap_div = document.createElement("div");
  var fastest_race_lap_div = document.createElement("div");
  var avg_race_lap_div = document.createElement("div");
  result_div.appendChild(fastest_qual_lap_div);
  result_div.appendChild(fastest_race_lap_div);
  result_div.appendChild(avg_race_lap_div);
  result_div.appendChild(padding);

  google.charts.load("current", {"packages": ["corechart"]});
  google.charts.setOnLoadCallback(draw_all_laptime_charts);

  function draw_all_laptime_charts()
  {
    draw_laptime_chart(fastest_qual_lap_div, -1, "fastestlaptime", "Fastest Qualifying Lap");
    draw_laptime_chart(fastest_race_lap_div, 0, "fastestlaptime", "Fastest Race Lap");
    draw_laptime_chart(avg_race_lap_div, 0, "avglaptime", "Average Race Lap");
  }
}

function update_weather(result)
{
  // Get the table element that contains the weather data.
  var td = document.querySelector("#eventresults > div > div.single-results-container.summary > table > tbody > tr:nth-child(3) > td.event_datawidth15.Conditions-TD");

  td.appendChild(document.createElement("br"));

  // Insert actual weather data.
  var p = document.createElement("p");
  p.style.color = "#b0b0b0";
  var b = p.appendChild(document.createElement("b"));
  // Header
  b.appendChild(document.createTextNode("Dynamic Weather Details:"));
  p.appendChild(document.createElement("br"));
  // Temperature
  var temp_str = get_temp_str(result.weather.tempValue, result.weather.tempUnits);
  p.appendChild(document.createTextNode("Temperature: " + temp_str));
  p.appendChild(document.createElement("br"));
  // Wind
  var wind_dir = get_wind_dir(result.weather.windDir);
  var speed_str = get_speed_str(result.weather.windSpeedValue, result.weather.windSpeedUnits);
  p.appendChild(document.createTextNode("Wind: " + wind_dir + " @ " + speed_str));
  p.appendChild(document.createElement("br"));
  // Humidity
  p.appendChild(document.createTextNode("Humidity: " + result.weather.RH + "%"));
  p.appendChild(document.createElement("br"));
  // Fog
  p.appendChild(document.createTextNode("Fog: " + result.weather.fogDensity + "%"));
  p.appendChild(document.createElement("br"));
  // Skies
  var skies_str = get_skies_str(result.weather.skies);
  p.appendChild(document.createTextNode("Skies: " + skies_str));
  td.appendChild(p);
}

function get_temp_str(temp, unit_id)
{
  var temp_C, temp_F;

  if (unit_id == 0) {
    temp_F = temp;
    temp_C = temp_F2C(temp);
  }
  else {
    temp_C = temp;
    temp_F = temp_C2F(temp);
  }

  return temp_C + "\u2103 (" + temp_F + "\u2109)";
}

function temp_F2C(temp_F)
{
  return ((temp_F - 32.0)*5.0/9.0).toFixed(0);
}

function temp_C2F(temp_C)
{
  return (temp_C*9.0/5.0 + 32.0).toFixed(0);
}

function get_speed_str(speed, unit_id)
{
  var speed_kph, speed_mph;

  if (unit_id == 0) {
    speed_mph = speed;
    speed_kph = speed_mph2kph(speed);
  }
  else {
    speed_kph = speed;
    speed_mph = speed_kph2mph(speed);
  }

  return speed_kph + "kph (" + speed_mph + "mph)";
}

function speed_mph2kph(speed)
{
  return (1.60934*speed).toFixed(0);
}

function speed_kph2mph(speed)
{
  return (speed/1.60934).toFixed(0);
}

function get_wind_dir(wind_dir_id)
{
  var wind_dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

  return wind_dirs[wind_dir_id];
}

function get_speed_unit(speed_unit_id)
{
  var units = ["mph", "km/h"];

  return units[speed_unit_id];
}

function get_skies_str(skies_id)
{
  var skies_strs = ["Clear", "Partly Cloudy", "Mostly Cloudy", "Overcast"];

  return skies_strs[skies_id];
}

function highlight_self(result, tbody)
{
  for (i = 0; i < tbody.rows.length; i++) {
    var data = tbody.rows[i].data;

    if (data != undefined) {
      // Check if the current row shows the user's own result.
      if (data.custid == result.custid) {
        tbody.rows[i].bgColor = "#a1e7ed";
        // Make sure that dark table rows do not overwrite the background color.
        tbody.rows[i].className = "none";
      }
    }
  }
}

function draw_laptime_chart(div, session_id, time_id, title)
{
  // Create the array of iRatings and laptimes.
  var num_drivers = result.sessionResults[session_id].length;
  var raw_data = [["iRating", "Laptime", "Laptime (Self)"]];

  var max_time = 0.0;
  var min_time = 999999.0;
  for (i = 0; i < num_drivers; i++) {
    var driver_result = result.sessionResults[session_id][i];

    // Get driver's (new) iRating.
    var ir = (+driver_result.newiRating);

    // Get driver's laptime and convert to a floating point number.
    var time_str = driver_result[time_id];
    time_str = time_str.replace(".", ":");
    var time_vals = time_str.split(":");
    var time = 60.0*(+time_vals[0]) + (+time_vals[1]) + 0.001*(+time_vals[2]);

    // Keep track of fastest and slowest times.
    if (time > max_time) {
      max_time = time;
    }
    if (time < min_time) {
      min_time = time;
    }

    if (driver_result.custid == result.custid) {
      // Add user's laptime to its own column so it is plotted differently.
      raw_data.push([ir, null, time]);
    }
    else {
      // Add other driver's laptime.
      raw_data.push([ir, time, null]);
    }
  }

  // Create ticks for the laptime axis.
  min_time = Math.floor(min_time);
  max_time = Math.ceil(max_time);
  ticks = [];
  for (t = min_time; t <= max_time + 0.0001; t += 1.0) {
    var mins = Math.floor(t/60.0);
    var secs = (t - 60.0*mins).toFixed(0);

    ticks.push({v: t, f: mins + ":" + (secs < 10 ? "0" : "") + secs});
  }

  // Convert to Google Charts data.
  var data = google.visualization.arrayToDataTable(raw_data);

  // Set chart options.
  var options = {
    title: title,
    legend: {position: "none"},
    hAxis: {title: "iRating"},
    vAxis: {title: "Laptime", ticks: ticks},
    width: 400,
    height: 400,
    lineWidth: 0,
    colors: ["blue", "magenta"],
    series: {
      0: {pointShape: "circle", pointSize: 3},
      1: {pointShape: "star", pointSize: 10}
    }
  };

  // Draw the chart.
  var chart = new google.visualization.LineChart(div);
  chart.draw(data, options);
}
