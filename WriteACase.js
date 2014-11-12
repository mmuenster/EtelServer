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
	fb_caseData.child('SP14-011799').once('value', function (dataSnapshot) {
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
		var coi = pagehtml.match(/\d+\$UpdateProfessionalPanel/g);
		coi[0]=coi[0].slice(0,8);
		coi[1]=coi[1].slice(0,8);
		coi[2]=coi[2].slice(0,8);

		caseData.diagnosisId = "ctl00_DefaultContent_ResultPanel_ctl01_ResultEntry" + coi[0] + "_" + coi[0];
		caseData.microscopicDescriptionId = "ctl00_DefaultContent_ResultPanel_ctl02_ResultEntry" + coi[1] + "_" + coi[1];
		caseData.commentId = "ctl00_DefaultContent_ResultPanel_ctl03_ResultEntry" + coi[2] + "_" + coi[2];
		
		casper.evaluate( function(ad) {
			
			for(var i=0; i < ad.jarCount; i++) {
				//Get the letter of the jar to use as the key for the 'jars' collection
				j = document.getElementById("ctl00_DefaultContent_ResultPanel_ctl00_ResultControlPanel").childNodes[1].rows[i].cells[0].firstChild.childNodes[1].rows[0].childNodes[1].childNodes[0].innerHTML.substring(0,1);
				//Set the site from the collection
				document.getElementById("ctl00_DefaultContent_ResultPanel_ctl00_ResultControlPanel").childNodes[1].rows[i].cells[0].firstChild.childNodes[1].rows[0].childNodes[2].childNodes[0].value = ad.jars[j].site;
				//Set the gross description from the collection
				document.getElementById("ctl00_DefaultContent_ResultPanel_ctl00_ResultControlPanel").childNodes[1].rows[i].cells[0].firstChild.childNodes[1].rows[0].childNodes[3].childNodes[0].childNodes[1].value = ad.jars[j].grossDescription;
			}

			document.getElementById(ad.diagnosisId).value = ad.diagnosisTextArea;
			document.getElementById(ad.microscopicDescriptionId).value = ad.microscopicDescriptionTextArea;
			document.getElementById(ad.commentId).value = ad.commentTextArea;
			//Set the hold case text box
			document.getElementById("ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PatientSummaryTab_HoldCaseTextbox").value = ad.holdCaseText;
			//Check the show photo button
			document.getElementById(document.querySelector("td.ajax__combobox_textboxcontainer").firstChild.id.slice(0,58)+"ShowImageCheckBox").checked = true;
		}, caseData);
		
		var imageCaptionID = casper.evaluate(function(){
			return document.querySelector("td.ajax__combobox_textboxcontainer").firstChild.id;
		});
		//Must use the SendKeys method as the page detects the typing for the change in the caption
		//Set the caption
		casper.sendKeys("input#"+imageCaptionID, caseData.photoCaption);
		casper.click("input#ctl00_DefaultContent_BottomToolbar_InputToolbarSave");
		casper.capture("avero.png");
/*		casper.run(function() {
			console.log("I am in casper.run exit function inside the firebase call.");
			casper.echo(casper.status(true));
			//dont Exit 
		});
*/
	}

	
