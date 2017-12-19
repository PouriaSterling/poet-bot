# poet-bot

A serverless natural language processing Slack bot that responds to questions regarding JIRA

## Configuration

* [Create an AWS account](https://aws.amazon.com/free/) if haven't got one already
* [Install Serverless](https://serverless.com/framework/docs/providers/aws/guide/installation/) and [configure your AWS credentials](https://serverless.com/framework/docs/providers/aws/guide/credentials/)
* [Create your Slack app](https://api.slack.com/slack-apps#create-app) and configure its credentials by creating a `local.yml` file:

	```
	# Local variables -- DO NOT COMMIT!

	dev:
	  slack:
	    clientId: "<Your Dev Slack App Client ID>"
	    clientSecret: <Your Dev Slack App Client Secret>

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

	  luis:
        url: <Your Production Luis Endpoint URL>

      jira:
        name: "<Your Production JIRA Username>"
        password: "<Your Production JIRA Password>"
        url: "<Your Production JIRA Base URL>"
	```

  Note that the clientid must be quoted otherwise it is interpreted as a number. Do not commit this file. It is already Git ignored.
* Deploy the server to AWS Lambda:

	```
	serverless deploy
	```

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

* You're all set to start asking your bot about JIRA!