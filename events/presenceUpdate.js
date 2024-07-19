/*
*   File: presenceUpdate.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/12/2024
*
*   This module handles processing presenceUpdate events.
*/

// Imports
const path = require("path");
const ROOT_PATH = process.env.ROOT_PATH;
const CONFIG = JSON.parse(process.env.CONFIG);
const dbUtils = require(path.join(ROOT_PATH, CONFIG.utils.dbUtils));
const {Events} = require('discord.js');
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

module.exports = {
	name: Events.PresenceUpdate,
	async execute(oldPresence, newPresence) {
		// Stop bot from crashing if a presence updates while booting.
		if (!newPresence.client.activityTrackedUsers) return;
		// Check if the user has activity tracking enabled.
		if (!newPresence.client.activityTrackedUsers.includes(newPresence.user.id)) return;
		// Get the user's presence.
		var presence = newPresence.status ? newPresence.status : "offline"; // Discord doesn't always bother storing "offline" statuses.
		// Get the user's connected devices.
		var devices = newPresence.clientStatus ? Object.keys(newPresence.clientStatus) : [];
		// Get the user's status.
		var status = newPresence.activities.length > 0 ? newPresence.activities[0].state : "N/A";

		// Check if the this update matches the user's previous update (debounces event).
		if (newPresence.client.userUpdates[newPresence.user.id]) {
			var prev = newPresence.client.userUpdates[newPresence.user.id];
			let prevPresence = prev.status ? prev.status : "offline"
			let prevDevices = prev.clientStatus ? Object.keys(prev.clientStatus) : [];
			let prevStatus = prev.activities.length > 0 ? prev.activities[0].state : "N/A";
			if (prevPresence == presence && prevDevices == devices && prevStatus == status) {
				newPresence.client.userUpdates[newPresence.user.id] = newPresence;
				return;
			}
		}
		newPresence.client.userUpdates[newPresence.user.id] = newPresence;
		

		// Load SQL queries.
		var logActivityQuery = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.logActivity), 'utf8');

		// Open connection to database.
        const db = new dbUtils(CONFIG.files.db);
        await db.open();

		// Write activity to database.
		await db.run(logActivityQuery, 
					 newPresence.user.id,
					 presence,
					 status,
					 parseInt(Date.now()),
					 devices.includes('mobile') ? 1 : 0,
					 devices.includes('desktop') ? 1 : 0,
					 devices.includes('web') ? 1 : 0);

		// Close database connection.
		await db.close();
	}
};