/*
*   File: ready.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/10/2024
*   Last Modified: 05/11/2024
*
*   This module handles processing the ClientReady events (when the bot comes online).
*/

const configParser = require("../utils/configParser.js");
const CONFIG = new configParser("./configs/config.cfg");
const {Events} = require("discord.js");
const dbUtils = require("../utils/dbUtils.js");
const fs = require("fs");

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		// Open connection to database.
        const db = new dbUtils(CONFIG.get("File_Paths").db);
        await db.open();
		// Load SQL queries.
		var creationQuery = fs.readFileSync('./queries/table_creation.sql', 'utf8');
		var trackedQuery = fs.readFileSync('./queries/get_tracked_users.sql', 'utf8');
		// Initialize tables.
		await db.exec(creationQuery);
		// Get tracked users.
		var users = await db.all(trackedQuery);
		client.activityTrackedUsers = users.map(obj => obj.user_id);
		// Close DB and log bot start.
		await db.close();
		console.log(`Bot* ready! Logged in as ${client.user.tag}.`);
	}
};