/*
*   File: activityTracking.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/12/2024
*   Last Modified: 05/12/2024
*
*   This command allows users to enable/disable activity tracking for themselves.
*/

const configParser = require("../../utils/configParser.js");
const CONFIG = new configParser("./configs/config.cfg");
const dbUtils = require("../../utils/dbUtils.js");
const {SlashCommandBuilder, EmbedBuilder} = require("discord.js");
const fs = require("fs");

module.exports = {
    global: false,
	data: new SlashCommandBuilder()
		.setName("activitytracking")
		.setDescription("Enable/disable activity tracking for yourself. (Disabled by default.)")
        .addSubcommand(subcommand =>
            subcommand
                .setName("enable")
                .setDescription("Enable activity tracking for your account."))
        .addSubcommand(subcommand =>
            subcommand
                .setName("disable")
                .setDescription("Disable activity tracking for yourself.")),

    async execute(interaction, color) {
        // Open connection to database.
        const db = new dbUtils(CONFIG.get("File_Paths").db);
        await db.open();

        // Load SQL queries.
        var getUserQuery = fs.readFileSync('./queries/get_user.sql', 'utf8');
        var toggleTrackingQuery = fs.readFileSync('./queries/toggle_user_tracking.sql', 'utf8');
        var enableTrackingQuery = fs.readFileSync('./queries/enable_user_tracking.sql', 'utf8');

        // Get this user from database.
        var user = await db.get(getUserQuery, interaction.user.id);

        // Enable tracking subcommand.
        if (interaction.options.getSubcommand() === "enable") {
            if (user) {
                await db.run(toggleTrackingQuery, 1, interaction.user.id);
                await db.close();
            } else {
                await db.run(enableTrackingQuery, interaction.user.id, 1);
                await db.close();
            }
            // Send reply message.
            const embed = new EmbedBuilder()
                .setColor(color)
                .setAuthor({name: `Tracking enabled for ${interaction.member.displayName}.`, iconURL: interaction.user.displayAvatarURL()})
                .setDescription("Tracking is disabled by default, and may be disabled at any time by the user. This bot does not track users who have not manually enabled tracking themselves. We make no guarantees about data collected when a user has enabled tracking for themselves, that data may be retained for an indefinite period, but no further data will be collected if the user disables tracking.")
                .setTimestamp()
            await interaction.reply({embeds: [embed]});
        // Disable tracking subcommand.
        } else if (interaction.options.getSubcommand() === "disable") {
            if (user) {
                await db.run(toggleTrackingQuery, 0, interaction.user.id);
                await db.close();
            } else {
                await db.close();
            }
            // Send reply message.
            const embed = new EmbedBuilder()
                .setColor(color)
                .setAuthor({name: `Tracking disabled for ${interaction.member.displayName}.`, iconURL: interaction.user.displayAvatarURL()})
                .setDescription("Tracking is disabled by default, and may be disabled at any time by the user. This bot does not track users who have not manually enabled tracking themselves. We make no guarantees about data collected when a user has enabled tracking for themselves, that data may be retained for an indefinite period, but no further data will be collected if the user disables tracking.")
                .setTimestamp()
            await interaction.reply({embeds: [embed]});
        }


        return;

        // Get user from the database.
        db.get(getUserQuery, [interaction.user.id], async function(rows, err) {
            if (err) return console.log(err);
            // Enable tracking subcommand.
            if (interaction.options.getSubcommand() === "enable") {
                // If user is already in DB, enable  tracking.
                if (rows) {
                    db.run(toggleTrackingQuery, [1, interaction.user.id], function(err) {
                        if (err) console.error(err);
                        // Close DB.
                        db.close((err) => {
                            if (err) return console.log(err);
                        });
                    });
                // If user is not already in DB, add them and enable tracking.
                } else {
                    db.run(enableTrackingQuery, [interaction.user.id, 1], function(err) {
                        if (err) console.error(err);
                        // Close DB.
                        db.close((err) => {
                            if (err) return console.log(err);
                        });
                    });
                }
                // Send reply message.
                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setAuthor({name: `Tracking enabled for ${interaction.member.displayName}.`, iconURL: interaction.user.displayAvatarURL()})
                    .setDescription("Tracking is disabled by default, and may be disabled at any time by the user. This bot does not track users who have not manually enabled tracking themselves. We make no guarantees about data collected when a user has enabled tracking for themselves, that data may be retained for an indefinite period, but no further data will be collected if the user disables tracking.")
                    .setTimestamp()
                await interaction.reply({embeds: [embed]});
            // Disable tracking subcommand.
            } else if (interaction.options.getSubcommand() === "disable") {
                // If user is already in DB, disable tracking.
                if (rows) {
                    db.run(toggleTrackingQuery, [0, interaction.user.id], function(err) {
                        if (err) console.error(err);
                        // Close DB.
                        db.close((err) => {
                            if (err) return console.log(err);
                        });
                    });
                // Don't do anything if user is not in DB, because no need to add an entry for someone when tracking is disabled by default.
                } else {
                    // Close DB.
                    db.close((err) => {
                        if (err) return console.log(err);
                    });
                }
                // Send reply message.
                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setAuthor({name: `Tracking disabled for ${interaction.member.displayName}.`, iconURL: interaction.user.displayAvatarURL()})
                    .setDescription("Tracking is disabled by default, and may be disabled at any time by the user. This bot does not track users who have not manually enabled tracking themselves. We make no guarantees about data collected when a user has enabled tracking for themselves, that data may be retained for an indefinite period, but no further data will be collected if the user disables tracking.")
                    .setTimestamp()
                await interaction.reply({embeds: [embed]});
            }
        });
    }
};