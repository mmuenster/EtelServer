var casper = require("casper").create({
	verbose: true,
    logLevel: "debug",
	onRunComplete: function onRunComplete() {
		casper.steps=[];
		casper.step=0;
	// 	// Don't exit on complete.
}
});

casper.start("http://www.google.com", function start(){});

casper.then(function() {
	this.open("http://www.nytimes.com", function open1(){});
	this.open("http://www.espn.com", function open2() {});
	casper.sendKeys("input", "Some Text");
});

casper.thenClick("input");

// casper.then( function() {
	casper.wait(2000, function wait() {
		casper.echo("Wait fired!");
});
// });

console.log(casper.steps);
console.log(casper.status(true));
setInterval(function() {console.log(casper.steps.length, casper.step);}, 500);
casper.run();