require('firebase.js');
var fb = new Firebase("https://dazzling-torch-3393.firebaseio.com/pdfSamples");


var casper = require("casper").create({
	verbose: true,
    logLevel: "debug",
	onRunComplete: function onRunComplete() {
		casper.steps=[];
		casper.step=0;
		// Don't exit on complete.
		}
});

var base64logo = null;
casper.start('http://www.energy.umich.edu', function() {
    this.download('http://www.energy.umich.edu/sites/default/files/pdf-sample.pdf', 'thepdf.pdf');
});

casper.run(function() {
	fb.push({"pdf":base64logo, "caseNumber":"SP14-000000"})
    //this.exit();
});