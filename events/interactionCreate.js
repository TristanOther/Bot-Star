/*
*   File: interactionCreate.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/11/2024
*   Last Modified: 05/15/2024
*
*   This module handles processing interaction events.
*/

// Imports
//console.log(process.env);
//return;
const COLORS = JSON.parse(process.env.COLOR_CONFIG);
const {Events} = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		// If not a chat interaction (slash command), ignore this event.
		if (!interaction.isChatInputCommand()) return;
		
		// Get the command that was run.
		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			// Get the color for the configured command category.
			const color = Number(COLORS.commands[command.data.category]);
			// Execute the command.
			await command.execute(interaction, color);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({content: "There was an error while executing this command!", ephemeral: true});
			} else {
				await interaction.reply({content: "There was an error while executing this command!", ephemeral: true});
			}
		}
	}
};