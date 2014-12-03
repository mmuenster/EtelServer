require('firebase.js');
var utils = require('utils');
var fb = new Firebase("https://dazzling-torch-3393.firebaseio.com/Statistics");
var counter = 0;
var casperCounter = 0;
var newdata = {};

var casper = require("casper").create({
	//verbose: true,
    //logLevel: "debug",
	onRunComplete: function onRunComplete() {
		casper.steps=[];
		casper.step=0;
		// Don't exit on complete.
		}
}).start('https://path.averodx.com/', function onStart() {
	if (casper.getTitle()==='Login') {
		casper.echo("Logging in...");
		casper.sendKeys("input[name='ctl00$LoginContent$MainLogin$UserName']", "mmuenster");
		casper.sendKeys("input[name='ctl00$LoginContent$MainLogin$Password']", "Password1");
		casper.click("input[name='ctl00$LoginContent$MainLogin$LoginButton']");
	}
	else if (casper.getTitle()==='Work List') {
		casper.echo ("You are already logged in");
	}

	casper.waitForSelector("input[name='ctl00$caseLaunchButton']", function onStartWFS() {
		casper.echo("Casper is loaded.");
	}, function onTimeout() {
		casper.echo("Timed Out!");
	}, 15000);
}).run();

casper.then(function() {
	casper.evaluate(function() {
		document.getElementById("ctl00_DefaultContent_WorklistCtrl_WorklistSelect").value = "Reported";
		document.getElementById("ctl00_DefaultContent_WorklistCtrl_drpColumnFilter").value = "ISNULL(ORDERS.Person_GetName(ADPerson.PersonID), ''<Unassigned>'')";
		document.getElementById("ctl00_DefaultContent_WorklistCtrl_FilterValue").value = "Muenster";
		document.getElementById("ctl00_DefaultContent_WorklistCtrl_StartDate").value = "8/24/2014";
		document.getElementById("ctl00_DefaultContent_WorklistCtrl_drpPageSize").value="50";
	});
	casper.thenClick("input#ctl00_DefaultContent_WorklistCtrl_newSearch", function() {
		casper.waitForSelector("table#ctl00_DefaultContent_WorklistCtrl_WorklistView", function() {
			var currentPageCases = casper.evaluate(function() {
				return document.getElementById("ctl00_DefaultContent_WorklistCtrl_WorklistView").rows.length	//header and pagination rows
			}) - 2;

			for(counter=1; counter <= currentPageCases; counter++) {
				var caseNumber =casper.evaluate(function(index) {
					return document.getElementById("ctl00_DefaultContent_WorklistCtrl_WorklistView").rows[index].cells[0].innerHTML;
					}, counter);
				var caseDate =casper.evaluate(function(index) {
					return document.getElementById("ctl00_DefaultContent_WorklistCtrl_WorklistView").rows[index].cells[12].innerHTML;
					}, counter);
				caseDate=caseDate.replace(/\//g, "-").split(" ")[0]
				newdata[caseDate]= caseNumber + "duh";
				fb.update(newdata);
			}

			//document.getElementById("ctl00_DefaultContent_WorklistCtrl_WorklistView").rows[51].cells[0].firstChild.rows[0].cells.length	
		});

	});
});

casper.run();
