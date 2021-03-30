const { commandAccessKey } = require('../config.json');
module.exports = {
	name: 'delete',
	aliases: ['remove', 'purge'],
	description: 'delete all database entries pertaining to a specified hall of fame post or media url - requires a password for use.',
	usage: '<hall of fame post id || media url> <access key>',
	args: true,
	cooldown: 3,
	guildOnly: false,
	execute(message, args, db) {
		if(args[1] !== commandAccessKey) {
			return message.reply('You didn\'t provide the correct access key!');
		}

		if(args[0].includes('/')) {
			deleteRows(args[0], null, 'posts')
				.then(() => deleteRows(args[0], null, 'reactions'))
				.then(() => {
					console.log(`Deleted rows for ${args[0]}`);
					message.reply('Successfully deleted entries from the db!');
				})
				.catch(console.error);
		}
		else {
			deleteRows(null, args[0], 'posts')
				.then(() => deleteRows(null, args[0], 'reactions'))
				.then(() => {
					console.log(`Deleted rows for ${args[0]}`);
					message.reply('Successfully deleted entries from the db!');
				})
				.catch(console.error);
		}

		function deleteRows(url, msgID, table) {
			return new Promise(resolve => {
				const sql = `DELETE FROM ${table} WHERE ${url ? 'url' : 'repostid'} = ?`;

				db.run(sql, url ? url : msgID, err => {
					if(err) return console.error(err.message);

					resolve('row deleted');
				});
			});
		}
	},
};