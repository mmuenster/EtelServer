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

casper.thenOpen("https://path.averodx.com/Custom/Avero/Billing/ChargePreview.aspx?CaseNo=SP14-011799", function () {
	this.evaluate(function() {
		UserID=101773; //This is Matt Muenster's id
		var lstAssignedCharges = document.getElementById("ctl00_DefaultContent_chargeEditControl_lstAssignedCharges");
		// total number of items in list
		var optsLength = lstAssignedCharges.options.length;
		// let loop through items and find out what is selected, if selected, add charges per quantity.
		for (var i = 0; i < optsLength; i++) {
			var valueplit = lstAssignedCharges.options[i].value.split("_");
            var start = new Date().getTime();
			  //This is a sleep function because the website requires the calls to be spaced out to work.
			  for (var j = 0; j < 1e7; j++) {
			  if ((new Date().getTime() - start) > 100){
                APvX.Billing_WS.Charge_ReduceQuantity(valueplit[1], valueplit[0], valueplit[3], UserID, OnRemoveChargeSuccess, OnRemoveChargeSuccess );
				break;
                }
              }
		 }
		});
	});

casper.run(function() {
  setTimeout( function() {casper.echo("Finished!");}, 100);
  });
