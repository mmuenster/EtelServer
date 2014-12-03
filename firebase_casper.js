require('firebase.js');
var utils = require('utils');
var fb = new Firebase("https://dazzling-torch-3393.firebaseio.com/AveroQueue");
var fb_caseData = new Firebase("https://dazzling-torch-3393.firebaseio.com/CaseData");
var counter = 0;
var casperCounter = 0;

var casper = require("casper").create({
	verbose: true,
    logLevel: "debug",
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

setInterval(function() { 
	if(casper.steps.length===0 && casper.step===0) {
		listenToFirebase();
		}
}, 10000);


setInterval(function() {console.log(casper.steps.length, casper.step);}, 1000);

function listenToFirebase() {
  counter++;
  console.log("Request [" + counter + "] at " + Date());
  fb.once('value', function firebaseDataDone(dataSnapshot) {
		if(dataSnapshot.val()===null || dataSnapshot.val()===undefined) { 
			console.log("Datasnapshot was "+ dataSnapshot.val()+".");
		} else {

		dataSnapshot.forEach(function(childSnapshot) {
			var oneData=childSnapshot.val();
			switch(oneData.action) {
				case "pdfReview":
					break;
				case "reassign": 
					reassignCase(oneData, childSnapshot);
					break;
				case "pdfSave":
					pdfSaveCase(oneData, childSnapshot); 
					break;
				case "signout":  
					signoutCase(oneData, childSnapshot); 
					break;
				case "cptDeletes": 
					cptDeletesCase(oneData, childSnapshot); 
					break;
				case "cptAdds":
					cptAddsCase(oneData, childSnapshot); 
					break;
				case "readCase":
					readCase(oneData, childSnapshot);
					break;
				case "writeCase":
					writeCase(oneData, childSnapshot); 
					break;
			}
		});
		
		if(casper.steps.length>0) { 
			casperCounter++;
			casper.echo("Casper run #" + casperCounter);
			casper.run();
		} else { 
			casper.echo ("Nothing to do!");
		}
		}	
	}, function (err) {
		console.log("Got to the error function");
	});
}

function readCase(marker, fbQueueItem) {
	var i=0;
	casper.then(function(){
		console.log("Reading case " + marker.caseNumber);
		casper.thenOpen("https://path.averodx.com/Custom/Avero/Tech/Surgical/Input.aspx?CaseNo=" + marker.caseNumber, function() {
				this.waitForSelector("span#ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PatientSummaryTab_PatientName", function() {
					console.log("Got past the wait statement!");
					var patient = {};
					patient.caseNumber = this.getElementInfo("span#ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PatientSummaryTab_CaseNum").html;
					patient.name = this.getElementInfo("span#ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PatientSummaryTab_PatientName").html;
					//patient.accessionID = this.evaluate(function() {
						//return document.getElementByID("ctl00_DefaultContent_AccessionIDhidden").value;
					//});
					console.log("pa=" + patient.accessionID);
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

					for(i=0; i < patient.jarCount; i++) {
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
	});
}

function writeCase(marker, fbQueueItem) {
	casper.then( function() {	
		casper.echo("Beginning writeCase for " + marker.caseNumber);
		fb_caseData.child(marker.caseNumber).once('value', function (dataSnapshot) {
			casper.thenOpen("https://path.averodx.com/Custom/Avero/Tech/Surgical/Input.aspx?CaseNo=" + marker.caseNumber, function() {
				casper.waitForSelector("span#ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PatientSummaryTab_PatientName", function() {
					writeDataToEtel(dataSnapshot, fbQueueItem);
					console.log("writeCase for " + marker.caseNumber +" completed! ");
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
					casper.waitForSelector("a[id='ctl00_DefaultContent_assignCase2User_AssignedUser']", function() {
						casper.click("a[id='ctl00_DefaultContent_assignCase2User_AssignedUser']");
							casper.waitForSelector("input[id='ctl00_DefaultContent_assignCase2User_saveAssignedUser']", function() {
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
						}, 15000);
					}, 15000);
				});
}

function pdfSaveCase(marker, fbQueueItem) {
	casper.then(function pdfSaveCaseWrapper() {	
		casper.echo("pdfSave " + marker.caseNumber + " Starting...");
		casper.thenOpen("https://path.averodx.com/custom/avero/reports/ReportPreview.aspx?CaseNo=" + marker.caseNumber);
		casper.waitForSelector("iframe#ctl00_DefaultContent_ifPreview", function pdfSaveCaseWaitFSWrapper() {
			var j = casper.getElementAttribute('iframe#ctl00_DefaultContent_ifPreview', 'src').slice(3);
			if(j=="") {
				casper.echo("pdfSave " + marker.caseNumber + " Not built yet. \n");
			} else {				
				var newdata= {};
				var now=Date.now();
				newdata[now]={ "action":"pdfReview", "caseNumber":marker.caseNumber, "url":"https://path.averodx.com" + j, "nodeName":now };
				fb.update(newdata);
				casper.echo("pdfSave " + marker.caseNumber + " Completed! \n");
				fbQueueItem.ref().remove();
			}
		}, function onTimeout() {}, 15000);
	});
}

function signoutCase(marker, fbQueueItem){
	casper.thenOpen("https://path.averodx.com/custom/avero/reports/ReportPreview.aspx?CaseNo=" + marker.caseNumber, function () {
		console.log("Signout of " + marker.caseNumber + " starting...");

		this.evaluate(function() {
			document.querySelector("input#ctl00_DefaultContent_radFinal").click();
			document.querySelector("input#ctl00_DefaultContent_chkViewSignedReport").checked = 0;
		});
		this.thenClick("input#ctl00_DefaultContent_btnSignReport");
		this.waitForSelector("select#ctl00_DefaultContent_WorklistCtrl_drpPageSize", function() {
			console.log("Signout completed! \n");
			fbQueueItem.ref().remove();
		}, function onTimeout() {
			this.echo("Timed Out!");
		}, 18000);
		});
}

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
/*				for (var b = 0; b < 1e7; b++) {
					if ((new Date().getTime() - start) > 1000){
						break;
					}
				}*/
			}
		});
		casper.echo("cptDeletes on " + marker.caseNumber + " completed!\n");
		casper.wait(1500);  //Forced wait because some deletes weren't happening
		fbQueueItem.ref().remove();	
	});
}

function cptAddsCase(marker, fbQueueItem) {
	casper.thenOpen("https://path.averodx.com/Custom/Avero/Billing/ChargePreview.aspx?CaseNo=" + marker.caseNumber, function () {
		casper.waitForSelector("select#ctl00_DefaultContent_chargeEditControl_AssociatedChargesAccordion_content_lstAssociatedCharges", function() {
			casper.echo("cptAdds " + marker.caseNumber + " Starting...");
			codes=marker.cptCodes.split(" ").sort();
			casper.echo("codes="+codes);
			allPossibleCodes=casper.evaluate(function() {
				return document.querySelector("select#ctl00_DefaultContent_chargeEditControl_AssociatedChargesAccordion_content_lstAssociatedCharges").length;
			});

			for(k=0; k<codes.length; k++) {
				casper.echo("k=" + k + "   starting the search for " + codes[k]);
				for(var j=0; j < allPossibleCodes; j++) {
					var thisCode=casper.evaluate(function(index) {
						return document.querySelector("select#ctl00_DefaultContent_chargeEditControl_AssociatedChargesAccordion_content_lstAssociatedCharges").options[index].text.slice(0,8);
					}, j);
					if(thisCode==codes[k]) {
						console.log("found a match!");
						casper.evaluate(function(index) {
							var UserID = 101773;
							var selOptionValue=document.querySelector("select#ctl00_DefaultContent_chargeEditControl_AssociatedChargesAccordion_content_lstAssociatedCharges").options[index].value;
							var testdropdown = document.getElementById("ctl00_DefaultContent_chargeEditControl_drpSelectTest");
							testorderid = testdropdown.options[testdropdown.selectedIndex].value;
							APvX.Billing_WS.AddCharge(selOptionValue, testorderid, 1 , UserID, OnAddChargeSuccess, OnAddChargeSuccess);
							//This is a sleep function because the website requires the calls to be spaced out to work.
							var start = new Date().getTime();
							for (var i = 0; i < 1e7; i++) {
								if ((new Date().getTime() - start) > 2500){
									break;
								}
							}				
						}, j);
						break;
					}
				}
			}
		casper.wait(3000);
		console.log("cptAdds completed! \n");
		fbQueueItem.ref().remove();
		});
	});
}

function writeDataToEtel(dataSnapshot, fbQueueItem){
	casper.then(function() {
		casper.echo("Writing data now...");
		var caseData= dataSnapshot.val();
		var pagehtml = casper.getHTML();
		var coi = pagehtml.match(/\d+\$UpdateProfessionalPanel/g);
		coi[0]=coi[0].slice(0,8);
		coi[1]=coi[1].slice(0,8);
		coi[2]=coi[2].slice(0,8);

		caseData.diagnosisId = "ctl00_DefaultContent_ResultPanel_ctl01_ResultEntry" + coi[0] + "_" + coi[0];
		caseData.microscopicDescriptionId = "ctl00_DefaultContent_ResultPanel_ctl02_ResultEntry" + coi[1] + "_" + coi[1];
		caseData.commentId = "ctl00_DefaultContent_ResultPanel_ctl03_ResultEntry" + coi[2] + "_" + coi[2];

		//If clinical information needs to be edited, queue that.
		// currentClinicalInformation=casper.getElementInfo("span#ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PatientSummaryTab_ClinicalHistoryInformation").html;
		// console.log(currentClinicalInformation +"||" + caseData.clinicalInformation);

		// if(currentClinicalInformation!=caseData.clinicalInformation) {
		// 	fb.push({"action":"clinicalInformationEdit", "caseNumber":caseData.caseNumber});
		// }
		
		//Strip the CPT code information out of the diaghnosis window and queue the CPT edits.
		var cptCodes = [];
		var re =/~~.*~~/g;

		var rawCPTCodes = caseData.diagnosisTextArea.match(re);
		caseData.diagnosisTextArea = caseData.diagnosisTextArea.replace(re, "");

		rawCPTCodes.forEach(function(j) {
			var k = j.match(/\d\d\d\d\d\w?/g);
			k.forEach(function(index) { cptCodes.push(index); });	
		});

		var codesForEtelServer=buildCodeLine(cptCodes);

		fb.push({"action":"cptDeletes", "caseNumber":caseData.caseNumber})
		fb.push({"action":"cptAdds", "caseNumber":caseData.caseNumber, "cptCodes":codesForEtelServer })
		fb.push({"action":"pdfSave", "caseNumber":caseData.caseNumber});


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
		casper.echo("Hitting Preview Report now...");
		casper.thenClick("input#ctl00_DefaultContent_TopToolbar_InputToolbarBuild");
		fbQueueItem.ref().remove();
	});
}

function buildCodeLine(codeArray) {
	var codeline="";
	codeArray.forEach(function(index) {
		switch(index) {
			case "88305":
				codeline += "88305-G: ";
				break;
			case "88304":
				codeline += "88304-G: ";
				break;
			case "88312":
				codeline += "88312-G: ";
				break;
			case "88342":
				codeline += "88342-G: ";
				break;
			case "88305T":
				codeline += "88305-TC ";
				break;
			case 88305:
				codeline += "88305-G: ";
				break;
			case 88305:
				codeline += "88305-G: ";
				break;
		}
	});

	return codeline;
}
