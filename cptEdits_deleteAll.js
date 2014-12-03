require('firebase.js');
var utils = require('utils');
var fb = new Firebase("https://dazzling-torch-3393.firebaseio.com/AveroQueue");
var fb_caseData = new Firebase("https://dazzling-torch-3393.firebaseio.com/CaseData");
var counter = 0;
var casperCounter = 0;
		var marker={};
		marker.caseNumber = "SP14-014738";

var casper = require("casper").create({
	//verbose: true,
    //logLevel: "debug",
	onRunComplete: function onRunComplete() {
		casper.steps=[];
		casper.step=0;
		// Don't exit on complete.
		}
}).start('https://path.averodx.com/', function onStart() {
	if (casper.getTitle()=='Login') {
		casper.echo("Logging in...");
		casper.sendKeys("input[name='ctl00$LoginContent$MainLogin$UserName']", "mmuenster");
		casper.sendKeys("input[name='ctl00$LoginContent$MainLogin$Password']", "Password1");
		casper.click("input[name='ctl00$LoginContent$MainLogin$LoginButton']");
	}
	else if (casper.getTitle()=='Work List') {
		casper.echo ("You are already logged in");
	}

	casper.waitForSelector("input[name='ctl00$caseLaunchButton']", function onStartWFS() {
		casper.echo("Casper is loaded.");
	}, function onTimeout() {
		casper.echo("Timed Out!");
	}, 15000);
}).run()

setTimeout(function() {
	cptDeletesCase(marker);
	casper.run();
}, 7000);

function cptDeletesCase(marker, fbQueueItem) {
	casper.thenOpen("https://path.averodx.com/Custom/Avero/Billing/ChargePreview.aspx?CaseNo=" + marker.caseNumber, function () {
		console.log("cptDeletes " + marker.caseNumber + " Starting...");
		casper.evaluate(function() {
			UserID=101773; //This is Matt Muenster's id
			var lstAssignedCharges = document.getElementById("ctl00_DefaultContent_chargeEditControl_lstAssignedCharges");
			// total number of items in list
			var optsLength = lstAssignedCharges.options.length;
			// let loop through items and find out what is selected, if selected, add charges per quantity.
			for (var a = 0; a < optsLength; a++) {
				var valueplit = lstAssignedCharges.options[a].value.split("_");
				//This is a sleep function because the website requires the calls to be spaced out to work.
				APvX.Billing_WS.Charge_ReduceQuantity(valueplit[1], valueplit[0], valueplit[3], UserID, OnRemoveChargeSuccess, OnRemoveChargeSuccess );
				var start = new Date().getTime();
				for (var b = 0; b < 1e7; b++) {
					if ((new Date().getTime() - start) > 1000){
						break;
					}
				}
			}
		});
		casper.echo("cptDeletes on " + marker.caseNumber + " completed!\n");
		//fbQueueItem.ref().remove();	
	});
}
