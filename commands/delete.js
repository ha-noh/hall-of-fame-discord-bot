const { commandAccessKey } = require('../config.json');
module.exports = {
	name: 'delete',
	aliases: ['remove', 'purge'],
	description: 'delete all database entries pertaining to a specified hall of fame post or media url, requires a password for use',
	usage: '<hall of fame post id **OR** media url>',
	args: true,
	cooldown: 3,
	guildOnly: false,
	execute(message, args, db) {
		return;
	},
};