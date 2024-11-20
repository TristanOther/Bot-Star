/*
*   File: conversationStarter.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 08/20/2024
*
*   Command for getting or suggesting a conversation starter.
*/

// Imports
const path = require("path");
const fs = require("fs");

const CONFIG = JSON.parse(process.env.CONFIG);
const ROOT_PATH = process.env.ROOT_PATH;

const dbUtils = require(path.join(ROOT_PATH, CONFIG.utils.dbUtils));

const {ActionRowBuilder, ButtonBuilder, ButtonStyle, RoleSelectMenuBuilder, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits} = require("discord.js");

module.exports = {
    global: true,
	data: new SlashCommandBuilder()
		.setName("cstarter")
		.setDescription("Get (or suggest) a prompt to start a conversation!")
        .addStringOption(option =>
            option.setName("suggestion")
                .setDescription("Suggest a prompt!")
                .setRequired(false)),
    /*
    *   execute
    *   Executes this command.
    *   @PARAM {obj} interaction - the interaction that triggered this command.
    *   @PARAM {string} color - the color code that embeds in this command should use.
    *   @RETURN - None.
    */
    async execute(interaction, color) {
        var suggestion = interaction.options.getString("suggestion");
        if (suggestion) {
            // Open connection to database.
            const db = new dbUtils(CONFIG.files.db);
            await db.open();
            // Load SQL queries.
            var addConversationStarter = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.addConversationStarter), 'utf8');
            // Add the new cstarter to the database.
            await db.run(addConversationStarter, suggestion, interaction.user.id, interaction.user.username, Date.now());
            // Close the database connection.
            await db.close();
            // Respond success to user.
            await interaction.reply({content: "Thank you for your suggestion!", ephemeral: true});
            return;
        } else {
            // Open connection to database.
            const db = new dbUtils(CONFIG.files.db);
            await db.open();
            // Load SQL queries.
            var getConversationStarter = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.getConversationStarter), 'utf8');
            // Get a random cstarter.
            var cstarter = await db.get(getConversationStarter);
            if (!cstarter) {
                await interaction.reply({content: "There are currently no prompts available... Why not suggest one!", ephemeral: true});
                return;
            }
            // Create embed.
            let embed = new EmbedBuilder()
                .setTitle("Conversation time!")
                .setColor(color)
                .setDescription(cstarter.cstarter)
                .setFooter({text: "Is this a good prompt? Vote below!"});
            // Create upvote button.
            const upvote = new ButtonBuilder()
            .setCustomId(`conversationStarterUpvote.${cstarter.rowid}.${interaction.user.id}`)
            .setLabel('👍')
            .setStyle(ButtonStyle.Success)
            // Create downvote button.
            const downvote = new ButtonBuilder()
            .setCustomId(`conversationStarterDownvote.${cstarter.rowid}.${interaction.user.id}`)
            .setLabel('👎')
            .setStyle(ButtonStyle.Danger)
            // Create button row.
            const row = new ActionRowBuilder()
                .addComponents(upvote, downvote);
            // Reply to the interaction.
            await interaction.reply({embeds: [embed], components: [row], ephemeral: false});
            return;
        }
    }
};