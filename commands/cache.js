module.exports = {
	name: 'cache',
	aliases: ['store'],
	description: 'retrieve the reactions on a specific message and record them in the database',
	usage: '<message id>',
	args: true,
	cooldown: 2,
	guildOnly: true,
	execute(message, args, db) {
		const { inputChannelID } = require('../config.json');
		const hallOfFame = require('../hallOfFame.js');
		const msgID = args[0];

		message.client.channels.fetch(inputChannelID)
			.then(channel => channel.messages.fetch(msgID))
			.then(msg => {
				cacheReactions(msg.reactions.cache);
				message.reply('the reactions were successfully stored in the db.');
			})
			.catch(err => {
				console.error(err);
				message.reply('something went wrong with the caching request. Woops!');
			});

		async function cacheReactions(reactions) {
			insertPost(reactions.first());
			try {
				for(const reaction of reactions.values()) {
					await reaction.users.fetch()
						.then(users => insertUsers(reaction, users))
						.catch(console.error);
				}

				getCount(hallOfFame.getURLFromMsg(reactions.first().message))
					.then(count => updateRecord(reactions.first(), count))
					.catch(console.error);

				console.log('Cached reactions');
			}
			catch(err) {
				console.error(err.message);
			}
		}

		function insertPost(reaction) {
			return new Promise(resolve => {
				const sql = `INSERT INTO posts (
								url, 
								repost, 
								count, 
								userid, 
								usertag
							) VALUES (?, ?, ?, ?, ?)`;
				const values = [hallOfFame.getURLFromMsg(reaction.message), 0, 0, reaction.message.author.id, reaction.message.author.tag];

				db.run(sql, values, err => {
					if(err) return console.error(err.message);
					resolve('Inserted post');
				});
			});
		}

		function insertUsers(reaction, users) {
			users.each(user => insertReaction(reaction, user));
		}

		function insertReaction(reaction, user) {
			return new Promise(resolve => {
				const values = [hallOfFame.getURLFromMsg(reaction.message), user.id, user.tag, reaction.emoji.name];

				db.run('INSERT INTO reactions VALUES (?, ?, ?, ?)', values, err => {
					if(err) {
						resolve(0);
					}
					resolve(1);
				});
			});
		}

		function getCount(url) {
			return new Promise(resolve => {
				db.get('SELECT COUNT(*) as count FROM reactions WHERE url = ?', [url], (err, row) => {
					if(err) console.error(err.message);
					resolve(row.count);
				});
			});
		}

		function updateRecord(reaction, counter) {
			return new Promise(resolve => {
				const url = hallOfFame.getURLFromMsg(reaction.message);

				db.get('SELECT * FROM posts WHERE url = ?', [url], err => {
					if(err) return console.error(err.message);

					db.run('UPDATE posts SET count = ? WHERE url = ?', [counter, url], err => {
						if(err) return console.error(err.message);

						resolve('record updated');
					});
				});
			});

		}
	},
};