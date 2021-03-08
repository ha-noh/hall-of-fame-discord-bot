module.exports = {
	name: 'cache',
	aliases: 'store',
	description: 'retrieve the reactions on a specific message and record them in the db',
	usage: '<message id>',
	args: true,
	cooldown: 2,
	guildOnly: false,
	execute(message, args, db) {
		const msgID = args[0];
		console.log('TEST MSG: cached reactions for message ' + msgID);
	},
};