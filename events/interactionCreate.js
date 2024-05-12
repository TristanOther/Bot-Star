/*
*   File: interactionCreate.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/11/2024
*   Last Modified: 05/11/2024
*
*   This module handles processing interaction events.
*/

const configParser = require("../utils/configParser.js");
const COLORS = new configParser("./configs/colors.cfg");
const {Events} = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			const color = Number(COLORS.get(command.data.category));
			await command.execute(interaction, color);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({content: 'There was an error while executing this command!', ephemeral: true});
			} else {
				await interaction.reply({content: 'There was an error while executing this command!', ephemeral: true});
			}
		}
	}
};