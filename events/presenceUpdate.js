/*
*   File: presenceUpdate.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/12/2024
*   Last Modified: 05/13/2024
*
*   This module handles processing presenceUpdate events.
*/

const configParser = require("../utils/configParser.js");
const CONFIG = new configParser("./configs/config.cfg");
const {Events} = require('discord.js');
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

module.exports = {
	name: Events.PresenceUpdate,
	async execute(oldPresence, newPresence) {
		// Check if the user has activity tracking enabled.
		if (!newPresence.client.activityTrackedUsers.includes(newPresence.user.id)) return;
		// Get the user's presence.
		var presence = newPresence.status ? newPresence.status : "offline"; // Discord doesn't always bother storing "offline" statuses.
		// Get the user's connected devices.
		var devices = newPresence.clientStatus ? Object.keys(newPresence.clientStatus) : [];
		// Get the user's status.
		var status = newPresence.activities.length > 0 ? newPresence.activities[0].state : "N/A";
		console.log(status);

		// Write entry to DB.

		// Load SQL queries.
		var logActivityQuery = fs.readFileSync('./queries/log_activity.sql', 'utf8');

		// Open connection to database.
		let db = new sqlite3.Database(CONFIG.get("File_Paths").db, sqlite3.OPEN_READWRITE, (err) => {
			if (err) return console.error(err);
			db.run(logActivityQuery, [newPresence.user.id, presence, status, parseInt(Date.now()), devices.includes('mobile') ? 1 : 0, devices.includes('desktop') ? 1 : 0, devices.includes('web') ? 1 : 0], (err) => {
				if (err) console.error(err);
				// Close DB.
				db.close((err) => {
					if (err) return console.log(err);
				});
			});
		});
	}
};