var casper = require("casper").create({
	//verbose: true,
    //logLevel: "debug",
	onRunComplete: function onRunComplete() {
		casper.steps=[];
		casper.step=0;
		// Don't exit on complete.
		}
}).start('https://path.averodx.com/', function onStart() {
	if (casper.getTitle()=='Login') {
		casper.echo("Logging in...");
		casper.sendKeys("input[name='ctl00$LoginContent$MainLogin$UserName']", "mmuenster");
		casper.sendKeys("input[name='ctl00$LoginContent$MainLogin$Password']", "Password1");
		casper.click("input[name='ctl00$LoginContent$MainLogin$LoginButton']");
	}
	else if (casper.getTitle()=='Work List') {
		casper.echo ("You are already logged in");
	}

	casper.waitForSelector("input[name='ctl00$caseLaunchButton']", function onStartWFS() {
		setInterval( casperLoop(), 15000);
	}, function onTimeout() {
		casper.echo("Timed Out!");
	}, 15000);
}).run();
var i=0;
setInterval( function() { casperLoop(); }, 6000);


function casperLoop() {
	casper.echo("casper.steps.length=" + casper.steps.length);
	casper.echo("casper.step="+ casper.step);
	casper.echo("i=" + i);
	casper.echo("Running the timed function at " + Date());
	if(casper.steps.length===0 && casper.step===0){
		casper.start();
		casper.thenOpen("http://espn.com", function() {
			casper.echo(casper.getTitle());
		});
		casper.thenOpen("http://nytimes.com", function() {
			casper.echo(casper.getTitle());
		});
		casper.run();
		i++;
	} else {
		casper.echo("Casper not done!");
	}
}
