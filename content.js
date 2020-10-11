// Load Google Charts.
var charts = document.createElement("script");
charts.src = "https://www.gstatic.com/charts/loader.js";
(document.head || document.documentElement).appendChild(charts);
charts.onload = function() {
  charts.remove();
};

// Inject the main script.
var main_script = document.createElement("script");
main_script.src = chrome.extension.getURL("iresultview.js");
(document.head || document.documentElement).appendChild(main_script);
main_script.onload = function() {
  main_script.remove();
};
