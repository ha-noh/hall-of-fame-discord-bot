# hall-of-fame-discord-bot
This bot takes popular image posts from a channel (which are evaluated based on reactions from unique users), and reposts them to a separate channel (the hall of fame, so to speak). It will track the total number of reactions and display them (via number emojis) on the repost.

## setup
1. You must have node.js installed on the machine hosting the bot. Install the following npm packages in the project directory:
	- discord.js
	- sqlite3
	- dotenv
2. Inside the project directory, create two files: `.env` and `config.json`. 
	- The dotenv file is just one line, `BOT_TOKEN = theTokenFromYourDiscordDeveloperPortal`, which allows the the bot to connect to a discord account. Dotenv is simply a means for the source code to use a proxy value instead of the actual token - DON'T SHARE YOUR TOKEN.
	- The config file should contain the following name/value pairs (copy and paste the following and fill the "" with actual values):
		``` 
		{
			"prefix": "!",
			"inputChannelID": "the channel id of the channel you're watching for reactions",
			"outputChannelID": "the channel id of the channel you want the reposted media to go",
			"reactionThreshold": "the number of reactions you want to trigger a repost"
		}
		```
	- You can find the id of a channel by right clicking a channel. Both the input and output channels should be text channels.
3. Spin up the bot by going to the project directory in a terminal and using the command `node bot.js SomeOptionalArgs`. The optional arguments include:
	- `drop` : This will drop the existing `posts` and `reactions` tables on startup and create empty tables to replace them. This can't be undone!