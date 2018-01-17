# Poet-bot


Project Oriented Enlightenment Tool (Poet) is a serverless natural language processing Slack bot that responds to questions regarding JIRA.

## Configuration

* [Create an AWS account](https://aws.amazon.com/free/) if haven't got one already
* Clone this repository and change directory by running:

    ```
    git clone https://github.com/PouriaSterling/poet-bot.git
    cd poet-bot
    ```

* run `npm install`
* [Install Serverless](https://serverless.com/framework/docs/providers/aws/guide/installation/) and [configure your AWS credentials](https://www.youtube.com/watch?v=mRkUnA3mEt4).
* [Create your Slack app](https://api.slack.com/slack-apps#create-app) and configure its credentials as well as those for Luis and JIRA by creating a `local.yml` file:

	```
	# Local variables -- DO NOT COMMIT!

	dev:
	  slack:
	    clientId: "<Your Dev Slack App Client ID>"
	    clientSecret: <Your Dev Slack App Client Secret>
	    botId: "<Your Dev Slack Bot ID>"

      luis:
        url: <Your Dev Luis Endpoint URL>

      jira:
        name: "<Your Dev JIRA Username>"
        password: "<Your Dev JIRA Password>"
        url: "<Your Dev JIRA Base URL>"

	production:
	  slack:
	    clientId: "<Your Production Slack App Client ID>"
	    clientSecret: <Your Production Slack App Client Secret>
	    botId: "<Your Production Slack Bot ID>"

	  luis:
        url: <Your Production Luis Endpoint URL>

      jira:
        name: "<Your Production JIRA Username>"
        password: "<Your Production JIRA Password>"
        url: "<Your Production JIRA Base URL>"
	```

  Notes:
  * 'clientid' must be quoted otherwise it is interpreted as a number.
  * Leave your 'botId' fields empty for now, we will configure them after you've created your bot.
  * Do not commit this file. It is already Git ignored.

* Deploy the server to AWS Lambda `serverless deploy` or a shorter form `sls deploy`

  Make a note of the endpoints output once it has deployed, e.g.:

	```
	endpoints:
	  GET - https://ab12cd34ef.execute-api.ap-southeast-2.amazonaws.com/dev/install
	  GET - https://ab12cd34ef.execute-api.ap-southeast-2.amazonaws.com/dev/authorized
	  POST - https://ab12cd34ef.execute-api.ap-southeast-2.amazonaws.com/dev/receptionist
	```

* Go to your [Slack app](https://api.slack.com/apps) and:
  * Select 'OAuth & Permissions' and in the 'Redirect URL(s)' box paste the `authorized` endpoint
  * Select 'Bot Users' and then 'Add a Bot User' to create a bot for your application
    * Set 'Always Show My Bot as Online' to on
  * Select 'Event Subscriptions' and:
    * Switch 'Enable Events' to on
    * in the 'Request URL' box paste the `receptionist` endpoint and wait for it to verify
    * Once verified, under 'Subscribe to Bot Events' select 'Add Bot User Event' and choose 'message.channels'
    * Save changes

* Navigate to your `install` endpoint using your browser and choose 'Add to Slack'
  * Choose your workspace in the top right
  * Authorize the application

* Go to your Slack workspace and invite the bot you just added to a desired channel

* Now you can populate the botId field of your local.yml file in a few different ways. The ID will start with a 'U' and be followed by 8 alphanumeric characters. In the Slack web client, do one of the following:
  * Go to `Manage members` and select `Download member list as a CSV` and look for your bot's `userid` field. Note you may not have sufficient priveleges in your workspace to access this page.
  * Send a message mentioning the bot using `@YOUR_BOT_NAME`, then hovering your mouse over the blue highlighted name should display a link in the bottom left corner of your browser. The ID is after the last forward slash.
  * If the above doesnt work, you can right click on the blue highlighted name and select `inspect`. You will find the botID at the end of the `href` attribute
  * *Note:* Deleting or re-adding the bot will cause this ID to change.

* Deploy your changes using `sls deploy`

* You're all set to start asking your bot about JIRA! Start by greeting the bot or asking for help.


## Development

If you are making changes to only a single Lambda function and would like to deploy your changes, you can use

```
sls deploy function -f <FUNCTION_NAME>
```

You can run a local offline version of your Lambdas using

```
sls offline start
```

and sending requests using a program such as [Postman](https://chrome.google.com/webstore/detail/postman/fhbjgbiflinjbdggehcddcbncdddomop?hl=en)

## Adding Functionality

To add new intent functionality, train Luis for the intent and create a new handler in the [/intentHandlers](https://github.com/PouriaSterling/poet-bot/tree/master/src/intentHandlers) folder (making sure to use the exact same name for Luis and the file). Put all your logic in that file. You can use an existing intent handler as a template to get you started.