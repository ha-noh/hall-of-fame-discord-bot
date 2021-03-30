module.exports = {
	name: 'refresh',
	aliases: ['reload'],
	description: 'Refreshes a command and uncaches the previous version of the command file',
	usage: '<command name>',
	args: true,
	cooldown: 3,
	guildOnly: false,
	execute(message, args, db) {
		if(!args.length) return;

		const commandName = args[0].toLowerCase();
		const command = message.client.commands.get(commandName)
			|| message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

		if(!command) return message.channel.send(`There is no command with name or alias \`${commandName}, ${message.author}!`);

		delete require.cache[require.resolve(`./${command.name}.js`)];

		try {
			const newCommand = require(`./${command.name}.js`);
			message.client.commands.set(newCommand.name, newCommand);
			message.channel.send(`Command \`${command.name}\` was refreshed!`);
		}
		catch(error) {
			console.error(error);
			message.channel.send(`There was an error while reloading a command \`${command.name}\`:\n\`${error.message}\``);
		}
	},
};