Module.register("MMM-Jira-Top", {
    // Default module config.
    defaults: {
      hasGantt: true,   // Not currently used
      siteUrl: "",
      apiVersion: 2,
      userEmail: "",
      updateInterval: 10 * 60 * 1000,
      maxCardsPerBoard: 5,
      maxCards: 15,
      apiToken: "MY API KEY",
    },

    start: function() {
		var self = this;
		var dataRequest = null;

		//Flag for check if module is loaded
		this.loaded = false;
        
        this.creds = btoa(this.defaults.userEmail+":"+this.defaults.apiToken);
        this.urlBase = "https://"+this.defaults.siteUrl+"/rest/api/" + this.defaults.apiVersion;
		
		this.sendSocketNotification('CONFIG', this.config);
	},

    socketNotificationReceived: function(notification, payload) {
        if (notification === "BOARDS") {
            this.boards = payload;
			this.loaded = true;
			this.updateDom(this.config.animationSpeed);

            // There's got to be a better way to do this, but I can't seem to
            // figure out when the DOM is loaded. Wait 2 seconds and assume...
            setTimeout (this.clickItSetup,2000, this, this.boards);
		}
	},    
    
    popup2: function(id, boards){

        var overlay = document.querySelector('.overlay');
    
    },

    // Have to pass a copy of this because the referential frame when this
    // gets called doesn't include the module. It's the DIV it's attached to
    clickItSetup: function(whodis, boards) {
        var self = whodis;
        var allCards = document.getElementsByClassName("acard");

        for (var i = 0; i < allCards.length; i++) {
            (function (index) {
              allCards[index].addEventListener('click', function () {
                self.popup(allCards[index].id, boards);
              });
            })(i);
          }
    },


    getStyles: function () {
        return [`${this.name}.css`];
      },

    getTemplate: function() {
		return `${this.name}.njk`;
	},
    	
    // Add all the data to the template.
	getTemplateData () {
		return {
			config: this.config,
			boards: this.boards,
            priority: this.priority,
		};
	},

    // It feels like this should be done via Nunjucks, but I don't think it can
    popup: function(id, boards){
        // Clear everything out first
        var overlay = document.querySelector('.overlay');
        overlay.textContent = '';

        var overlayContent =  document.createElement("div");
        var overlayClose = document.createElement("span");
        var overlayBoard = document.createElement("h2");
        var overlaySummary = document.createElement("p");
        var overlayDuedate = document.createElement("p");
        var overlayUpdated = document.createElement("p");
        var overlayDescription = document.createElement("p");
        var overlayPriority = document.createElement("p");
        var overlayAssignee = document.createElement("p");
    
        var projectSpan = document.createElement("span");
        projectSpan.className = "leadin"
    
        var cardNameSpan = document.createElement("span");
        cardNameSpan.className = "cardName";
    
        var descSpan = document.createElement("span");
        descSpan.className = "leadin";
    
        var assigneeSpan = document.createElement("span");
        assigneeSpan.className = "leadin";
    
        var lastUpdateSpan = document.createElement("span");
        lastUpdateSpan.className = "leadin";
    
        var prioritySpan = document.createElement("span");
    
    
        overlayContent.className = "overlay-content";
        overlayClose.className = "close-button";
        overlayClose.addEventListener("click", () => this.closeOverlay());
        overlayClose.innerHTML = "Close &times;"
    
        for(var i = 0; i < boards.length; i++){
            for(var c = 0; c < boards[i].cards.length; c++){
                if(boards[i].cards[c].key === id){
                    var card = boards[i].cards[c];
                    projectSpan.textContent = "Project: ";
                    overlayBoard.textContent = boards[i].projName;
                    overlayBoard.insertBefore(projectSpan,overlayBoard.firstChild);
    
                    cardNameSpan.textContent = card.key + ": ";
                    overlaySummary.textContent = card.summary;
                    overlaySummary.insertBefore(cardNameSpan,overlaySummary.firstChild);
    
                    if(card.duedate){
                        overlayDuedate.textContent = "Due: " + card.duedate;
                    }
                    else{
                        overlayDuedate = null;
                    }
    
                    descSpan.textContent = "Desc: ";
                    overlayDescription.textContent = card.description;
                    overlayDescription.insertBefore(descSpan,overlayDescription.firstChild);
    
                    assigneeSpan.textContent = "Assignee: ";
                    overlayAssignee.textContent = card.assignee;
                    overlayAssignee.insertBefore(assigneeSpan,overlayAssignee.firstChild);
    
                    lastUpdateSpan.textContent = "Last updated: ";
                    // Convert updated. Comes from Jira as datetime string
                    // This is ugly. Also internationalize: https://bugfender.com/blog/javascript-date-and-time/
                    var u = new Date(card.updated);
                    overlayUpdated.textContent = 
                        [u.getFullYear(), String(u.getMonth()).padStart(2,"0"), 
                        String(u.getDate()).padStart(2,"0")].join('-') + " " +
                        [String(u.getHours()).padStart(2,"0"), 
                            String(u.getMinutes()).padStart(2,"0")].join(':');
                    overlayUpdated.insertBefore(lastUpdateSpan,overlayUpdated.firstChild);
    
                    var pClass = "leadin";
                    switch(card.priority){
                        case "Low":
                            pClass = "pLow";
                            break;
                    case "Medium":
                        pClass = "pMedium";
                        break;
                    case "High":
                        pClass = "pHigh";
                        break;
                    }
    
                    prioritySpan.textContent = "Priority: ";
                    prioritySpan.className = pClass;
                    overlayPriority.textContent = card.priority;
                    overlayPriority.insertBefore(prioritySpan, overlayPriority.firstChild);
                }
            }
        }
    
        // Add our card content
        overlayContent.appendChild(overlayBoard);
        overlayContent.appendChild(overlaySummary);
        if(overlayDuedate){
            overlayContent.appendChild(overlayDuedate);
        }
        overlayContent.appendChild(overlayDescription);
        overlayContent.appendChild(overlayPriority);
        overlayContent.appendChild(overlayAssignee);
        overlayContent.appendChild(overlayUpdated);
    
        overlayContent.appendChild(overlayClose);
        overlay.appendChild(overlayContent);
        overlay.style.display = 'flex';
    
    },
    
    closeOverlay: function() {
        document.querySelector('.overlay').style.display = 'none';
    }

  });

