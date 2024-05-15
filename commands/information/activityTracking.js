/*
*   File: activityTracking.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/12/2024
*   Last Modified: 05/15/2024
*
*   This command allows users to enable/disable activity tracking for themselves.
*/

// Imports
const fs = require("fs");
const path = require("path");
const ROOT_PATH = process.env.ROOT_PATH;
const CONFIG = JSON.parse(process.env.CONFIG);
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
            
            //Functions
            //Returns the input UNIX timestamp rounded up to the nearest whole minute.
            function getTimestampMin(timestamp) {
                return (Math.floor(timestamp / 60000) + 1) * 60000;
            }
        
            //Returns the input UNIX timestamp rounded down to the nearest whole minute.
            function getTimestampHour(timestamp) {
                return Math.floor(timestamp / 3600000) * 3600000;
            }
        
            //Returns an array of UNIX timestamps for the last N hours to the present time.
            function getLastNHours(n) {
                var hours = [];
                for (i=(3600000*n);i>=3600000;i-=3600000) {
                hours.push(getTimestampHour(Date.now() - i));
                }
                return hours;
            }
        
            //Returns a string representing the discord emoji alias that we want for each status.
            function presenceFormat(presence) {
                if (presence == 'online') return ':green_square:';
                if (presence == 'idle') return ':yellow_square:';
                if (presence == 'dnd') return ':red_square:';
                return ':black_large_square:'
            }

            // Query activity data for the specified user for the past 24 hours.
            var activity = await db.all(getActivityQuery, member.id);
            await db.close();
            if (!activity || activity.length <= 0) return await interaction.reply({embeds: [new EmbedBuilder().setColor(color).setDescription("No tracking data avalible for this user.")]}); //Error if no activity data.
            var statuses = {};
            //Loop throgh every found activity log for the user.
            for (i = 0; i < activity.length; i++) {
                //Get minute rounded timestamp of this log entry.
                let minute = getTimestampMin(activity[i].timestamp);
                //Get minute rounded timestamp of next log entry.
                var finalMin;
                if (activity.length > i + 1) {
                    finalMin = activity[i + 1].timestamp;
                } else {
                    finalMin = getTimestampMin(Date.now());
                }
                //while loop to clone status of this log entry to every minute before that log entry in local statuses cache.
                while (minute < finalMin) {
                    statuses[minute] = {presence: activity[i].presence, status: activity[i].status, devices: [activity[i].mobile, activity[i].desktop, activity[i].web]};
                    minute += 60000;
                }
            }

            // Reply to interaction.
            var hourlyStatuses = {};
            var statusKeys = Object.keys(statuses).sort();
            var hours = getLastNHours(24);
            var hourIndex = 0;
            var curHour = hours[0];
            var nextHour = hours[1];
            //Seperate statuses cache by hour for the last 24 hours.
            for (i=0;i<statusKeys.length;i++) {
                if (statusKeys[i] < curHour) continue;
                if (statusKeys[i] >= nextHour) {
                    hourIndex++;
                    curHour = hours[hourIndex];
                    nextHour = hours[hourIndex+1];
                }
                if (!hourlyStatuses[curHour]) hourlyStatuses[curHour] = [];
                hourlyStatuses[curHour].push(statuses[statusKeys[i]]);
            }

            //Average an hour's status.
            var averagedHourlyStatuses = {};
            var hourKeys = Object.keys(hourlyStatuses).sort();
            for (i=0;i<hourKeys.length;i++) {
                let onlineTally=0,awayTally=0,dndTally=0,offlineTally=0;
                hourlyStatuses[hourKeys[i]].forEach(status => {
                    if (status.presence == 'online') onlineTally++;
                    if (status.presence == 'idle') awayTally++;
                    if (status.presence == 'dnd') dndTally++;
                    if (status.presence == 'offline') offlineTally++;
                });
                let averagePresence;
                let maxTally = Math.max(onlineTally, awayTally, dndTally, offlineTally);
                if (offlineTally == maxTally) averagePresence = 'offline';
                if (dndTally == maxTally) averagePresence = 'dnd';
                if (awayTally == maxTally) averagePresence = 'idle';
                if (onlineTally == maxTally) averagePresence = 'online';
                averagedHourlyStatuses[hourKeys[i]] = {hourString: new dayjs(parseInt(hourKeys[i])).format('h a'), presence: averagePresence};
            }

            //Convert the averaged hourly statuses to a string to use as the displayed field.
            var content = '';
            Object.values(averagedHourlyStatuses).forEach(hour => {
                content += `${presenceFormat(hour.presence)} - ${hour.hourString}\n`;
            });

            //Make averagedHourlyStatuses into this:
            /*
                1pm: :green_circle:
                2pm: :yellow_circle:
                ...
            */

            /*const applyText = (canvas, text) => {
                const context = canvas.getContext('2d');
                let fontSize = 70;
            
                do {
                    context.font = `${fontSize -= 10}px sans-serif`;
                } while (context.measureText(text).width > canvas.width - 300);
            
                return context.font;
            };

            // Create the canvas and get the drawing context.
            const canvas = Canvas.createCanvas(800, 300);
            const context = canvas.getContext('2d');
            // Create the background.
            context.fillStyle = "#29292e";
            context.fillRect(0, 0, 800, 300);
            // Add an outline to the background.
            context.strokeStyle = "#202020";
            context.lineWidth = 20;
            context.strokeRect(0, 0, 800, 300);
            // Attach the user's profile picture.
            // Load the PFP.
            const pfp = await Canvas.loadImage(member.user.displayAvatarURL());
            // Create a circle around the PFP.
            context.save();
            context.beginPath();
            context.arc((pfp.width / 2) + 20, (pfp.height / 2) + 20, (pfp.width / 2), 0, Math.PI * 2, true);
            context.closePath();
            context.clip();
            // Draw the constrained PFP.
            context.drawImage(pfp, 20, 20, pfp.width, pfp.height);
            context.restore();
            // Draw activity circle around the user.
            var color;
            if (member.presence) {
                switch(member.presence.status) {
                    case "online":
                        color = "#0c9439";
                        break;
                    case "idle":
                        color = "#d1b31f";
                        break;
                    case "dnd":
                        color = "#c4281a";
                        break;
                    default:
                        color = null;
                        break;
                }
                if (color != null) {
                    context.lineWidth = 5;
                    context.strokeStyle = color;
                    context.beginPath();
                    context.arc((pfp.width / 2) + 20, (pfp.height / 2) + 20, (pfp.width / 2) + 2.5, 0, Math.PI * 2, true);
                    context.stroke();
                }
            }
            // Attach username text.
            context.font = '28px sans-serif';
            context.fillStyle = '#ffffff';
            context.fillText("User Activity (24hr):", pfp.width + 40, 40);
            context.font = applyText(canvas, `${interaction.member.displayName}`);
            context.fillStyle = '#ffffff';
            context.fillText(`${interaction.member.displayName}!`, pfp.width + 40, 100);
            // Create the image attachment.
            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'profile-image.png' });
            var img = new Image.UserCard(member, "Activity Log (24hr)");
            await img.init();
            var attachment = await img.getAttachment();*/

            //Construct and reply to interaction with embed.
            var embed = new EmbedBuilder()
            .setTitle('Activity in the past 24hr:')
            .setAuthor({name: member.user.tag, iconURL: member.user.displayAvatarURL()})
            .setColor(color)
            .addFields(
                {name: `Presence (ET):`, value: content, inline: true},
            );
            await interaction.reply({/*(embeds: [embed],*/ files: [attachment], emphemeral: false});
        }

    }
};