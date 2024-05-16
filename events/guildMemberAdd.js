/*
*   File: guildMemberAdd.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/15/2024
*
*   This module handles processing guildMemberAdd events.
*/

// Imports
const path = require("path");
const ROOT_PATH = process.env.ROOT_PATH;
const CONFIG = JSON.parse(process.env.CONFIG);
const dbUtils = require(path.join(ROOT_PATH, CONFIG.utils.dbUtils));
const counterUtils = require(path.join(ROOT_PATH, CONFIG.utils.counterUtils));
const {Events} = require('discord.js');
const fs = require("fs");

module.exports = {
	name: Events.GuildMemberAdd,
	async execute(member) {
		// Open connection to database.
        const db = new dbUtils(CONFIG.files.db);
        await db.open();
		// Refresh counters.
		await counterUtils.refreshCounters(member.guild, ["members", "bots", "all"], db);
		// Close database connection.
		await db.close();
	}
};