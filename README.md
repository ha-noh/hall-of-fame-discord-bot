# hall-of-fame-discord-bot
This bot takes popular image posts from a channel (which are evaluated based on reactions from unique users), and reposts them to a separate channel (the hall of fame, so to speak). It will track the total number of reactions and display them (via number emojis) on the repost.

## setup
1. Install the following npm packages in the project directory:
	- discord.js
	- sqlite3
	- dotenv
2. Inside the project directory, create two files: `.env` and `config.json`. 
	- The dotenv file is just one line, `BOT_TOKEN = theTokenFromYourDiscordDeveloperPortal`, which allows the the bot to connect to a discord account.
	- The config file should contain the following name/value pairs:
		``` 
		{
			"prefix": "!",
			"inputChannelID": "the channel id of the channel you're watching for reactions",
			"outputChannelID": "the channel id of the channel you want the reposted media to go",
			"reactionThreshold": "the number of reactions you want to trigger a repost"
		}
		```