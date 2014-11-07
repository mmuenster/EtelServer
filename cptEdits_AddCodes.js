var casper = require('casper').create({
	//verbose: true,
    //logLevel: "debug"
	});

casper.start('https://path.averodx.com/', function() {
	this.echo(this.getTitle());
	this.sendKeys("input[name='ctl00$LoginContent$MainLogin$UserName']", "mmuenster");
	this.sendKeys("input[name='ctl00$LoginContent$MainLogin$Password']", "Password1");
	});
	
casper.thenClick("input[name='ctl00$LoginContent$MainLogin$LoginButton']", function then() {
	this.capture("prewait.png");
	this.waitForSelector("input[name='ctl00$caseLaunchButton']", function() { 
		this.capture("avero.png");
	}, function onTimeout() {
		this.echo("Timed Out!");
	}, 15000);
});

var codestring="88305-G: 88312-G: 88367-G: 88305-26 80048-G:";
var codes=codestring.split(" ").sort();
var allPossibleCodes=0;
console.log(codes, codes[0]);

casper.thenOpen("https://path.averodx.com/Custom/Avero/Billing/ChargePreview.aspx?CaseNo=SP14-011799", function () {
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
					
					//This is the first option I got working
					var UserID = 101773;
					var selOptionValue=document.querySelector("select#ctl00_DefaultContent_chargeEditControl_AssociatedChargesAccordion_content_lstAssociatedCharges").options[index].value;
					var testdropdown = document.getElementById("ctl00_DefaultContent_chargeEditControl_drpSelectTest");
					testorderid = testdropdown.options[testdropdown.selectedIndex].value;
					APvX.Billing_WS.AddCharge(selOptionValue, testorderid, 1 , UserID, OnAddChargeSuccess, OnAddChargeSuccess);
					
					/*
					//This is the second option I am trying
					document.querySelector("select#select#ctl00_DefaultContent_chargeEditControl_AssociatedChargesAccordion_content_lstAssociatedCharges").selectedIndex = j;
					document.querySelector("input#ctl00_DefaultContent_chargeEditControl_txtQuantity").value = "1";
					QuantityAdd();
					*/
					
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

casper.run(function() {
    setTimeout( function() {casper.echo("Finished!");}, 100);
});


