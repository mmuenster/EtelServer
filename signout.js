var casper = require('casper').create({
	//verbose: true,
    //logLevel: "debug",
	onAlert: function() {},  //Do nothing when alerts happen
	onRunComplete: function() {
		casper.steps = [];  //Reset casper steps
		casper.step = 0;    //Reset casper to step 0
		// Don't exit on complete.
	  }
	});

casper.start('https://path.averodx.com/', function() {
	this.echo(this.getTitle());
	this.sendKeys("input[name='ctl00$LoginContent$MainLogin$UserName']", "mmuenster");
	this.sendKeys("input[name='ctl00$LoginContent$MainLogin$Password']", "Password1");
	});
	
casper.thenClick("input[name='ctl00$LoginContent$MainLogin$LoginButton']", function then() {
	this.waitForSelector("input[name='ctl00$caseLaunchButton']", function() { 
		casper.options.pageSettings={ userAgent: 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)'};
	}, function onTimeout() {
		this.echo("Timed Out!");
	}, 15000);
});

casper.run();

casper.thenOpen("https://path.averodx.com/custom/avero/reports/ReportPreview.aspx?CaseNo=SP14-011799", function () {
	this.evaluate(function() {
		document.querySelector("input#ctl00_DefaultContent_radFinal").click();
		document.querySelector("input#ctl00_DefaultContent_chkViewSignedReport").checked = 0;
		document.querySelector("input#ctl00_DefaultContent_btnSignReport").click();
	});
	});

	
casper.thenClick("input#ctl00_DefaultContent_btnSignReport", function then() {
	this.waitForSelector("input#ctl00_DefaultContent_WorklistCtrl_newSearch", function() { 
		
	}, function onTimeout() {
		this.echo("Timed Out!");
	}, 15000);
	this.capture("avero2.png");
});

casper.run(function() {
  setTimeout( function() {casper.echo("Finished!");}, 100);
  });
