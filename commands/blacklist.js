const { commandAccessKey } = require('../config.json');
module.exports = {
	name: 'blacklist',
	aliases: ['block', 'stop', 'flag'],
	description: 'prevent reactions on a specified post or url from triggering a repost',
	usage: '<hall of fame post id **OR** media url>',
	args: true,
	cooldown: 3,
	guildOnly: false,
	execute(message, args, db) {
		return;
	},
};