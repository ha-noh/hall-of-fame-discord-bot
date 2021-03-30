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

		message.reply('success');
	},
};