/*
*   File: discordUtils.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/17/2024
*
*   Util module for performing actions within Discord.
*/

// Imports
const fs = require("fs");
const path = require("path");

const ROOT_PATH = process.env.ROOT_PATH;
const CONFIG = JSON.parse(process.env.CONFIG);

/*
*   renameChannel
*   Edits the name of a channel.
*   @PARAM {Guild} guild - the server to edit the counter in.
*   @PARAM {GuildChannel} channel - the channel to edit the counter of.
*   @PARAM {string} newName - the new name for the channel.
*/
async function renameChannel(guild, channel, newName) {
    try {
        // Update channel name if the new name is different.
        if (newName != channel.name) await guild.channels.edit(channel.id, {name: newName});
    } catch (err) {
        if (err) console.error(err);
    }
}


// Export functions.
module.exports = {
    renameChannel: renameChannel,
};