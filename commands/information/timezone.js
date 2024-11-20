/*
*   File: timezone.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 08/21/2024
*
*   This command allows users to configure their timezone.
*/

// Imports
const path = require("path");
const fs = require("fs");

const CONFIG = JSON.parse(process.env.CONFIG);
const ROOT_PATH = process.env.ROOT_PATH;

const dbUtils = require(path.join(ROOT_PATH, CONFIG.utils.dbUtils));

const {ActionRowBuilder, ButtonBuilder, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits} = require("discord.js");
const moment = require('moment-timezone');

// Get timezone regions and subregions.
function getTimezoneRegionsAndSubregions() {
    const timezones = moment.tz.names(); // Get all timezone names
    const regions = {};
    
    timezones.forEach((timezone) => {
        const [region, subregion] = timezone.split('/');
        
        if (!regions[region]) {
        regions[region] = [];
        }
        
        regions[region].push(subregion);
    });
    
    return regions;
}
const regionsAndSubregions = getTimezoneRegionsAndSubregions();
const regionsAndSubregionsCondensed = Object.keys(regionsAndSubregions)
                                          .filter(key => regionsAndSubregions[key].length > 0 && regionsAndSubregions[key][0] != undefined)
                                          .reduce((res, key) => (res[key] = regionsAndSubregions[key], res), {});
const nonSubRegions = Object.keys(regionsAndSubregions)
                            .filter(key => regionsAndSubregions[key].length == 1 && regionsAndSubregions[key][0] == undefined);
regionsAndSubregionsCondensed["Other"] = nonSubRegions;

module.exports = {
    global: true,
	data: new SlashCommandBuilder()
		.setName("timezone")
		.setDescription("Configure your timezone for features that depend on time.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("set")
                .setDescription("Set your timezone.")
                .addStringOption(option => 
                    option
                        .setName("region")
                        .setDescription("Your timezone region.")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option => 
                    option
                        .setName("subregion")
                        .setDescription("The subregion of your timezone.")
                        .setRequired(true)
                        .setAutocomplete(true)
                ))
        .addSubcommand(subcommand =>
            subcommand
                .setName("check")
                .setDescription("Check your configured timezone."))
        .addSubcommand(subcommand =>
            subcommand
                .setName("help")
                .setDescription("Learn how to set your timezone.")),

    /*
    *   autocomplete
    *   Handles input autocomplete for this command.
    *   @PARAM {obj} interaction - the interaction that triggered autocomplete.
    *   @RETURN - None.
    */
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        var filteredChoices;

        if (focusedOption.name == "region") {
            const regions = Object.keys(regionsAndSubregions);
            filteredChoices = regions.filter(region =>
                region.toLowerCase().startsWith(focusedOption.value.toLowerCase())
            );
        } else if (focusedOption.name == "subregion") {
            const region = interaction.options.getString("region");
            if (!region || !regionsAndSubregions[region]) return await interaction.respond({name: "Please select a valid region from the list.", value: "invalid"}).catch(() => {});
            filteredChoices = regionsAndSubregions[region].filter(subregion =>
                subregion.toLowerCase().startsWith(focusedOption.value.toLowerCase())
            );
        }
        const choices = filteredChoices.map(choice => {return {name: choice, value: choice}});
        await interaction.respond(choices.slice(0, 25)).catch((err) => {console.error(err)});
    },
    
    /*
    *   execute
    *   Executes this command.
    *   @PARAM {obj} interaction - the interaction that triggered this command.
    *   @PARAM {string} color - the color code that embeds in this command should use.
    *   @RETURN - None.
    */
    async execute(interaction, color) {
        // Open connection to database.
        const db = new dbUtils(CONFIG.files.db);
        await db.open();
        // Load SQL queries.
        var uniAddUser = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.uniAddUser), 'utf8');
        var setTimezone = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.setTimezone), 'utf8');
        var getTimezone = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.getTimezone), 'utf8');
        // Set timezone command.
        if (interaction.options.getSubcommand() == "set") {
            const targetRegion = interaction.options.getString("region");
            const targetSubregion = interaction.options.getString("subregion");
            if (regionsAndSubregions[targetRegion] && regionsAndSubregions[targetRegion].includes(targetSubregion)) {
                await db.run(uniAddUser, interaction.user.id);
                await db.run(setTimezone, `${targetRegion}/${targetSubregion}`, interaction.user.id);
                interaction.reply({content: `Your timezone has been set to \`${targetRegion}/${targetSubregion}\`.`, ephemeral: true});
            } else {
                interaction.reply({content: "Timezone not found, please select a region and subregion from the autocomplete options. For a list of timezone options, check out the `help` subcommand.", ephemeral: true});
            }
        // Get timezone command.
        } else if (interaction.options.getSubcommand() == "check") {
            var timezone = await db.get(getTimezone, interaction.user.id);
            if (!timezone || !timezone.timezone) {
                await interaction.reply({content: "No timezone configured.", ephemeral: true});
            } else {
                await interaction.reply({content: `Your timezone is set to \`${timezone.timezone}\`.`, ephemeral: true});
            }
        // Get help (options list).
        } else if (interaction.options.getSubcommand() == "help") {
            console.log(Object.keys(regionsAndSubregions).length);
            console.log(Object.keys(regionsAndSubregionsCondensed).length);

            // Build embed.
            var embed = new EmbedBuilder()
                .setTitle("Timezone Help:")
                .setColor(color)
                .setDescription("In order to set your timezone using the `set` command, select a region from the list of options, then select a sub-region. A list of sub-regions can be found below. When entering regions ensure you select an autocomplete option, do not enter a custom field.");
                Object.keys(regionsAndSubregionsCondensed).forEach(region => {
                    let subregions = regionsAndSubregionsCondensed[region];
                    let body = subregions.join(", ");
                    if (body.length < 1000) {
                        embed.addFields(
                            {name: region, value: body}
                        );
                    } else {
                        let numParts = body.length / 1000;
                        let sizePart = Math.ceil(subregions.length / numParts);
                        for (let i = 0; i < numParts; i++) {
                            embed.addFields(
                                {name: `${region}${i > 0 ? " (cont.)" : ''}`, value: subregions.slice(i*sizePart, i*sizePart+sizePart).join(", ")}
                            );
                        }
                    }
                });

            return await interaction.reply({embeds: [embed], ephemeral: true});
        }
        // Close the database connection.
        await db.close();
    }
};