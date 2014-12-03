var casper = require("casper");
var theText = "A) Web Of 3rd & 4th Toe Dorsal R Foot, Shave Biopsy:\nLENTIGINOUS JUNCTIONAL NEVUS.\n\nComment: No melanocytic atypia is identified.  Sections show a lentiginous epidermal surface containing nests of melanocytes at the dermoepidermal junction.\n~~88305~~\n\nB) Ant. Prox. L Thigh, Shave Biopsy:\nINFLAMED LENTIGINOUS JUNCTIONAL NEVUS.\n\nComment: No melanocytic atypia is identified.  Sections show a lentiginous epidermal surface containing nests of melanocytes at the dermoepidermal junction with accompanying focal dermal inflammation.\n~~88305T 88312 88342 88342~~";

var cptCodes = [];
var re =/~~.*~~/g

var rawCPTCodes = theText.match(re);
var cleanText = theText.replace(re, "");
console.log(cleanText);

rawCPTCodes.forEach(function(j) {
	var k = j.match(/\d\d\d\d\d\w?/g);
	k.forEach(function(index) { cptCodes.push(index); });	
});

var codesForEtelServer=buildCodeLine(cptCodes);
console.log(codesForEtelServer);

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


