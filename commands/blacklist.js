const { commandAccessKey } = require('../config.json');
module.exports = {
	name: 'blacklist',
	aliases: ['block', 'stop', 'flag'],
	description: 'prevent reactions on a specified post or url from triggering a repost - requires a password for use.',
	usage: '<hall of fame post id || media url> <access key>',
	args: true,
	cooldown: 3,
	guildOnly: false,
	execute(message, args, db) {
		if(args[1] !== commandAccessKey) {
			return message.reply('You didn\'t provide the correct access key!');
		}

		if(args[0].includes('/')) {
			return;
		}
		else {
			return;
		}

		function updateRow(url, msgID, table) {
			return { url, msgID, table };
		}
	},
};