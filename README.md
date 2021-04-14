# hall-of-fame-discord-bot
This bot takes popular image posts from a channel (which are evaluated based on reactions from unique users), and reposts them to a separate channel (the hall of fame, so to speak). It will track the total number of reactions and display them on the repost.

## setup
1. You must have node.js installed on the machine hosting the bot. Navigate to the project directory in the CLI of your choice and install all the node.js dependencies using the command `npm install`. A full list of these dependencies is listed in `package.json`.
2. Inside the project directory, create two files: `.env` and `config.json`. 
	- The dotenv file is just one line, `BOT_TOKEN = includeYourToken`, which allows the bot to be authenticated through a discord account. You can find your token in the discord developer portal. The Dotenv package is simply a means for the source code to use a proxy value instead of the actual token - YOU SHOULD NEVER SHARE YOUR TOKEN.
	- The config file is a list of name value pairs; copy the text below and replace the values (the quoted text to the right of the colon) with their appropriate values - or as you see fit.
		``` 
		{
			"prefix": "! (or whatever symbol you want your bot commands to be called with)",
			"inputChannelID": "the channel id of the channel you're watching for reactions",
			"outputChannelID": "the channel id of the channel you want the reposted media to go",
			"reactionThreshold": "the number of reactions you want to trigger a repost"
			"commandAccessKey": "a password that you will need to enter for restricted access commands"
		}
		```
	- You can find the id of a channel by right clicking a channel. Both the input and output channels should be text channels.
3. Spin up the bot by going to the project directory in your CLI and using the command `node bot.js`. This can be followed with optional text arguments, which include:
	- `drop` : This will delete the existing `posts` and `reactions` tables on startup and create empty tables to replace them. This can't be undone!