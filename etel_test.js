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
		this.sendKeys("input#ctl00_caseLaunchTextBox", "SP14-011799");
		this.thenClick("input#ctl00_caseLaunchButton");
		});

casper.waitForSelector("span#ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PatientSummaryTab_PatientName", function() {
	console.log("I am in casper.waitForSelector");
	var pagehtml = casper.getHTML();
	var coi = pagehtml.match(/\d+\$UpdateProfessionalPanel/g);
	coi[0]=coi[0].slice(0,8);
	coi[1]=coi[1].slice(0,8);
	coi[2]=coi[2].slice(0,8);
	var caseData = {};

	caseData.diagnosisId = "ctl00_DefaultContent_ResultPanel_ctl01_ResultEntry" + coi[0] + "_" + coi[0];
	caseData.microscopicDescriptionId = "ctl00_DefaultContent_ResultPanel_ctl02_ResultEntry" + coi[1] + "_" + coi[1];
	caseData.commentId = "ctl00_DefaultContent_ResultPanel_ctl03_ResultEntry" + coi[2] + "_" + coi[2];
	
	casper.evaluate( function(id) {
		document.getElementById(id.diagnosisId).value = Date();
		document.getElementById(id.microscopicDescriptionId).value = "Micro " + Date() + " Micro";
		document.getElementById(id.commentId).value = "Comment " + Date() + " Comment";
		for(var i=0; i < 3; i++) {
				//Get the letter of the jar to use as the key for the 'jars' collection
				j = document.getElementById("ctl00_DefaultContent_ResultPanel_ctl00_ResultControlPanel").childNodes[1].rows[i].cells[0].firstChild.childNodes[1].rows[0].childNodes[1].childNodes[0].innerHTML.substring(0,1);
				//Set the site from the collection
				document.getElementById("ctl00_DefaultContent_ResultPanel_ctl00_ResultControlPanel").childNodes[1].rows[i].cells[0].firstChild.childNodes[1].rows[0].childNodes[2].childNodes[0].value = "Site " + j + ": " + Date();
				//Set the gross description from the collection
				document.getElementById("ctl00_DefaultContent_ResultPanel_ctl00_ResultControlPanel").childNodes[1].rows[i].cells[0].firstChild.childNodes[1].rows[0].childNodes[3].childNodes[0].childNodes[1].value = "Gross " + j + ": " + Date();
			}
			//Set the hold case text box
			document.getElementById("ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PatientSummaryTab_HoldCaseTextbox").value = "";
			//Check the show photo button
			document.getElementById(document.querySelector("td.ajax__combobox_textboxcontainer").firstChild.id.slice(0,58)+"ShowImageCheckBox").checked = true;

	}, caseData);
	
	var imageCaptionID = casper.evaluate(function() {
		return document.querySelector("td.ajax__combobox_textboxcontainer").firstChild.id;
	});
	
    casper.sendKeys("input#"+imageCaptionID, "Caption:" + Date());

	casper.capture("avero.png");
	casper.thenClick("input#ctl00_DefaultContent_BottomToolbar_InputToolbarBuild");
	console.log("I am done");

});

casper.run();

			
	