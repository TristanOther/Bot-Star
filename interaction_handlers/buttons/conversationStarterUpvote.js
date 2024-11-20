/*
*   File: conversationStarterUpvote.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 08/20/2024
*
*   Button for upvoting a conversation starter.
*/

// Imports
const path = require("path");
const fs = require("fs");

const CONFIG = JSON.parse(process.env.CONFIG);
const ROOT_PATH = process.env.ROOT_PATH;

const dbUtils = require(path.join(ROOT_PATH, CONFIG.utils.dbUtils));

module.exports = {
    component_id: "conversationStarterUpvote",
    async execute(interaction, args) {
        var rowID = args[0];
        var userID = args[1];
        // Open a new DB connection.
        const db = new dbUtils(CONFIG.files.db);
        await db.open();
        // Load SQL queries.
        var getVotes = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.getConversationStarterVotes), 'utf8');
        var updateVotes = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.updateConversationStarterVotes), 'utf8');
        // Get votes.
        var votes = await db.get(getVotes, rowID);
        if (!votes || !votes.rowid) return await interaction.reply({content: "This prompt has been removed.", ephemeral: true});
        var goodVotes = votes.good_votes ? votes.good_votes.split(',') : [];
        var badVotes = votes.bad_votes ? votes.bad_votes.split(',') : [];
        // Add user to good votes if they haven't previously voted for good.
        if (goodVotes.indexOf(userID) == -1) goodVotes.push(userID);
        // Remove user from bad votes if they previously voted for bad.
        let badIndex = badVotes.indexOf(userID);
        if (badIndex != -1) badVotes.splice(badIndex, 1);
        // Update votes.
        await db.run(updateVotes, goodVotes.join(','), badVotes.join(','), rowID);
        // Close the database connection.
        await db.close();
        // Respond success to user.
        await interaction.reply({content: "Thank you for voting! Your votes help us curate the best prompts!", ephemeral: true});
        return;
    }
}