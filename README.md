# MMM-Jira-Top

This a module for <strong>MagicMirror</strong><br>
https://magicmirror.builders/<br>
https://github.com/MichMich/MagicMirror

![Screenshot](screenshots/MMM-Jira-Top.png?raw=true "Screenshot")

MMM-Jira-Top is a module to display the top Jira tickets in an Atlassian Jira Cloud hosted instance. It has not been tested with Jira Server but it should work as long as your version supports API v2.

 If you use a Gantt chart addon which populates `inward` and `outward` `issuelinks`, MMM-Jira-Top will display a visual indication of the dependent order on which those cards must be completed.

 ![Screenshot](screenshots/MMM-Jira-Top-gantt.png?raw=true "Dependent cards")

Cards are sorted per-board by first by `duedate` then by `updated` date. Afterwards, the list of cards is truncated to ```config.maxCardsPerBoard```. If there are no cards in the project, the project isn't listed.

**TO-DO:** Cards with dependency links should be treated as higher priority since other work is relying on them to be completed first. Right now, it's just a brute-force selection of top cards per-board instead of all dependent cards in all boards. In other words ```config.maxCardsPerBoard``` should fill up to ```config.maxCards``` with dependent cards before considering any cards without dependent first.

### Pop-ups and Touch
MMM-Jira-Top is also touch enabled. Clicking on any card will display a pop-up with details such as `description`, `assignee`, etc. There's a BUNCH of information it could download via the API but this is what I wanted to see. If there's interest, I can possibly modify it to display other info.

![Detail popup](screenshots/MMM-Jira-Top-popup.png?raw=true "Detail popup")

**NOTE:** I used Nunjucks templating system because I wanted to learn it. It made it easier in general except for the popup overlay which I had to create programmatically. Feedback on how to use Nunjucks templating for that use case is greatly apprecaited. Also, if your display is empty where you expect to see something, make sure your using at least version 2.2.0 of MagicMirror.

## Installation

1. Navigate into your MagicMirror `modules` folder and execute<br>
`git clone https://github.com/gajillion/MMM-Jira-Top.git`.
2. Enter the new `MMM-Jira-Top` directory and execute `npm install`.

## Configuration

At a minimum you need to supply the following required configuration parameters:

* `siteUrl`
* `userEmail`
* `apiToken`

`siteUrl` is the Atlassian Cloud URL that points to your Jira board and other Atlassian products. It will look something like `xxxx.atlassian.net`. With appropriate authorization, you should be able to run a JQL query at this URL with something like `https://xxxx.atlassian.net/rest/api/2/search?jql=project=MYPROJ`, where `xxxx` is your Atlassian site name, and `MYPROJ` is the name of one of your Atlassian projects.

`userEmail` should be the Atlassian user account associated with the `apiToken` you've created.
`apiToken` should be created following the instructions at `https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/`. 

There's probably a more secure way to handle this than embedding your credentials in the module so if you have any ideas, let me know. API tokens are all-or-nothing so be very careful what you do with these credentials.

### Translations
Unfortunately I haven't put any translation mechanisms in so it is what it is. If there's someone who wants the ability to use this in a different language, let me know and I can incorporate it.

### Other optional parameters

<table>
  <thead>
    <tr>
      <th>Option</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>hasGantt</code></td>
      <td>Not used. Will eventually be used to recreate Gantt chart functionality. I use the WBS Gantt Chart app which auto-populates the <code>inward</code>/<code>outward</code> <code>issuelinks</code> as well as duedates.<br><br><strong>Type</strong> <code>Boolean</code><br>Defaults to <code>False</code></td>
    </tr>
    <tr>
      <td><code>updateInterval</code></td>
      <td>Refresh card data interval in milliseconds. Be careful you don't blow out your API allocation here. If you're not frequently updating your cards, you can set this to daily.<br><br><strong>Type</strong> <code>Number</code><br>Defaults to <code>600,000</code>ms or 10 minutes</td>
    </tr>
    <tr>
      <td><code>apiVersion</code></td>
      <td>Which Atlassian API version to use. Currently only <code>2</code> is supported. If <code>3</code> comes up with anything interesting, I'll considering a rewrite. <br><br><strong>Type</strong><code>Number</code><br>Defaults to <code>2</code></td>
    </tr>
    <tr>
      <td><code>maxCardsPerBoard</code></td>
      <td>The maximum number of Jira cards to display from an individual board or project. If <code>maxCardsPerBoard</code> is greater than or equal to <code>maxCards</code>, it's possible only cards from any single board will be displayed. <br><br><strong>Type</strong> <code>Number</code><br>Defaults to <code>5</code></td>
    </tr>
    <tr>
      <td><code>maxCards</code></td>
      <td>The maximum number of Jira cards total to display for the module. After <code>maxCardsPerBoard</code> cards are collected, the list of cards is truncated to this number. . <br><br><strong>Type</strong> <code>Number</code><br>Defaults to <code>15</code></td>
    </tr>
  </tbody>
</table>

## Sample Configuration

```
{
    module: "MMM-Jira-Top",
    position: "bottom_right",
    config: {
        siteUrl: "myurl.atlassian.net",
        userEmail: "myusermail@mail.com",
        updateInterval: 10 * 60 * 1000,
        maxCardsPerBoard: 5,
        maxCards: 15,
        apiToken: "MY API TOKEN"
    }
},
```