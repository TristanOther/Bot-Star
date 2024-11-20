/*
*   File: interactionCreate.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/11/2024
*
*   This module handles processing interaction events.
*/

// Imports
const CONFIG = JSON.parse(process.env.CONFIG);
const COLORS = JSON.parse(process.env.COLOR_CONFIG);
const {Events} = require('discord.js');
const path = require('path');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		// Slash commands.
		if (interaction.isChatInputCommand()) {
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
		// Buttons.
		} else if (interaction.isButton()) {
			args = interaction.customId.split('.');
			if (args[0] == "nonConstantState") {
				if (args[args.length - 2] == "expectedUser") {
					if (args[args.length - 1] != interaction.user.id) await interaction.reply({content: "You're not supposed to click this button!", ephemeral: true});
				}
				return;
			}
			const interaction_handler = interaction.client.interaction_handlers.get(args[0]);
			if (!interaction_handler) {
				console.error(`No interaction handler matching ${args[0]} was found.`);
				return;
			}
			try {
				await interaction_handler.execute(interaction, args.splice(1));
			} catch (error) {
				console.error(error);
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({content: "There was an error with this interaction.", ephemeral: true});
				} else {
					await interaction.reply({content: "There was an error with this interaction.", ephemeral: true});
				}
			}
		// String select menus.
		} else if (interaction.isStringSelectMenu()) {
			const interaction_handler = interaction.client.interaction_handlers.get(interaction.customId);
			if (!interaction_handler) {
				console.error(`No interaction handler matching ${args[0]} was found.`);
				return;
			}
			try {
				await interaction_handler.execute(interaction);
			} catch (error) {
				console.error(error);
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({content: "There was an error with this interaction.", ephemeral: true});
				} else {
					await interaction.reply({content: "There was an error with this interaction.", ephemeral: true});
				}
			}
		// 
		} else if (interaction.isAutocomplete()) {
			// Get the command for this autocomplete.
			const command = interaction.client.commands.get(interaction.commandName);
			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}
			// Run the autocomplete handler for this command.
			try {
				await command.autocomplete(interaction);
			} catch (error) {
				console.error(error);
				return;
			}
		// Log random shit.
		} else {
			console.log("Unknown interaction.");
		}

	}
};