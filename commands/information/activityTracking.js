/*
*   File: activityTracking.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/12/2024
*   Last Modified: 05/14/2024
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

module.exports = {
    global: false,
    // Create a slash command called `activitytracking` with subcommands `enable` and `disable`.
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

        // Load SQL queries.
        var getUserQuery = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.getUser), 'utf8');
        var toggleTrackingQuery = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.setUserTracking), 'utf8');
        var addTrackingQuery = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.insertUser), 'utf8');

        // Get this user from database.
        var user = await db.get(getUserQuery, interaction.user.id);

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
    }
};