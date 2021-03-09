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
			.then(msg => insertReactions(msg.reactions.cache))
			.catch(console.error);

		async function insertReactions(reactions) {
			for(const reaction of reactions.values()) {
				try {
					const users = await reaction.users.fetch();

					for(const user of users.values()) {
						const values = [hallOfFame.getURLFromMsg(reaction.message), user.id, user.tag, reaction.emoji.name];

						db.run('INSERT INTO reactions VALUES (?, ?, ?, ?)', values, err => {
							if(err) console.error(err);
						});
					}
				}
				catch(err) {
					console.error(err);
				}
			}
			console.log('Cached reactions');
		}
	},
};