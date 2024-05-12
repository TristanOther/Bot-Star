/*
*   File: ready.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/10/2024
*   Last Modified: 05/11/2024
*
*   This module handles processing the ClientReady events (when the bot comes online).
*/

const {Events} = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Bot* ready! Logged in as ${client.user.tag}.`);
	}
};