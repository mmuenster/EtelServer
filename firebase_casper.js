require('firebase.js');
var utils = require('utils');
var fb = new Firebase("https://dazzling-torch-3393.firebaseio.com/AveroQueue");
var fb_caseData = new Firebase("https://dazzling-torch-3393.firebaseio.com/CaseData");

var casper = require("casper").create({
	//verbose: true,
    //logLevel: "debug",
	onRunComplete: function() {
		casper.steps = [];//Reset casper steps
		casper.step = 0;  //Reset casper to step 0
		// Don't exit on complete.
		}
}).start('https://path.averodx.com/', function() {
	if (this.getTitle()=='Login') {
		this.echo("Logging in...");
		this.sendKeys("input[name='ctl00$LoginContent$MainLogin$UserName']", "mmuenster");
		this.sendKeys("input[name='ctl00$LoginContent$MainLogin$Password']", "Password1");
		this.click("input[name='ctl00$LoginContent$MainLogin$LoginButton']");
	}
	else if (this.getTitle()=='Work List') {
		this.echo ("You are already logged in");
	}

	this.waitForSelector("input[name='ctl00$caseLaunchButton']", function() {
		this.echo("listening to Firebase");
		listenToFirebase();
	}, function onTimeout() {
		this.echo("Timed Out!");
	}, 15000);

}).run();


function listenToFirebase() {
  fb.once('value', function(dataSnapshot) {
  		console.log("Requesting data at " + Date());

		dataSnapshot.forEach(function(childSnapshot) { 
			var oneData=childSnapshot.val();
			var action=false;

			if (oneData.action=="reassign") { action = reassignCase(oneData, childSnapshot); }
					
			if (oneData.action=="pdfSave") { action = pdfSaveCase(oneData, childSnapshot); }

			if (oneData.action=="signout") { action = signoutCase(oneData, childSnapshot); }
				
			if (oneData.action=="cptDeletes") { action = cptDeletesCase(oneData, childSnapshot); }

			if (oneData.action=="cptAdds") { action = cptAddsCase(oneData, childSnapshot); }

			if (oneData.action=="readCase") { action = readCase(oneData, childSnapshot); }

			if (oneData.action=="writeCase") { action = writeCase(oneData, childSnapshot); }
		});
		if(casper.steps.length > 0) {
			casper.run(function() {
				casper.steps=[];
				casper.step=0;
				setTimeout( function() { listenToFirebase(); }, 20000);
			});
		} else {
			setTimeout( function() { listenToFirebase(); }, 20000);
		}
	}, function (err) {
		console.log("Got to the error function");
	});
}

