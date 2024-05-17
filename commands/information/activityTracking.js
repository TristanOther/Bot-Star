/*
*   File: activityTracking.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/12/2024
*
*   This command allows users to enable/disable activity tracking for themselves.
*/

// Imports
const fs = require("fs");
const path = require("path");
const ROOT_PATH = process.env.ROOT_PATH;
const CONFIG = JSON.parse(process.env.CONFIG);
const COLORS = JSON.parse(process.env.COLOR_CONFIG);
const dbUtils = require(path.join(ROOT_PATH, CONFIG.utils.dbUtils));
const {SlashCommandBuilder, EmbedBuilder} = require("discord.js");
const Image = require(path.join(ROOT_PATH, CONFIG.utils.image));


const dayjs = require("dayjs");

module.exports = {
    global: false,
    // Create a slash command called `activitytracking` with subcommands `enable` and `disable`.
	data: new SlashCommandBuilder()
		.setName("activitytracking")
		.setDescription("Activity tracking allows users to track their Discord online activity.")
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup
                .setName("toggle")
                .setDescription("Enable/disable activity tracking for your account (disabled by default).")
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("enable")
                        .setDescription("Enable activity tracking for your account."))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("disable")
                        .setDescription("Disable activity tracking for your account.")))
        .addSubcommand(subcommand =>
            subcommand
                .setName("history")
                .setDescription("View activity tracking history for a user.")
                .addUserOption(option => 
                    option.setName("target")
                        .setDescription("The user to view history for.")
                        .setRequired(false))
        ),
    /*
    *   execute
    *   Executes this command.
    *   @PARAM {obj} interaction - the interaction that triggered this command.
    *   @PARAM {string} color - the color code that embeds in this command should use.
    *   @RETURN - None.
    */
    async execute(interaction, color) {
        const client = interaction.client;
        // Open connection to database.
        const db = new dbUtils(CONFIG.files.db);
        await db.open();

        // Get this user from database.
        var getUserQuery = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.getUser), 'utf8');
        var user = await db.get(getUserQuery, interaction.user.id);

        // Enable/disable tracking commands. (`Toggle` subcommand category.)
        if (interaction.options.getSubcommandGroup() == "toggle") {
            // SQL queries.
            var toggleTrackingQuery = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.setUserTracking), 'utf8');
            var addTrackingQuery = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.insertUser), 'utf8');
            // Enable tracking subcommand.
            if (interaction.options.getSubcommand() === "enable") {
                // Enable tracking for this user in the database.
                if (user) {
                    await db.run(toggleTrackingQuery, 1, interaction.user.id);
                    await db.close();
                } else {
                    await db.run(addTrackingQuery, interaction.user.id, 1);
                    await db.close();
                }
                // Add user to the list of currently tracked users.
                client.activityTrackedUsers.push(interaction.user.id);
                // Send reply message.
                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setAuthor({name: `Tracking enabled for ${interaction.member.displayName}.`, iconURL: interaction.user.displayAvatarURL()})
                    .setDescription("Tracking is disabled by default, and may be disabled at any time by the user. This bot does not track users who have not manually enabled tracking themselves. We make no guarantees about data collected when a user has enabled tracking for themselves, that data may be retained for an indefinite period, but no further data will be collected if the user disables tracking.")
                    .setTimestamp()
                await interaction.reply({embeds: [embed]});
            // Disable tracking subcommand.
            } else if (interaction.options.getSubcommand() === "disable") {
                // Disable tracking for this user in the database.
                if (user) {
                    await db.run(toggleTrackingQuery, 0, interaction.user.id);
                    await db.close();
                } else {
                    await db.close();
                }
                // Remove user from the list of currently tracked users.
                client.activityTrackedUsers = client.activityTrackedUsers.filter(id => id != interaction.user.id);
                // Send reply message.
                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setAuthor({name: `Tracking disabled for ${interaction.member.displayName}.`, iconURL: interaction.user.displayAvatarURL()})
                    .setDescription("Tracking is disabled by default, and may be disabled at any time by the user. This bot does not track users who have not manually enabled tracking themselves. We make no guarantees about data collected when a user has enabled tracking for themselves, that data may be retained for an indefinite period, but no further data will be collected if the user disables tracking.")
                    .setTimestamp()
                await interaction.reply({embeds: [embed]});
            }
        // Activity history viewer. 
        } else if (interaction.options.getSubcommand() === "history") {
            // SQL queries.
            var getActivityQuery = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.getUserActivity), 'utf8');

            // Get the targeted guildMember, otherwise use the sender if noone was specified.
            var user = interaction.options.getUser("target");
            var member = user ? await interaction.guild.members.fetch(user) : interaction.member;

            // Query activity data for the specified user for the past 24 hours.
            var activity = await db.all(getActivityQuery, member.id);
            await db.close();
            if (!activity || activity.length <= 0) return await interaction.reply({embeds: [new EmbedBuilder().setColor(color).setDescription("No tracking data avalible for this user.")]}); //Error if no activity data.

            /*
            *   generateTimestamps
            *   Function for generating a list of timestamps over a certain period of time.
            *   @PARAM {integer} start - timestamp of how far back data should be collected.
            *   @PARAM {integer} duration - number of minutes between each timestamp (10 = each timestamp is a 10 min period).
            *   @RETURN {array} - returns a list of timestamps of the specified duration from the start to now.
            */
            function generateTimestamps(start, duration) {
                    const timestamps = [];
                    const now = Date.now();
                    const durationMillis = duration * 60 * 1000;
                
                    for (let i = start; i < now; i += durationMillis) {
                        timestamps.push(i);
                    }
                
                    return timestamps;
            }
            
            /*
            *   colorTimestamps
            *   Converts a list of timestamps into a list of status colors.
            *   @PARAM {array} ts - list of timestamps to convert.
            *   @PARAM {array} rows - rows from querying user data.
            *   @RETURN {array} - returns a list of colors as hex code strings.
            */
            function colorTimestamps(ts, rows) {
                let result = ts.map(x => x);
                let curRow = 0;
                let curTS = 0;
                while (curTS < result.length) {
                    if ((curRow < (rows.length - 1)) && (rows[curRow + 1].timestamp < result[curTS])) {
                        curRow++;
                        continue;
                    }
                    result[curTS] = COLORS.status[rows[curRow].presence];
                    curTS++;
                }
                return result;
            }

            /*
            *   generateTimes
            *   Generates string representations of times evenly spaced across a timestamp range.
            *   @PARAM {integer} start - the starting timestamp.
            *   @PARAM {integer} end - the ending timestamp.
            *   @PARAM {integer} count - how many values to generate. 
            *   @PARAM {string} scale - the scale of the data (oneof: minutes, hours, days).
            *   @RETURN {array} - returns a list of `count` strings representing times.
            */
            function generateTimes(start, end, count, scale) {
                if (count < 2) {
                    throw new Error('Count must be at least 2 to generate intervals.');
                }
            
                if (start > end) {
                    [start, end] = [end, start]; // Swap start and end if start is greater
                }
            
                const scales = {
                    minutes: 60 * 1000,
                    hours: 60 * 60 * 1000,
                    days: 24 * 60 * 60 * 1000
                };
            
                const scaleMillis = scales[scale];
                if (!scaleMillis) {
                    throw new Error(`Invalid scale: ${scale}. Valid scales are 'minutes', 'hours', 'days'.`);
                }
            
                const duration = end - start;
                const interval = Math.floor(duration / (count - 1)); // Round down to the nearest whole number
            
                const times = [];
            
                const options = {
                    hours: { hour: 'numeric', hour12: true },
                    days: { month: 'numeric', day: 'numeric' }
                };
            
                const formatter = new Intl.DateTimeFormat('en-US', options[scale] || {});
            
                for (let i = 0; i < count; i++) {
                    const timestamp = new Date(start + i * interval);
                    let timeString;
            
                    switch (scale) {
                        case 'minutes':
                            timeString = formatter.format(timestamp); // Not specifically formatted as per scale
                            break;
                        case 'hours':
                            timeString = formatter.format(timestamp);
                            break;
                        case 'days':
                            timeString = formatter.format(timestamp);
                            break;
                    }
            
                    times.push(timeString);
                }
            
                return times;
            }

            let timestamps = generateTimestamps(Date.now() - (24 * 60 * 60 * 1000), 15);
            let colors = colorTimestamps(timestamps, activity);
            let legend = generateTimes(timestamps[0], timestamps[timestamps.length - 1], 5, "hours");

            // Construct the activity card image.
            var img = new Image.UserActivityCard(member, "24hr");
            await img.init(colors, legend);
            var attachment = await img.getAttachment();

            // Reply to the interaction.
            await interaction.reply({files: [attachment], emphemeral: false});
        }

    }
};