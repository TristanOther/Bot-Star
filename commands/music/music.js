/*
*   File: hex.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/16/2024
*
*   This command allows users to do fun things with hex codes.
*/

// Imports
const fs = require("fs");
const path = require("path");
const {SlashCommandBuilder, EmbedBuilder} = require("discord.js");

const ROOT_PATH = process.env.ROOT_PATH;
const CONFIG = JSON.parse(process.env.CONFIG);

const ColorUtils = require(path.join(ROOT_PATH, CONFIG.utils.colorUtils));
const ImageUtils = require(path.join(ROOT_PATH, CONFIG.utils.imageUtils));

const yts = require("youtube-search-api");


module.exports = {
    global: false,
    // Create a slash command called `hex` with subcommands `random`.
	data: new SlashCommandBuilder()
		.setName("music")
		.setDescription("Music commands.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("play")
                .setDescription("Play a URL or search for a song.")
                .addStringOption(option => 
                    option
                        .setName("song")
                        .setDescription("A song name or URL to play.")
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
        

        if (interaction.options.getSubcommand() == "play") {
            var song = interaction.options.getString("song");

            console.log(await yts.GetListByKeyword(song));

            await interaction.reply({content: song});
        }
    }
};