function readCase(marker, fbQueueItem) {
	console.log("Reading case " + marker.caseNumber);
	casper.thenOpen("https://path.averodx.com", function() {
			this.sendKeys("input#ctl00_caseLaunchTextBox", marker.caseNumber);
			this.click("input#ctl00_caseLaunchButton");
			this.waitForSelector("span#ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PatientSummaryTab_PatientName", function() {
				console.log("Got past the wait statement!");
				var patient = {};
				patient.caseNumber = this.getElementInfo("span#ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PatientSummaryTab_CaseNum").html;
				patient.name = this.getElementInfo("span#ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PatientSummaryTab_PatientName").html;
				patient.dob = this.getElementInfo("span#ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PatientSummaryTab_DOB").html;
				patient.age = this.getElementInfo("span#ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PatientSummaryTab_Age").html;
				patient.gender = this.getElementInfo("span#ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PatientSummaryTab_Gender").html;
				patient.client = this.getElementInfo("span#ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PatientSummaryTab_Client").html;
				patient.collectionDate = this.getElementInfo("span#ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PatientSummaryTab_CollectionDate").html;
				patient.receivedDate = this.getElementInfo("span#ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PatientSummaryTab_DateReceived").html;
				patient.doctor = this.getElementInfo("span#ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PatientSummaryTab_ReferredDoctor").html;
				patient.holdCaseText = this.getElementInfo("input#ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PatientSummaryTab_HoldCaseTextbox").html;
				patient.clinicalInformation = this.getElementInfo("span#ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PatientSummaryTab_ClinicalHistoryInformation").html;
				
				patient.jarCount = this.evaluate(function(){
					return document.getElementById("ctl00_DefaultContent_ResultPanel_ctl00_ResultControlPanel").childNodes[1].rows.length;
				});
				patient.jars = {};

				for(var i=0; i < patient.jarCount; i++) {
					j = this.evaluate(function(index) {
						return document.getElementById("ctl00_DefaultContent_ResultPanel_ctl00_ResultControlPanel").childNodes[1].rows[index].cells[0].firstChild.childNodes[1].rows[0].childNodes[1].childNodes[0].innerHTML;
					}, i).substring(0,1);
					k = this.evaluate(function(index) {
						return document.getElementById("ctl00_DefaultContent_ResultPanel_ctl00_ResultControlPanel").childNodes[1].rows[index].cells[0].firstChild.childNodes[1].rows[0].childNodes[2].childNodes[0].value;
					}, i);
					l = this.evaluate(function(index) {
						return document.getElementById("ctl00_DefaultContent_ResultPanel_ctl00_ResultControlPanel").childNodes[1].rows[index].cells[0].firstChild.childNodes[1].rows[0].childNodes[3].childNodes[0].childNodes[1].value;
					}, i);

					patient.jars[j] = { "site":k, "grossDescription":l};
				}	

					var pagehtml = this.getHTML();
					var coi = pagehtml.match(/\d+\$UpdateProfessionalPanel/g);
					coi[0]=coi[0].slice(0,8);
					coi[1]=coi[1].slice(0,8);
					coi[2]=coi[2].slice(0,8);

					diagnosisId = "ctl00_DefaultContent_ResultPanel_ctl01_ResultEntry" + coi[0] + "_" + coi[0];
					microscopicDescriptionId = "ctl00_DefaultContent_ResultPanel_ctl02_ResultEntry" + coi[1] + "_" + coi[1];
					commentId = "ctl00_DefaultContent_ResultPanel_ctl03_ResultEntry" + coi[2] + "_" + coi[2];
					
					patient.diagnosisTextArea=this.evaluate(function(id) { return document.getElementById(id).value; }, diagnosisId);
					patient.microscopicDescriptionTextArea=this.evaluate(function(id) { return document.getElementById(id).value; }, microscopicDescriptionId);
					patient.commentTextArea=this.evaluate(function(id) { return document.getElementById(id).value; }, commentId);
					patient.photoCaption = this.evaluate(function() {
						return document.querySelector("td.ajax__combobox_textboxcontainer").firstChild.value;
					});
					var photoID = this.evaluate(function() {
						return document.querySelector("td.ajax__combobox_textboxcontainer").firstChild.id;
					});
					photoID=photoID.slice(0,58) + "ImageButton";
					var photoSRC=this.evaluate(function(id){
						return document.getElementById(id).src.slice(12)
					}, photoID)
					var photoURL="https://path.averodx.com/" + photoSRC;

					patient.photo = this.base64encode(photoURL);

					patient.priorCaseCount= this.evaluate(function() {
						return document.getElementById("ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PriorConcurrentCasesTab_PatientHistory_PatientHistoryGridView").rows.length - 1;
					});

					patient.priorCases = {};
					for(i=1; i <= patient.priorCaseCount; i++)	{

					j = this.evaluate(function(index) {
						return document.getElementById("ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PriorConcurrentCasesTab_PatientHistory_PatientHistoryGridView").rows[index].cells[0].innerHTML;
					}, i);
					k = this.evaluate(function(index) {
						return document.getElementById("ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PriorConcurrentCasesTab_PatientHistory_PatientHistoryGridView").rows[index].cells[1].innerHTML;
					}, i);
					l = this.evaluate(function(index) {
						return document.getElementById("ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PriorConcurrentCasesTab_PatientHistory_PatientHistoryGridView").rows[index].cells[3].innerHTML;
					}, i);
					m = this.evaluate(function(index) {
						return document.getElementById("ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PriorConcurrentCasesTab_PatientHistory_PatientHistoryGridView").rows[index].cells[4].childNodes[1].href;
					}, i);

					m = m || "" //If m is null, set to empty string
					
					n = this.evaluate(function(index) {
						return document.getElementById("ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PriorConcurrentCasesTab_PatientHistory_PatientHistoryGridView").rows[index].cells[5].childNodes[1].innerHTML;
					}, i);

					patient.priorCases[j] = { "createdDate":k, "completedDate":l, "reportURL":m, "diagnosisText":n };

					}
				fb_caseData.child(patient.caseNumber).set(patient);
				fbQueueItem.ref().remove();
				console.log("Finished reading case " + marker.caseNumber + ". \n");
			}, function onTimeout(error) { console.log("There was an error waiting for the selector."); } , 15000);
	});
}

