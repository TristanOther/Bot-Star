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


module.exports = {
    global: true,
    // Create a slash command called `hex` with subcommands `random`.
	data: new SlashCommandBuilder()
		.setName("hex")
		.setDescription("Commands with hex codes!")
        .addSubcommand(subcommand =>
            subcommand
                .setName("random")
                .setDescription("Generates a randomized hex code.")
                .addStringOption(option => 
                    option
                        .setName("color")
                        .setDescription("A color to generate a random shade of. (optional)")
                        .setRequired(false)
                        .addChoices(
                            {name: "Info", value: "info"},
                            {name: "Red", value: "red"},
                            {name: "Orange", value: "orange"},
                            {name: "Yellow", value: "yellow"},
                            {name: "Green", value: "green"},
                            {name: "Blue", value: "blue"},
                            {name: "Purple", value: "purple"},
                            {name: "Pink", value: "pink"},
                            {name: "Brown", value: "brown"},
                            {name: "Grey", value: "grey"}))
        ),
    /*
    *   execute
    *   Executes this command.
    *   @PARAM {obj} interaction - the interaction that triggered this command.
    *   @PARAM {string} color - the color code that embeds in this command should use.
    *   @RETURN - None.
    */
    async execute(interaction, color) {
        if (interaction.options.getSubcommand() == "random") {
            // Retrieve the color we're generating.
            var colorType = interaction.options.getString("color");
            // Get a random color or respond with info.
            var color;
            var lightness;
            if (colorType == "info") {
                let embed = new EmbedBuilder()
                    .setTitle("Color generation info:")
                    .setColor(color)
                    .setDescription("Color generation is a complex art. So much so that it's also a science! Random colors are easy. But when it comes to generating random shades of specific colors, things get a whole lot trickier. Colors for computers are generally represented as RGB values, with a value between 0 and 255 representing the amount of Red, Green, and Blue light that a pixel should emit. Randomly generating a shade of a specific color using this system is very difficult, and that's not really what it was designed for. To make the task a bit easier we can use a system called HSL, which represents a Hue, Saturation, and Lightness (brightness) of a color. This system allows us to find the ranges that shades of a specific color fall in far easier, but need to be converted through some complicated math into an RGB value for the computer to use. With this system the color generation for this command is *pretty good*, but it's important to note it won't always be perfect. For example, did you know that the color brown doesn't actually exist? It's really just dark orange, but because our language gives it a name we can identify it as a different color (this is known as \"linguistic relativity\" if you want to learn more). So for that reason, if you ask for a random orange color and it turns out a bit too brown for your liking, try giving it another go :)");
                    await interaction.reply({embeds: [embed], ephemeral: false});
                    return;
            } else {
                color = ColorUtils.randomColor(colorType);
                lightness = color[2];
                color = ColorUtils.hslToRgb(color[0], color[1], color[2]);
            }
            // Construct a color swatch.
            var img = new ImageUtils.ColorSwatch();
            //console.log(ColorUtils.textContrastColor(color));
            await img.init(`#${color}`, (lightness < 0.6) ? "#ffffff" : "000000");
            var attachment = await img.getAttachment();
            // Construct the color embed.
            let embed = new EmbedBuilder()
                .setTitle(`Your ${colorType ? colorType : "random"} shade:`)
                .setColor(Number(`0x${color}`))
                .setDescription(`#${color}`)
            // Send the embed and swatch.
            await interaction.reply({files: [attachment], embeds: [embed], ephemeral: false});
        }
    }
};