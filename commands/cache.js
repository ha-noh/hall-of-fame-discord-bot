module.exports = {
	name: 'cache',
	aliases: 'store',
	description: 'retrieve the reactions on a specific message and record them in the db',
	usage: '<message id>',
	args: true,
	cooldown: 2,
	guildOnly: false,
	execute(message, args, db) {
		const { inputChannelID } = require('../config.json');
		const hallOfFame = require('../hallOfFame.js');
		const msgID = args[0];

		message.client.channels.fetch(inputChannelID)
			.then(channel => channel.messages.fetch(msgID))
			.then(msg => cacheReactions(msg.reactions.cache))
			.catch(console.error);

		async function cacheReactions(reactions) {
			insertPost(reactions.first());
			let counter = 0;
			try {
				for(const reaction of reactions.values()) {
					await reaction.users.fetch().then(async users => {
						for(const user of users.values()) {
							counter += await insertReaction(reaction, user);
						}
					});
				}
				updateRecord(reactions.first(), counter);
			}
			catch(err) {
				console.error(err);
			}
			console.log(`Cached ${counter} unique reactions`);
		}

		function insertPost(reaction) {
			return new Promise(resolve => {
				const sql = `INSERT INTO posts (
								url, 
								flag, 
								count, 
								userid, 
								usertag
							) VALUES (?, ?, ?, ?, ?)`;
				const values = [hallOfFame.getURLFromMsg(reaction.message), 0, 0, reaction.message.author.id, reaction.message.author.tag];

				db.run(sql, values, err => {
					if(err) return;
					resolve('Inserted post');
				});
			});
		}

		function insertReaction(reaction, user) {
			return new Promise((resolve, reject) => {
				const values = [hallOfFame.getURLFromMsg(reaction.message), user.id, user.tag, reaction.emoji.name];

				db.run('INSERT INTO reactions VALUES (?, ?, ?, ?)', values, err => {
					if(err) {
						reject(0);
					}
					resolve(1);
				});
			});
		}

		function updateRecord(reaction, counter) {
			const url = hallOfFame.getURLFromMsg(reaction.message);

			db.get('SELECT * FROM posts WHERE url = ?', [url], (err, row) => {
				if(err) return console.error(err);

				db.run('UPDATE posts SET count = ? WHERE url = ?', [row.count + counter, url], err => {
					if(err) return console.error(err);
				});
			});
		}
	},
};