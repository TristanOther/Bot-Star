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
const ROOT_PATH = process.env.ROOT_PATH;
const CONFIG = JSON.parse(process.env.CONFIG);
const COLORS = JSON.parse(process.env.COLOR_CONFIG);
const dbUtils = require(path.join(ROOT_PATH, CONFIG.utils.dbUtils));
const {SlashCommandBuilder, EmbedBuilder} = require("discord.js");
const Image = require(path.join(ROOT_PATH, CONFIG.utils.image));


module.exports = {
    global: false,
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

            /*
            *   generateHexPair
            *   Function for generating a single random hex pair.
            *   @PARAM {integer} min - the minimum value of the hex pair (default = 0).
            *   @PARAM {integer} max - the maximum value of the hex pair (default = 255).
            *   @RETURN {string} - returns a single 2-digit hex value.
            */
            function generateHexPair(min = 0, max = 255) {
                // Ensure we don't go out of bounds.
                min = Math.max(0, min);
                max = Math.min(255, max);
                // Generate a random integer between 0 and 255 and convert it to a hexadecimal string
                var randomValue = Math.floor(Math.random() * (max - min + 1) + min).toString(16);

                // If the generated value is a single digit, prepend a '0' to make it a two-digit hex value
                if (randomValue.length === 1) {
                    randomValue = "0" + randomValue;
                }

                return randomValue;
            }

            function decToHex(num) {
                num = num.toString(16);
                if (num.length == 1) {
                    num = "0" + num;
                }
                return num;
            }

            function randNumRounded(min, max) {
                max += 1; // Make it inclusive of the max.
                return Math.floor(Math.random() * (max - min) + min);
            }

            function randNum(min, max) {
                return Math.random() * (max - min) + min;
            }

            function print(x, y) {
                console.log(`${x}: ${y}`);
            }

            // https://www.baeldung.com/cs/convert-color-hsl-rgb
            function hslToRgb(h, s, l) {
                const chroma = (1 - Math.abs((2 * l) - 1)) * s;
                const hPrime = h / 60;
                const x = chroma * (1 - Math.abs((hPrime % 2) - 1));
                const m = l - (chroma / 2);

                var rgb;

                if (0 <= hPrime && hPrime <= 1) {
                    rgb = [chroma, x, 0];
                } else if (1 <= hPrime && hPrime <= 2) {
                    rgb = [x, chroma, 0];
                } else if (2 <= hPrime && hPrime <= 3) {
                    rgb = [0, chroma, x];
                } else if (3 <= hPrime && hPrime <= 4) {
                    rgb = [0, x, chroma];
                } else if (4 <= hPrime && hPrime <= 5) {
                    rgb = [x, 0, chroma];
                } else if (5 <= hPrime && hPrime <= 6) {
                    rgb = [chroma, 0, x];
                }

                rgb[0] = Math.floor((rgb[0] + m) * 255);
                rgb[1] = Math.floor((rgb[1] + m) * 255);
                rgb[2] = Math.floor((rgb[2] + m) * 255);

                return `${decToHex(rgb[0])}${decToHex(rgb[1])}${decToHex(rgb[2])}`;
            }

            
            var color;
            var h, s, l;
            if (colorType == "info") {
                let embed = new EmbedBuilder()
                    .setTitle("Color generation info:")
                    .setColor(color)
                    .setDescription("Color generation is a complex art. So much so that it's also a science! Random colors are easy. But when it comes to generating random shades of specific colors, things get a whole lot trickier. Colors for computers are generally represented as RGB values, with a value between 0 and 255 representing the amount of Red, Green, and Blue light that a pixel should emit. Randomly generating a shade of a specific color using this system is very difficult, and that's not really what it was designed for. To make the task a bit easier we can use a system called HSL, which represents a Hue, Saturation, and Lightness (brightness) of a color. This system allows us to find the ranges that shades of a specific color fall in far easier, but need to be converted through some complicated math into an RGB value for the computer to use. With this system the color generation for this command is *pretty good*, but it's important to note it won't always be perfect. For example, did you know that the color brown doesn't actually exist? It's really just dark orange, but because our language gives it a name we can identify it as a different color (this is known as \"linguistic relativity\" if you want to learn more). So for that reason, if you ask for a random orange color and it turns out a bit too brown for your liking, try giving it another go :)");
                    await interaction.reply({embeds: [embed], ephemeral: false});
                    return;
            } else if (colorType == "red") {
                /*
                *   Hue       : 0 - 10, 350 - 360
                *   Saturation: 0.2 - 1
                *   Lightness : 0.05 - 0.6
                */
               h = randNumRounded(0, 20);
               h = (h > 10) ? (h + 340) : h;
               s = randNum(0.2, 1);
               l = randNum(0.05, 0.6);
               color = hslToRgb(h, s, l);
            } else if (colorType == "orange") {
                /*
                *   Hue       : 11 - 37
                *   Saturation: 0.25 - 1
                *   Lightness : 0.3 - 0.9
                */
                h = randNumRounded(11, 37);
                s = randNum(0.25, 1);
                l = randNum(0.3, 0.9);
                color = hslToRgb(h, s, l);
            } else if (colorType == "yellow") {
                /*
                *   Hue       : 38 - 64
                *   Saturation: 0.4 - 1
                *   Lightness : 0.3 - 0.9
                */
                h = randNumRounded(38, 64);
                s = randNum(0.4, 1);
                l = randNum(0.3, 0.9);
                color = hslToRgb(h, s, l);
            } else if (colorType == "green") {
                /*
                *   Hue       : 65 - 170
                *   Saturation: 0.1 - 1
                *   Lightness : 0.04 - 0.9
                */
                h = randNumRounded(65, 170);
                s = randNum(0.1, 1);
                l = randNum(0.04, 0.9);
                color = hslToRgb(h, s, l);
            } else if (colorType == "blue") {
                /*
                *   Hue       : 171 - 255
                *   Saturation: 0.1 - 1
                *   Lightness : 0.04 - 0.95
                */
                h = randNumRounded(171, 255);
                s = randNum(0.1, 1);
                l = randNum(0.04, 0.95);
                color = hslToRgb(h, s, l);
            } else if (colorType == "purple") {
                /*
                *   Hue       : 256 - 276
                *   Saturation: 0.15 - 1
                *   Lightness : 0.04 - 0.95
                */
                h = randNumRounded(256, 276);
                s = randNum(0.15, 1);
                l = randNum(0.04, 0.95);
                color = hslToRgb(h, s, l);
            } else if (colorType == "pink") {
                /*
                *   Hue       : 0 - 10, 331 - 360 | 277 - 330
                *   Saturation: 0.2 - 1           | 0.15 - 1
                *   Lightness : 0.8 - 0.9         | 0.12 - 0.9
                */
                // Pick the red-range pinks vs the magenta range. 1/5 chance because there's more magenta range than red range pinks.
                let odds = randNumRounded(0, 100);
                if (odds < 20) {
                    h = randNumRounded(0, 39);
                    h = (h > 10) ? (h + 321) : h;
                    s = randNum(0.2, 1);
                    l = randNum(0.8, 0.9);
                    color = hslToRgb(h, s, l);
                } else {
                    h = randNumRounded(277, 330);
                    s = randNum(0.15, 1);
                    l = randNum(0.12, 0.95);
                    color = hslToRgb(h, s, l);
                }                
            } else if (colorType == "brown") {
                /*
                *   Hue       : 11 - 37
                *   Saturation: 0.25 - 1
                *   Lightness : 0.03 - 0.25
                */
                h = randNumRounded(11, 37);
                s = randNum(0.25, 1);
                l = randNum(0.03, 0.25);
                color = hslToRgb(h, s, l);
            } else if (colorType == "grey") {
                /*
                *   Hue       : 0 - 360
                *   Saturation: 0 - 0.05
                *   Lightness : 0 - 1
                */
                h = randNumRounded(0, 360);
                s = randNum(0, 0.05);
                l = randNum(0, 1);
                color = hslToRgb(h, s, l);
            } else {
                color = `${generateHexPair()}${generateHexPair()}${generateHexPair()}`;
            }

            // Construct a color swatch.
            var img = new Image.ColorSwatch();
            await img.init(`#${color}`, ((l <= 0.6) ? "#ffffff" : "#000000"));
            var attachment = await img.getAttachment();

            let embed = new EmbedBuilder()
                .setTitle(`Your ${colorType ? colorType : "random"} shade:`)
                .setColor(Number(`0x${color}`))
                .setDescription(`#${color}`)
                //.setImage(attachment);
            await interaction.reply({files: [attachment], embeds: [embed], ephemeral: false});
        }
    }
};