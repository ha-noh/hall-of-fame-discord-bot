const { commandAccessKey } = require('../config.json');
module.exports = {
	name: 'blacklist',
	aliases: ['block', 'stop', 'flag'],
	description: 'enable or disable reposts for a given url - requires a password for use.',
	usage: '<media url> <true || false> <access key>',
	args: true,
	cooldown: 3,
	guildOnly: false,
	execute(message, args, db) {
		if(args[2] !== commandAccessKey) {
			return message.reply('You didn\'t provide the correct access key!');
		}

		if(args[1].toLowerCase() == 'true') {
			updateRow(args[0], 1)
				.then(() => {
					message.reply('Url has been blaclisted');
				})
				.catch(err => {
					message.reply('Blacklist operation failed')
				});
		}
		else if(args[1].toLowerCase() == 'false') {
			updateRow(args[0], 0);
		}
		else {
			return message.reply('Your second arg has to be \'true\' or \'false\'');
		}

		function updateRow(url, blacklistFlag) {
			return new Promise((resolve, reject) => {
				const sql = 'UPDATE posts SET blacklist = ? WHERE url = ?';

				db.run(sql, [blacklistFlag, url], err => {
					if(err) reject(err.message);

					resolve('row updated');
				});
			});
		}
	},
};