function writeCase(marker, fbQueueItem) {
casper.then(function() {
	fb_caseData.child(marker.caseNumber).once('value', function (dataSnapshot) {
		casper.then(function() {
			casper.echo("Beginning writeCase for " + marker.caseNumber);
			fbQueueItem.ref().remove();
		});
		casper.thenOpen("https://path.averodx.com/Custom/Avero/Tech/Surgical/Input.aspx?CaseNo=" + marker.caseNumber, function() {
			this.waitForSelector("span#ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PatientSummaryTab_PatientName", function() {
				console.log("I am in casper.waitForSelector");
				writeDataToEtel(dataSnapshot);
				console.log("writeCase for " + marker.caseNumber +" completed! \n");

			}, function writeCaseTimeout() {
				console.log("The writeCase waitForSelector statement timed out. \n");
			}, 15000);
		});
	}, function (err) {
		utils.dump(err + "\n There was an error retreiving the data.");
	});
});
}

function reassignCase(marker, fbQueueItem) {
	casper.thenOpen('https://path.averodx.com/Custom/Avero/Workflow/CaseStatus.aspx?CaseNo='+marker.caseNumber, function() {
					console.log("Reassigning " + marker.caseNumber +" now...");
					this.waitForSelector("a[id='ctl00_DefaultContent_assignCase2User_AssignedUser']", function() {
						this.click("a[id='ctl00_DefaultContent_assignCase2User_AssignedUser']");
							this.waitForSelector("input[id='ctl00_DefaultContent_assignCase2User_saveAssignedUser']", function() {
									var docvalue="";
									
									if (marker.doctor=="mmuenster" || marker.doctor=="Matt Muenster") {
										docvalue = "101773";
										}
									else if (marker.doctor=="tmattison") {
										docvalue = "100376";
										}
									else if (marker.doctor=="tlmattison") {
										docvalue = "100375";
										}
									else if (marker.doctor=="trmattison") {
										docvalue = "100377";
										}
									else if (marker.doctor=="dhull") {
										docvalue = "101637";
										}
									else if (marker.doctor=="tlamm") {
										docvalue = "101772";
										}
									else if (marker.doctor=="jhurrell") {
										docvalue = "101440";
										}
									else if (marker.doctor == "rstuart") {
										docvalue = "100435";
										}
									else if (marker.doctor == "aeastman") {
										docvalue = "100437";
										}
									else if (marker.doctor == "ekiss") {
										docvalue = "101759";
										}
							this.evaluate(function(doctor) {
								document.querySelector("select[name='ctl00$DefaultContent$assignCase2User$drpAssignedUser']").value = doctor;
							}, docvalue);
							this.click("input[id='ctl00_DefaultContent_assignCase2User_saveAssignedUser']");
							this.waitForSelector("a[id='ctl00_DefaultContent_assignCase2User_AssignedUser']", function() {  	
								fbQueueItem.ref().remove();
								console.log("Reassigning " + marker.caseNumber +" completed! \n");
								});
						});
					});
				});
}

function pdfSaveCase(marker, fbQueueItem) {
	casper.then(function() {
		casper.echo("pdfSave " + marker.caseNumber + " Starting...");
	});
	
	casper.thenOpen("https://path.averodx.com/custom/avero/reports/ReportPreview.aspx?CaseNo=" + marker.caseNumber, function () {
		this.waitForSelector("iframe#ctl00_DefaultContent_ifPreview", function() {
			var j = casper.getElementAttribute('iframe#ctl00_DefaultContent_ifPreview', 'src').slice(3);
			while (j==="") {
				var start = new Date().getTime();
				for (var b = 0; b < 1e7; b++) {
					if ((new Date().getTime() - start) > 1500){
						break;
					}
				}
				this.reload(function(){
			  		j = casper.getElementAttribute('iframe#ctl00_DefaultContent_ifPreview', 'src').slice(3);
				});
			}
			
			var newdata= {};
			var now=Date.now();
			newdata[now]={ "action":"pdfReview", "caseNumber":marker.caseNumber, "url":"https://path.averodx.com" + j, "nodeName":now };
			fb.update(newdata);
			casper.echo("pdfSave " + marker.caseNumber + " Completed! \n");
			fbQueueItem.ref().remove();
		});
	});
}

