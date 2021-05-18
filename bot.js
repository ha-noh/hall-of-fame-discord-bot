const { prefix, inputChannelID } = require('./config.json');
const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'REACTION', 'USER'] });
client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();

const hallOfFame = require('./hallOfFame.js');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('db/halloffame.db', (err) => {
	if(err) return console.error(err.message);
	console.log('Connected to the halloffame database.');
});

const cliArgs = process.argv.slice(2);
switch(cliArgs[0]) {
case 'drop':
	dropTables().then(createHofTables);
	console.log('Dropped old tables');
	break;
case 'alter':
	alterTables();
	break;
default:
	if(cliArgs[0]) console.log(`'${cliArgs[0]}' is not a recognized CLI arg`);
	createHofTables();
}

const fs = require('fs');
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for(const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.once('ready', () => {
	console.log(`Hof bot is live! Use '${prefix}' to summon me.`);
});

client.on('message', message => {
	if(message.author.bot) return;

	else if(message.channel.id === inputChannelID && containsImageOrVideo(message)) {
		insertIntoDb(message);
	}

	else if(!message.content.startsWith(prefix)) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();
	const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

	if(!command) return;

	if (command.guildOnly && message.channel.type === 'dm') {
		return message.reply('I can\'t execute that command inside DMs!');
	}

	if(command.args && !args.length) {
		let reply = (`You have to provide arguments with that command, ${message.author}!`);

		if(command.usage) {
			reply += `\nUsage: \`${prefix}${command.name} ${command.usage}\``;
		}

		return message.channel.send(reply);
	}

	if(!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 3) * 1000;

	// if the user has put the command on cooldown, check if the command is still unavailable to them
	if(timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			return message.reply(`Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
		}
	}

	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

	try {
		command.execute(message, args, db);
	}
	catch(error) {
		console.error(error);
		message.reply('Gomenasorry, there was an issue executing that command.');
	}

});

client.on('messageReactionAdd', async (reaction, user) => {
	if(reaction.partial) {
		try {
			await reaction.fetch();
		}
		catch(error) {
			return console.error('Something went wrong when fetching the message: ', error);
		}
	}

	if(user.partial) {
		try {
			await user.fetch();
		}
		catch(error) {
			return console.error('Something went wrong when fetching the user: ', error);
		}
	}

	if(reaction.message.channel.id !== inputChannelID || !containsImageOrVideo(reaction.message)) return;
	hallOfFame.execute(reaction, user, db);
});

require('dotenv').config();
client.login(process.env.BOT_TOKEN);

function insertIntoDb(msg) {
	const url = hallOfFame.getURLFromMsg(msg);
	const values = [url, 0, 0, msg.author.id, msg.author.tag];
	const insertSQL = `INSERT INTO posts (
							url, 
							repost, 
							count, 
							userid, 
							usertag
						) VALUES (?, ?, ?, ?, ?)`;

	db.run(insertSQL, values, err => {
		if(err) return console.error(err.message);
		console.log(`Added ${url} to the database`);
	});
}

function createHofTables() {
	const postsSQL = `CREATE TABLE IF NOT EXISTS posts (
							url TEXT PRIMARY KEY,
							repost INTEGER NOT NULL,
							count INTEGER NOT NULL,
							userid TEXT NOT NULL,
							usertag TEXT NOT NULL,
							repostid TEXT,
							blacklist INTEGER
						)`;
	const reactionsSQL = `CREATE TABLE IF NOT EXISTS reactions (
								url TEXT NOT NULL,
								userid TEXT NOT NULL,
								usertag TEXT NOT NULL,
								emoji TEXT NOT NULL,
								PRIMARY KEY (url, userid, emoji),
								FOREIGN KEY (url) REFERENCES posts (url)
									ON DELETE CASCADE
									ON UPDATE NO ACTION
							)`;

	db.run(postsSQL, (err) => {
		if(err) return console.error(err.message);
	});

	db.run(reactionsSQL, (err) => {
		if(err) return console.error(err.message);
	});
}

// Embeds and attachments properties will never be null, even if they're empty
// Additionally, the image preview created by attachments are not considered embeds
function containsImageOrVideo(msg) {
	return Boolean(msg.embeds.length || msg.attachments.size);
}

function dropTables() {
	return new Promise(resolve => {
		db.run('DROP TABLE posts', [], err => {
			if(err) console.error(err.message);

			db.run('DROP TABLE reactions', [], err => {
				if(err) console.error(err.message);
				resolve('tables dropped');
			});
		});
	});
}

function alterTables() {
	return new Promise(resolve => {
		db.run('ALTER TABLE posts ADD COLUMN blacklist INTEGER', [], err => {
			if(err) return console.error(err.message);

			console.log('Added blacklist column');

			db.run('ALTER TABLE posts RENAME COLUMN flag TO repost', [], err => {
				if(err) return console.error(err.message);

				console.log('Renamed flag column')
				resolve('Table altered successfully');
			});
		});
	});
}
