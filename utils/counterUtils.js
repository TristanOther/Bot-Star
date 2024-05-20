/*
*   File: counterUtils.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/15/2024
*
*   This is a util module allows for updating the bot's counters (member counters etc.)
*/

// Imports
const fs = require("fs");
const path = require("path");

const ROOT_PATH = process.env.ROOT_PATH;
const CONFIG = JSON.parse(process.env.CONFIG);

const discordUtils = require(path.join(ROOT_PATH, CONFIG.utils.discordUtils));

/*
*   removeCounter
*   Function for removing the counter text from a name (removes `: <num>` off the end of a string).
*   @PARAM {string} str - the name to edit.
*   @RETURN {string} - returns the name without the counter text.
*/
function removeCounter(str) {
    var match = str.match(/(.*): \d+$/);
    return match ? match[1] : str;
}

/*
*   updateCounter
*   Update a given counter.
*   @PARAM {Guild} guild - the server to edit the counter in.
*   @PARAM {GuildChannel} channel - the channel to edit the counter of.
*   @PARAM {string} type - the type of counter being updated.
*   @RETURN - None.
*/
async function updateCounter(guild, channel, type) {
    // Get the count data.
    var count;
    if (type == "members") {
        count = await guild.members.cache.filter(m => !m.user.bot).size;
    } else if (type == "bots") {
        count = await guild.members.cache.filter(m => m.user.bot).size;
    } else if (type == "all") {
        count = await guild.members.cache.size;
    }
    // Update the counter.
    await discordUtils.renameChannel(guild, channel, `${removeCounter(channel.name)}: ${count}`);
}

/*
*   swapChannel
*   Swaps the channel a counter is on.
*   @PARAM {Guild} guild - the server to swap the counter in.
*   @PARAM {GuildChannel} oldchannel - the channel that's currently a counter.
*   @PARAM {GuildChannel} newChannel - the new counter channel.
*   @PARAM {string} type - the type of this counter.
*/
async function swapChannel(guild, oldChannel, newChannel, type) {
    // Remove the counter from the old channel name.
    await discordUtils.renameChannel(guild, channel, removeCounter(oldChannel.name));
    // Add the counter to the new channel.
    await updateCounter(guild, newChannel, type);
}

/*
*   refreshCounters
*   Function allowing for specific counters to be refreshed for a server.
*   @PARAM {Guild} guild - the guild to refresh counters for.
*   @PARAM {array} counters - a list of counter types to refresh.
*   @param {dbUtils} db - a dbUtils instance representing the database to use.
*   @RETURN - None.
*/
async function refreshCounters(guild, counters, db) {
    // Load SQL queries.
    var getCounter = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.getCounter), 'utf8');
    // Refresh each counter.
    for (counterType of counters) {
        // Get the counter.
        var counter = await db.get(getCounter, guild.id, counterType);
        // Find the channel for this counter.
        try {
            var channel = await guild.channels.cache.find(c => c.id == counter.channel_id);
        } catch (err) {
            if (err) console.error(err);
        }
        // Update the counter.
        await updateCounter(guild, channel, counterType);
    }
}

// Export functions.
module.exports = {
    updateCounter: updateCounter,
    swapChannel: swapChannel,
    removeCounter: removeCounter,
    refreshCounters: refreshCounters,
};