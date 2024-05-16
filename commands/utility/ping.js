/*
*   File: ping.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/10/2024

*
*   This command currently acts as a simple ping tester.
*/

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	global: true,
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Replies with Pong."),
	async execute(interaction) {
		await interaction.reply(`:ping_pong: Pong! ${interaction.client.ws.ping}ms`);
	}
};