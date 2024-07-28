/* Magic Mirror
 * Node Helper: MMM-Jira-Top
 *
 * By Mark Juric
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
const Log = require("logger");
const axios = require('axios');

module.exports = NodeHelper.create({

	start: function() {
		var self = this;
		console.log("Starting node helper for: " + this.name);
		this.config = null;
	},

	getData: function(state) {	
		// Make a request for time estimates
		axios.get(this.urlApi, {
			headers: {
				'Authorization': `Basic ${this.creds}`,
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		})
		.then(response => {
			if(state === "PROJECT"){
				this.cards = [];
				this.gatherProjects(response.data);
			}
			else if (state === "BOARDS") {
				this.gatherCards(response.data);
			}
			else{
				Log.log("Unknown state: " + " with response.data: " + response.data)
			}
		})
		.catch(error => {
			Log.log("Errored on " + this.urlApi)
			console.log("Errored %o", error)
			this.sendSocketNotification("ERROR", `In ${this.state} request with status code: ${error.response}, error data: ${error.data}, error message: ${error.headers} for URL ${this.urlApi}`);
		});
	},

	/* socketNotificationReceived(notification, payload)
	 * This method is called when a socket notification arrives.
	 *
	 * argument notification string - The identifier of the noitication.
	 * argument payload mixed - The payload of the notification.
	 * 
	 * We're only paying attention to a reconfiguration here
	 */
	socketNotificationReceived: function(notification, payload) {
		this.sendSocketNotification("Test", 0);
		if (notification === 'CONFIG') {
			this.config = payload;

			this.creds = btoa(this.config.userEmail+":"+this.config.apiToken);
			this.urlApi = "https://"+this.config.siteUrl+"/rest/api/" + this.config.apiVersion + "/project/search";
			this.getData("PROJECT");
		}
	},

	gatherProjects: function(payload) {

		this.numBoards = payload.values.length;
		for (var i = 0, count = payload.values.length; i <count ; i++) {
			var proj = payload.values[i];
			this.urlApi = "https://"+this.config.siteUrl+"/rest/api/" + this.config.apiVersion + "/search?jql=project=" + proj.key;
			this.getData("BOARDS");
		}

		if(this.intervalId){
			clearInterval(this.intervalId);
		}
		
		this.intervalId = setInterval(() => {
			// Reset our URL
			this.urlApi = "https://"+this.config.siteUrl+"/rest/api/" + this.config.apiVersion + "/project/search";
			this.getData("PROJECT");
		}, this.config.updateInterval);		

	},

	gatherCards: function(payload){
		var projKey = ''
		var projName = ''
		var cardList = []
		var displayName = 'Unassigned'
		var desc = 'Empty';
		for (var i = 0, count = payload.issues.length; i < count ; i++) {
			var card = payload.issues[i];
			outerCount = 0;
			if(i == 0){
				// First time through
				projKey = card.fields.project.key;
				projName = card.fields.project.name;
			}
			// Only look for cards that aren't resolved. Assume "resolutiondate" is empty on those
			if(!card.fields.resolutiondate){
				if(card.fields.assignee){
					displayName = card.fields.assignee.displayName;
				}
				if(card.fields.description){
					desc = card.fields.description;
				}
				var cardRec = {"key": card.key, "id": card.id, "duedate": card.fields.duedate, 
					"updated": card.fields.updated, "summary": card.fields.summary, "inward":[], "outward":[],
					"description": desc, "priority": card.fields.priority.name, "assignee": displayName }

				/* Check for dependent cards. 
				 inward dependence: This ticket cannot start until the other ticket finishes
				 outward dependence: Other ticket cannot start until this ticket finishes */
				 if(card.fields.issuelinks.length){
					deps = card.fields.issuelinks;
					for(var d = 0; d < deps.length; d++){
						if(deps[d].inwardIssue){cardRec.inward.push(deps[d].inwardIssue.id);}
						else if(deps[d].outwardIssue){
							cardRec.outward.push(deps[d].outwardIssue.id);
							outerCount++;
						}
					}
				 }
				 cardList.push(cardRec)
			}
		}

		// Clean up what we captured to maxCardsPerBoard
		// First, sort them
		cardList.sort((a,b) => {
			var dateA = new Date(a.duedate)
			var dateB = new Date(b.duedate)
			if(a.duedate !== b.duedate && a.duedate !== null && b.duedate !== null) {
				return dateA - dateB;
			}

			dateA = new Date(a.updated)
			dateB = new Date(b.updated)

			return dateB - dateA
		});

		// Truncate boards if we need to
		if(cardList.length > this.config.maxCardsPerBoard){
			cardList.length = this.config.maxCardsPerBoard
		}

		if(cardList.length > 0){
			this.cards.push({"projKey": projKey, "projName": projName, "cards": cardList});
		}


		this.numBoards -= 1
		if(this.numBoards == 0){
			/* This is brute force and not pretty
			 TODO: Resort ALL the cards for all the boards bubbling those 
			 with dependencies to the top. If your maxCards is 10 and you 
			 return 20 cards with dependencies, you should have 10 cards with
			 dependencies even if you have more recently updated cards. */

			// Done processing all the cards. Send a notification back to main
			// to display the data
			var cardCount = 0
			for(var i = 0; i < this.cards.length; i++){
				if(cardCount + this.cards[i].cards.length > this.config.maxCards){
					// Delete everything else
					this.cards[i].cards.length = this.config.maxCards - cardCount
					cardCount = this.config.maxCards
					if (this.cards[i].cards.length === 0){
						delete(this.cards[i])
					}
				}
				else{
					cardCount += this.cards[i].cards.length
				}
			}

			// Done processing all the cards. Send a notification back to main to display the data
			this.sendSocketNotification('BOARDS',this.cards)
		}
	}
});
