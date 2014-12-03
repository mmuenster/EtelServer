var utils = require('utils');
require('firebase.js');
var fb = new Firebase("https://dazzling-torch-3393.firebaseio.com/AveroQueue");
var fb_caseData = new Firebase("https://dazzling-torch-3393.firebaseio.com/CaseData");

var casper = require('casper').create({
	pageSettings: { userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'},
	//verbose: true,
    //logLevel: "debug",
	onRunComplete: function() {
		casper.steps = [];  //Reset casper steps
		casper.step = 0;    //Reset casper to step 0
		// Don't exit on complete.
	}
	});

casper.start('https://path.averodx.com/', function() {
	var windowTitle = this.getTitle();
	console.log(windowTitle + " - I am in casper.start");
	if (windowTitle == "Login") {
		this.sendKeys("input[name='ctl00$LoginContent$MainLogin$UserName']", "mmuenster");
		this.sendKeys("input[name='ctl00$LoginContent$MainLogin$Password']", "Password1");
		this.thenClick("input[name='ctl00$LoginContent$MainLogin$LoginButton']");
	}
	
	this.waitForSelector("input[name='ctl00$caseLaunchButton']", function() {
	}, function onTimeout() {
		this.echo("Timed Out!");
	}, 15000);
});

casper.then(function() {
		this.sendKeys("input#ctl00_caseLaunchTextBox", "SP14-014667");
		this.thenClick("input#ctl00_caseLaunchButton");
		});


casper.waitForSelector("span#ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PatientSummaryTab_PatientName", function() {
	console.log("I am in casper.waitForSelector");
	fb_caseData.child('SP14-014667').once('value', function (dataSnapshot) {
		writeDataToEtel(dataSnapshot);
	}, function (err) {
		utils.dump(err + "\n There was an error retreiving the data.");
	});
});

casper.run(function() {
	console.log("I am in casper.run exit function.");
	//dont Exit 
});

function writeDataToEtel(dataSnapshot){
		var caseData= dataSnapshot.val();
		var pagehtml = casper.getHTML();
		casper.then(function() {
			this.evaluate(function() { ClinicalPopup(); });
			//this.click(input[onClick="Clinical Information");
			this.waitForPopup(/PatientHistoryDisplay/, function() {
				this.withPopup(/PatientHistoryDisplay/, function() {
					this.evaluate(function() { document.querySelector("textarea").value = "Something new."; });
					this.thenClick("input#btnSave")
					this.capture("avero.png");
					this.echo("got past the popup");
				});
			}, function onTimeout() {}, 15000);
			

		});
		casper.run();
	}

	
