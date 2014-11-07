require('firebase.js');
var fb = new Firebase("https://dazzling-torch-3393.firebaseio.com/AveroQueue");

var casper = require("casper").create({
	logLevel: 'debug',
	onRunComplete: function() {
		casper.steps = [];  //Reset casper steps
		casper.step = 0;    //Reset casper to step 0
		//listenToFirebase();
		// Don't exit on complete.
	  }
});

casper.on('remote.message', function(message) {
    this.echo(message);
});

casper.start('https://path.averodx.com/', function() {
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
			this.thenOpen("https://path.averodx.com/custom/avero/reports/ReportPreview.aspx?CaseNo=SP14-014153", function() {
				var j = this.getElementAttribute('iframe#ctl00_DefaultContent_ifPreview', 'src').slice(3);
				this.echo("https://path.averodx.com" + j);
				var newdata= new Object();
				var now=Date.now();
				newdata[now]={ "action":"pdfReview", "caseNumber":"SP14-014153", "url":"https://path.averodx.com" + j }
				fb.update(newdata);
				this.echo("Got the picture");
				});
			}, function onTimeout() {
				this.echo("Timed Out!");
			}, 15000);
});

casper.run();

/*
<embed width="100%" height="100%" name="plugin" src="https://path.averodx.com/Reports/ReportViewer.aspx?CaseNo=SP14-011799&amp;ReportID=262&amp;Version=2" type="application/pdf">

<embed width="100%" height="100%" name="plugin" src="https://path.averodx.com/Reports/ReportViewer.aspx?CaseNo=SP14-014153&amp;ReportID=262&amp;Version=1" type="application/pdf">
*/