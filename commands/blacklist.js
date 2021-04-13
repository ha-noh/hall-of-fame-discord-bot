const { commandAccessKey } = require('../config.json');
module.exports = {
	name: 'blacklist',
	aliases: ['block', 'stop', 'flag'],
	description: 'blacklist a url from reposting or restore a blacklisted url; provide \'true\' to disable reposts, \'false\' to enable. Requires a password for use.',
	usage: '<media url> <true || false> <access key>',
	args: true,
	cooldown: 3,
	guildOnly: false,
	execute(message, args, db) {
		if(args[2] !== commandAccessKey) {
			return message.reply('You didn\'t provide the correct access key!');
		}

		const booleanString = args[1].toLowerCase();

		if(booleanString === 'true' || booleanString === 'false') {
			const flag = booleanString === 'true' ? 1 : 0;

			updateRow(args[0], flag)
				.then(() => {
					message.reply(`Url has been ${flag ? 'blacklisted' : 'whitelisted'}.`);
				})
				.catch(err => {
					console.error(err);
					message.reply('Blacklist operation failed.');
				});
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