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
const Image = require(path.join(ROOT_PATH, CONFIG.utils.imageUtils));


const moment = require('moment-timezone');

module.exports = {
    global: true,
    // Create a slash command called `activitytracking` with subcommands `enable` and `disable`.
	data: new SlashCommandBuilder()
		.setName("activitytracking")
		.setDescription("Activity tracking allows users to track their Discord online activity.")
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup
            .setName("privacy")
            .setDescription("Configure activity tracking for your account (disabled by default).")
            .addSubcommand(subcommand =>
                subcommand
                .setName("info")
                .setDescription("Learn about privacy settings!")
            )
            .addSubcommand(subcommand =>
                subcommand
                .setName("set")
                .setDescription("Set your account's tracking privacy settings.")
                .addStringOption(option => 
                    option
                    .setName("options")
                    .setDescription("Use 'info' to learn about each privacy setting!")
                    .setRequired(true)
                    .addChoices(
                        {name: "Public", value: "public"},
                        {name: "Private", value: "private"},
                        {name: "Disabled", value: "disabled"})))
        )
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
        if (interaction.options.getSubcommandGroup() == "privacy") {
            // Privacy info command.
            if (interaction.options.getSubcommand() == "info") {
                // Text blurbs.
                var publicStore = "__What we collect/store:__\n- Your Discord presence (online/away/do not disturb/offline).\n- Your status (what you're playing, custom statuses, etc.)\n- Your username, user ID, and other **public** account information.";
                var privateStore = "__What we collect/store:__\n- We may collect and store **public** information about your account such as username and user ID. This allows us to track that you've disabled activity tracking."
                // Build embed.
                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle("Activity Tracking Privacy:")
                    .setDescription("By default, all tracking is disabled for users. Users have full control of their privacy when it comes to activity tracking using Bot*, and when activity tracking is disabled we collect and store no data about your user actitivty. In order for activity tracking to function, the bot must store information about your statuses. When your status updates (for example, when you turn off your computer and Discord changes your status from `online` to `offline`), if you have activity tracking enabled we log that change. This data allows us to displays statistics about your Discord activity. Below is detailed information about what information we collect and when.")
                    .addFields(
                        {name: "Setting - Public:", value: `${publicStore}\n__"Who can view my data?":__\nWhen set to public, anyone who shares a server with you can check your activity tracking history. When checking your history the message will be visible to any user who has access to the channel the command is run in.`},
                        {name: "Setting - Private:", value: `${publicStore}\n__"Who can view my data?":__\nWhen set to private, only you may check your own activity tracking history. When checking your history the message will only be visible to you.`},
                        {name: "Setting - Disabled:", value: `${privateStore}\n__"Who can view my data?":__\nWhen disabled, only you may check your own activity tracking history. No new data will be collected or displayed, but if you have existing history you may still view that data. When checking your history the message will only be visible to you.`},
                        {name: "Removing Data:", value: `If you have existing tracking data you would like to remove you can run the \`activitytracking clear\` command. This command will **permanently** remove any tracking history we have of your account.`}
                    )
                await interaction.reply({embeds: [embed]});
            // Set privacy command.    
            } else if (interaction.options.getSubcommand() == "set") {
                var privacy = interaction.options.getString("options");
                // SQL queries.
                var setTrackingQuery = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.setUserTracking), 'utf8');
                var addTrackingQuery = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.insertUser), 'utf8');
                // Update user tracking in DB.
                if (user) {
                    await db.run(setTrackingQuery, privacy, interaction.user.id);
                } else {
                    await db.run(addTrackingQuery, interaction.user.id, interaction.user.username, privacy);
                }
                await db.close();
                // Update cache to reflect tracking status.
                if (privacy == "disabled") {
                    client.activityTrackedUsers = client.activityTrackedUsers.filter(id => id != interaction.user.id);
                } else {
                    client.activityTrackedUsers.push(interaction.user.id);
                }
                // Send confirmation message.
                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setAuthor({name: `Tracking updated for ${interaction.member.displayName}.`, iconURL: interaction.user.displayAvatarURL()})
                    .setDescription(`Tracking Privacy: \`${privacy[0].toUpperCase()}${privacy.slice(1)}\`\nTracking is disabled by default, and may be disabled at any time by the user. This bot does not track users who have not manually enabled tracking themselves. We make no guarantees about data collected when a user has enabled tracking for themselves, that data may be retained for an indefinite period, but no further data will be collected if the user disables tracking.`)
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
            // Get privacy setting for user.
            var userPrivacy = await db.get(getUserQuery, member.id);
            userPrivacy = userPrivacy ? (userPrivacy.tracking_enabled ? userPrivacy.tracking_enabled : "disabled") : "disabled";
            await db.close();
            if (!activity || activity.length <= 0) return await interaction.reply({embeds: [new EmbedBuilder().setColor(color).setDescription("No tracking data avalible for this user.")]}); //Error if no activity data.

            // Error if trying to check a private user's history.
            if (user && user.id != member.id && userPrivacy != "public") return await interaction.reply({content: "This user's activity data is private.", ephemeral: true});

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
            *   Converts a list of timestamps into a list of status colors and device statuses.
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
                    result[curTS] = [COLORS.status[rows[curRow].presence], rows[curRow].web, rows[curRow].desktop, rows[curRow].mobile];
                    curTS++;
                }
                return result;
            }

            /**
             * Generates string representations of times evenly spaced across a timestamp range.
             * @param {integer} start - The starting timestamp in milliseconds.
             * @param {integer} end - The ending timestamp in milliseconds.
             * @param {integer} count - How many values to generate.
             * @param {string} scale - The scale of the data (one of: 'minutes', 'hours', 'days').
             * @param {string} timezone - The timezone to use for formatting (e.g., 'America/New_York').
             * @return {array} - Returns a list of `count` strings representing times in the specified timezone.
             */
            function generateTimes(start, end, count, scale, timezone) {
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

                for (let i = 0; i < count; i++) {
                    const timestamp = start + i * interval;
                    const timeString = moment(timestamp).tz(timezone).format(getFormat(scale));
                    times.push(timeString);
                }

                return times;
            }

            /**
             * Returns the appropriate date/time format string based on the scale.
             * @param {string} scale - The scale of the data (one of: 'minutes', 'hours', 'days').
             * @return {string} - The moment.js format string.
             */
            function getFormat(scale) {
                switch (scale) {
                    case 'minutes':
                    case 'hours':
                        return 'hA'; // 12-hour format with AM/PM (e.g., "2PM")
                    case 'days':
                        return 'MMM D'; // Short date format (e.g., "Aug 21")
                    }
            }
            
            let twoFourHourAgo = Date.now() - (24 * 60 * 60 * 1000);
            let twoFourHourAgoAdjusted = twoFourHourAgo - (twoFourHourAgo % (60 * 60 * 1000));
            let timestamps = generateTimestamps(twoFourHourAgoAdjusted, 15);
            let colors = colorTimestamps(timestamps, activity);

            // Open connection to database.
            await db.open();
            var getTimezone = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.getTimezone), 'utf8');
            var uniAddUser = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.uniAddUser), 'utf8');
            await db.run(uniAddUser, member.id);
            var timezone = await db.get(getTimezone, member.id);
            timezone = timezone.timezone;
            await db.close();
            
            let legend = generateTimes(timestamps[0], timestamps[timestamps.length - 1], 13, "hours", timezone);

            // Construct the activity card image.
            var img = new Image.UserActivityCard(member, `24hr (${timezone})`);
            await img.init(colors, legend);
            var attachment = await img.getAttachment();

            // Reply to the interaction.
            await interaction.reply({files: [attachment], ephemeral: userPrivacy != "public"});
        }

    }
};