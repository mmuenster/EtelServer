require('firebase.js');
var fb = new Firebase("https://dazzling-torch-3393.firebaseio.com/AveroQueue");
var casper = require("casper").create({
	//verbose: true,
    //logLevel: "debug",
	onRunComplete: function() {
		casper.steps = [];  //Reset casper steps
		casper.step = 0;    //Reset casper to step 0
		// Don't exit on complete.
	  }
}).start('https://path.averodx.com/', function() {
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
			this.evaluate(function() {
				document.getElementById('ctl00_caseLaunchTextBox').value = "SP14-011799";
			});
			}, function onTimeout() {
				this.echo("Timed Out!");
			}, 15000);

}).run(function() {
	listenToFirebase();
	});

function listenToFirebase() {
  fb.once('value', function(dataSnapshot) {
		casper.open("https://path.averodx.com/");  //Required so there is always one casper step, even when the Queue is called empty
		console.log(Date.now());
		dataSnapshot.forEach(function(childSnapshot) {
		  var oneData=childSnapshot.val();
			  
			  if (oneData.action=="reassign") {
				casper.thenOpen('https://path.averodx.com/Custom/Avero/Workflow/CaseStatus.aspx?CaseNo='+oneData.caseNumber, function() {
					console.log("Reassigning " + oneData.caseNumber +" now...");
					this.waitForSelector("a[id='ctl00_DefaultContent_assignCase2User_AssignedUser']", function() { 
						this.click("a[id='ctl00_DefaultContent_assignCase2User_AssignedUser']");
							this.waitForSelector("input[id='ctl00_DefaultContent_assignCase2User_saveAssignedUser']", function() { 
									var docvalue="";
									
									if (oneData.doctor=="mmuenster" || oneData.doctor=="Matt Muenster") {
										docvalue = "101773";
										}
									else if (oneData.doctor=="tmattison") {
										docvalue = "100376";
										}
									else if (oneData.doctor=="tlmattison") {
										docvalue = "100375";
										}
									else if (oneData.doctor=="trmattison") {
										docvalue = "100377";
										}
									else if (oneData.doctor=="dhull") {
										docvalue = "101637";
										}
									else if (oneData.doctor=="tlamm") {
										docvalue = "101772";
										}
									else if (oneData.doctor=="jhurrell") {
										docvalue = "101440";
										}
									else if (oneData.doctor == "rstuart") {
										docvalue = "100435";
										}
									else if (oneData.doctor == "aeastman") {
										docvalue = "100437";
										}
									else if (oneData.doctor == "ekiss") {
										docvalue = "101759";
										}
							this.evaluate(function(doctor) {
								document.querySelector("select[name='ctl00$DefaultContent$assignCase2User$drpAssignedUser']").value = doctor; 
							}, docvalue);
							this.click("input[id='ctl00_DefaultContent_assignCase2User_saveAssignedUser']");
							this.waitForSelector("a[id='ctl00_DefaultContent_assignCase2User_AssignedUser']", function() {
								childSnapshot.ref().remove();
								});
							console.log("Reassigning " + oneData.caseNumber +" completed!");
						});
					});
				});		
				}
				
			  if (oneData.action=="pdfSave") {
					casper.then(function() {
						casper.echo("pdfSave " + oneData.caseNumber + " Starting...");
					});
					
					casper.thenOpen("https://path.averodx.com/custom/avero/reports/ReportPreview.aspx?CaseNo=" + oneData.caseNumber, function () {
						this.waitForSelector("iframe#ctl00_DefaultContent_ifPreview", function() { 		
							var j = casper.getElementAttribute('iframe#ctl00_DefaultContent_ifPreview', 'src').slice(3);
							while (j=="") {
								var start = new Date().getTime();
								  for (var b = 0; b < 1e7; b++) {
								  	if ((new Date().getTime() - start) > 1500){
										break;
									}
								  }
							  this.reload(function(){
							  	j = casper.getElementAttribute('iframe#ctl00_DefaultContent_ifPreview', 'src').slice(3);
							  })
							}
							
							var newdata= {};
							var now=Date.now();
							newdata[now]={ "action":"pdfReview", "caseNumber":oneData.caseNumber, "url":"https://path.averodx.com" + j, "nodeName":now }
							fb.update(newdata);
							casper.echo("pdfSave " + oneData.caseNumber + " Completed!");
							childSnapshot.ref().remove();	
						});							
					});			
			  }
			  
			  if (oneData.action=="signout") {
				casper.then( function() {
					console.log("Signout of " + oneData.caseNumber + " starting...");
					});
				
				casper.thenOpen("https://path.averodx.com/custom/avero/reports/ReportPreview.aspx?CaseNo=" + oneData.caseNumber, function () {
					this.evaluate(function() {
						document.querySelector("input#ctl00_DefaultContent_radFinal").click();
						document.querySelector("input#ctl00_DefaultContent_chkViewSignedReport").checked = 0;
						document.querySelector("input#ctl00_DefaultContent_btnSignReport").click();
						this.waitForSelector("select#ctl00_DefaultContent_WorklistCtrl_drpPageSize", function() { 
							this.capture("avero.png");
						}, function onTimeout() {
							this.echo("Timed Out!");
							this.capture("avero.png");
						}, 15000);

					});
				});
								
				casper.then( function() {
					childSnapshot.ref().remove();
					console.log("Signout completed!");
					var start = new Date().getTime();
					  for (var b = 0; b < 1e7; b++) {
					  if ((new Date().getTime() - start) > 3000){
						break;
						}
					  }
					});
			}
			
			  if (oneData.action=="cptDeletes") {
				casper.then(function() {console.log("cptDeletes " + oneData.caseNumber + " Starting...");});

				casper.thenOpen("https://path.averodx.com/Custom/Avero/Billing/ChargePreview.aspx?CaseNo=" + oneData.caseNumber, function () {
					this.evaluate(function() {
						UserID=101773; //This is Matt Muenster's id
						var lstAssignedCharges = document.getElementById("ctl00_DefaultContent_chargeEditControl_lstAssignedCharges");
						// total number of items in list
						var optsLength = lstAssignedCharges.options.length;
						// let loop through items and find out what is selected, if selected, add charges per quantity.
						for (var a = 0; a < optsLength; a++) {
							var valueplit = lstAssignedCharges.options[a].value.split("_");
							//This is a sleep function because the website requires the calls to be spaced out to work.
						APvX.Billing_WS.Charge_ReduceQuantity(valueplit[1], valueplit[0], valueplit[3], UserID, OnRemoveChargeSuccess, OnRemoveChargeSuccess );
						var start = new Date().getTime();
						  for (var b = 0; b < 1e7; b++) {
						  if ((new Date().getTime() - start) > 3000){
							break;
							}
						  }
						 }
						});
					});
		
				casper.then( function() {
					childSnapshot.ref().remove();
					console.log("cptEdits deletion completed!");	
				});
			}
		
			  if (oneData.action=="cptAdds") {
				casper.then( function() {
					console.log("cptAdds " + oneData.caseNumber + " Starting...");
					codes=oneData.cptCodes.split(" ").sort();
					console.log("codes="+codes);
				});
				
				//This section adds the codes contained in oneData.cptCodes	
				casper.thenOpen("https://path.averodx.com/Custom/Avero/Billing/ChargePreview.aspx?CaseNo=" + oneData.caseNumber, function () {
					this.capture("avero2.png");
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
									var UserID = 101773;
									var selOptionValue=document.querySelector("select#ctl00_DefaultContent_chargeEditControl_AssociatedChargesAccordion_content_lstAssociatedCharges").options[index].value;
									var testdropdown = document.getElementById("ctl00_DefaultContent_chargeEditControl_drpSelectTest");
									testorderid = testdropdown.options[testdropdown.selectedIndex].value;
									APvX.Billing_WS.AddCharge(selOptionValue, testorderid, 1 , UserID, OnAddChargeSuccess, OnAddChargeSuccess);
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
					
				casper.then( function() {
					childSnapshot.ref().remove();
					console.log("Signout deletion completed!");
					});
		}		
	    });		
	casper.run(function() {
		setTimeout(function(){listenToFirebase();},20000);
		});
  });
};