function signoutCase(marker, fbQueueItem){
	casper.then( function() {
		console.log("Signout of " + marker.caseNumber + " starting...");
		});
			
	casper.thenOpen("https://path.averodx.com/custom/avero/reports/ReportPreview.aspx?CaseNo=" + marker.caseNumber, function () {
		this.evaluate(function() {
			document.querySelector("input#ctl00_DefaultContent_radFinal").click();
			document.querySelector("input#ctl00_DefaultContent_chkViewSignedReport").checked = 0;
			document.querySelector("input#ctl00_DefaultContent_btnSignReport").click();
			this.waitForSelector("select#ctl00_DefaultContent_WorklistCtrl_drpPageSize", function() {
			}, function onTimeout() {
				this.echo("Timed Out!");
			}, 15000);

		});
	});
					
	casper.then( function() {
		console.log("Signout completed! \n");
		fbQueueItem.ref().remove();
		var start = new Date().getTime();
			for (var b = 0; b < 1e7; b++) {
			if ((new Date().getTime() - start) > 3000){
				break;
			}
		}
	});
}

function cptDeletesCase(marker, fbQueueItem) {
		casper.then(function() {console.log("cptDeletes " + marker.caseNumber + " Starting...");});

		casper.thenOpen("https://path.averodx.com/Custom/Avero/Billing/ChargePreview.aspx?CaseNo=" + marker.caseNumber, function () {
			this.evaluate(function() {
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
						if ((new Date().getTime() - start) > 3000){
							break;
						}
					}
				}
			});
		});

		casper.then( function() {
			console.log("cptEdits on " + marker.caseNumber + " deletion completed!\n");
			fbQueueItem.ref().remove();
		});
}

function cptAddsCase(marker, fbQueueItem) {
	casper.then( function() {
		console.log("cptAdds " + marker.caseNumber + " Starting...");
		codes=marker.cptCodes.split(" ").sort();
		console.log("codes="+codes);
	});
	
	//This section adds the codes contained in marker.cptCodes	
	casper.thenOpen("https://path.averodx.com/Custom/Avero/Billing/ChargePreview.aspx?CaseNo=" + marker.caseNumber, function () {
		this.capture("avero2.png");
		casper.waitForSelector("select#ctl00_DefaultContent_chargeEditControl_AssociatedChargesAccordion_content_lstAssociatedCharges", function() {
			allPossibleCodes=this.evaluate(function() {
				return document.querySelector("select#ctl00_DefaultContent_chargeEditControl_AssociatedChargesAccordion_content_lstAssociatedCharges").length;
			});

		for(k=0; k<codes.length; k++) {
			console.log("k=" + k + "   starting the search for " + codes[k]);
			for(var j=0; j < allPossibleCodes; j++) {
				var thisCode=this.evaluate(function(index) {
					return document.querySelector("select#ctl00_DefaultContent_chargeEditControl_AssociatedChargesAccordion_content_lstAssociatedCharges").options[index].text.slice(0,8);
				}, j);
				if(thisCode==codes[k]) {
					console.log("found a match!");
					this.evaluate(function(index) {
						var UserID = 101773;
						var selOptionValue=document.querySelector("select#ctl00_DefaultContent_chargeEditControl_AssociatedChargesAccordion_content_lstAssociatedCharges").options[index].value;
						var testdropdown = document.getElementById("ctl00_DefaultContent_chargeEditControl_drpSelectTest");
						testorderid = testdropdown.options[testdropdown.selectedIndex].value;
						APvX.Billing_WS.AddCharge(selOptionValue, testorderid, 1 , UserID, OnAddChargeSuccess, OnAddChargeSuccess);
						//This is a sleep function because the website requires the calls to be spaced out to work.
						var start = new Date().getTime();
						for (var i = 0; i < 1e7; i++) {
							if ((new Date().getTime() - start) > 500){
								break;
							}
						}				
					}, j);
					break;
				}
			}
		}

		});
	});
		
	casper.then( function() {
		console.log("cptAdds completed! \n");
		fbQueueItem.ref().remove();
		});
}

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
		casper.click("input#ctl00_DefaultContent_TopToolbar_InputToolbarBuild");
}
