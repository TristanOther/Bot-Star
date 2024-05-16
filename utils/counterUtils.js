/*
*   File: counterUtils.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/15/2024
*   Last Modified: 05/15/2024
*
*   This is a util module allows for updating the bot's counters (member counters etc.)
*/

// Imports
const fs = require("fs");
const path = require("path");
const ROOT_PATH = process.env.ROOT_PATH;
const CONFIG = JSON.parse(process.env.CONFIG);


/*
*   removeCounter
*   Function for removing the counter from a name.
*   @PARAM {string} str - the name to edit.
*   @RETURN {string} - returns the name without the counter text.
*/
function removeCounter(str) {
    var match = str.match(/(.*): \d+$/);
    return match ? match[1] : str;
}

/*
*   updateCounter
*   This function is a helper function for updating counters. It abstracts the functionality
*   of all the specific functions below, simply updating a channel to have the specified value
*   as its counter value.
*   @PARAM {Guild} guild - the server to edit the counter in.
*   @PARAM {GuildChannel} channel - the channel to edit the counter of.
*   @PARAM {integer} value - the value to set the counter to.
*   @RETURN - None.
*/
async function updateCounter(guild, channel, value) {
    try {
        await guild.channels.edit(channel.id, {name: `${removeCounter(channel.name)}: ${value}`});
    } catch (err) {
        if (err) console.error(err);
    }
}

/*
*   updateUserCounter, updateBotCounter, updateMemberCounter
*   These functions update member counters within a Discord server.
*   @PARAM {Guild} guild - the server to edit the counter in.
*   @PARAM {GuildChannel} channel - the channel to edit the counter of.
*   @RETURN - None.
*/
// Counter updater for only user members.
async function updateUserCounter (guild, channel) {
    // Get the member count of the server.
    var count = guild.members.cache.filter(m => !m.user.bot).size;
    // Update the counter.
    await updateCounter(guild, channel, count);
}

// Counter updater for only bot members.
async function updateBotCounter (guild, channel) {
    // Get the bot count of the server.
    var count = guild.members.cache.filter(m => m.user.bot).size;
    // Update the counter.
    await updateCounter(guild, channel, count);
}

// Counter updater for all members.
async function updateMemberCounter (guild, channel) {
    // Get the member count of the server.
    var count = guild.members.cache.size;
    // Update the counter.
    await updateCounter(guild, channel, count);
}

/*
*   updateType
*   Parses the type and chooses the appropriate updater to update the counter.
*   @PARAM {Guild} guild - the server to edit the counter in.
*   @PARAM {GuildChannel} channel - the channel to edit the counter of.
*   @PARAM {string} type - the type of this counter.
*   @RETURN - None.
*/
async function updateType (guild, channel, type) {
    if (type == "members") {
        await updateUserCounter(guild, channel);
    } else if (type == "bots") {
        await updateBotCounter(guild, channel);
    } else if (type == "all") {
        await updateMemberCounter(guild, channel);
    }
}

/*
*   swapChannel
*   Swaps the channel a counter is on.
*   @PARAM {Guild} guild - the server to swap the counter in.
*   @PARAM {GuildChannel} oldchannel - the channel that's currently a counter.
*   @PARAM {GuildChannel} newChannel - the new counter channel.
*   @PARAM {string} type - the type of this counter.
*/
async function swapChannel (guild, oldChannel, newChannel, type) {
    // Remove the counter from the old channel name.
    try {
        await guild.channels.edit(oldChannel.id, {name: removeCounter(oldChannel.name)});
    } catch (err) {
        if (err) console.error(err);
    }
    // Add the counter to the new channel.
    if (type == "members") {
        await updateUserCounter(guild, newChannel);
    } else if (type == "bots") {
        await updateBotCounter(guild, newChannel);
    } else if (type == "all") {
        await updateMemberCounter(guild, newChannel);
    }
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
        var counter = await db.get(getCounter, guild.id, counterType);
        try {
            var channel = await guild.channels.cache.find(c => c.id == counter.channel_id);
        } catch (err) {
            if (err) console.error(err);
        }
        await updateType(guild, channel, counterType);
    }
}

// Export functions.
module.exports = {
    updateUserCounter: updateUserCounter,
    updateBotCounter: updateBotCounter,
    updateMemberCounter: updateMemberCounter,
    updateType: updateType,
    swapChannel: swapChannel,
    removeCounter: removeCounter,
    refreshCounters: refreshCounters,
};