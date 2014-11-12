var utils = require('utils');
require('firebase.js');
var fb = new Firebase("https://dazzling-torch-3393.firebaseio.com/AveroQueue");
var fb_caseData = new Firebase("https://dazzling-torch-3393.firebaseio.com/CaseData");

var casper = require('casper').create({
	//pageSettings: { userAgent: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)'}
	//verbose: true,
    //logLevel: "debug"
	});

casper.start('https://path.averodx.com/', function() {
	var windowTitle = this.getTitle();
	console.log(windowTitle);
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
		this.sendKeys("input#ctl00_caseLaunchTextBox", "SP14-014271");
		this.thenClick("input#ctl00_caseLaunchButton");
		});

casper.waitForSelector("span#ctl00_DefaultContent_PatientHeader_PatientDemographicsTab_PatientSummaryTab_PatientName", function() {
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
		this.echo(microscopicDescriptionId);
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
	utils.dump(patient);
	fb_caseData.child(patient.caseNumber).set(patient);
});

casper.run(function() { 
	//dont Exit 
});
