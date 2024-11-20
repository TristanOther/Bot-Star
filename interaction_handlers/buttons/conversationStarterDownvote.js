/*
*   File: conversationStarterDownvote.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 08/20/2024
*
*   Button for downvoting a conversation starter.
*/

// Imports
const path = require("path");
const fs = require("fs");

const CONFIG = JSON.parse(process.env.CONFIG);
const ROOT_PATH = process.env.ROOT_PATH;

const dbUtils = require(path.join(ROOT_PATH, CONFIG.utils.dbUtils));

module.exports = {
    component_id: "conversationStarterDownvote",
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
        // Add user to bad votes if they haven't previously voted for bad.
        if (badVotes.indexOf(userID) == -1) badVotes.push(userID);
        // Remove user from good votes if they previously voted for good.
        let goodIndex = goodVotes.indexOf(userID);
        if (goodIndex != -1) goodVotes.splice(goodIndex, 1);
        // Update votes.
        await db.run(updateVotes, goodVotes.join(','), badVotes.join(','), rowID);
        // Close the database connection.
        await db.close();
        // Respond success to user.
        await interaction.reply({content: "Thank you for voting! Your votes help us curate the best prompts!", ephemeral: true});
        return;
    }
}