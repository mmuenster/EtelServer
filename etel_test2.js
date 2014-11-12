var casper = require('casper').create({
	pageSettings: { userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'},
	//verbose: true,
    //logLevel: "debug",
	onRunComplete: function() {
		casper.steps = [];  //Reset casper steps
		casper.step = 0;    //Reset casper to step 0
		console.log("4 casper.step="+casper.step+"\ncasper.steps="+casper.steps);
		// Don't exit on complete.
	}
});

console.log("1 casper.step="+casper.step+"\ncasper.steps="+casper.steps);

casper.start('https://path.averodx.com/');



console.log("2 casper.step="+casper.step+"\ncasper.steps="+casper.steps);

casper.then(function() {
		this.sendKeys("input", "SP14-011799");
		this.thenClick("input");
		});

console.log("3 casper.step="+casper.step+"\ncasper.steps="+casper.steps);

casper.run();
casper.click("input#ctl00_LoginContent_MainLogin_UserName");
