/*
*   File: ready.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/10/2024
*   Last Modified: 05/14/2024
*
*   This module handles processing the ClientReady events (when the bot comes online).
*/

// Imports
const path = require("path");
const ROOT_PATH = process.env.ROOT_PATH;
const CONFIG = JSON.parse(process.env.CONFIG);
const dbUtils = require(path.join(ROOT_PATH, CONFIG.utils.dbUtils));
const {Events} = require("discord.js");
const fs = require("fs");

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		// Open connection to database.
        const db = new dbUtils(CONFIG.files.db);
        await db.open();
		// Load SQL queries.
		var creationQuery = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.createTables), 'utf8');
		var trackedQuery = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.getTrackedUsers), 'utf8');
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