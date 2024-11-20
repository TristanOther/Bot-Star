/*
*   File: roleSelectUtil.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 07/19/2024
*
*   Util modules for creating and modifying role selectors.
*/

// Imports
const fs = require("fs");
const path = require("path");

const CONFIG = JSON.parse(process.env.CONFIG);
const ROOT_PATH = process.env.ROOT_PATH;

const dbUtils = require(path.join(ROOT_PATH, CONFIG.utils.dbUtils));
const colorUtils = require(path.join(ROOT_PATH, CONFIG.utils.colorUtils));
const imageUtils = require(path.join(ROOT_PATH, CONFIG.utils.imageUtils));

const {ActionRowBuilder, ButtonBuilder, ButtonStyle, RoleSelectMenuBuilder, SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder} = require("discord.js");


/*
*   buildSelector
*   Builds a role selector message (for creating or updating a role selector).
*   @PARAM {string} title - the title of the role selector.
*   @PARAM {string} description - the description of the role selector.
*   @PARAM {string} footer - the footer of the role selector.
*   @PARAM {obj} roles - the object of roles to select with this selector.
*   @PARAM {string} color - a hex code for the embed color.
*   @RETURN none.
*/
async function buildSelector(title, description, footer, roles, color) {
    /*// Create an embed for the role selector.
    const embed = new EmbedBuilder()
    .setAuthor({name: title});
    let rolesFormatted = roles.reverse().map(r => `<@&${r.id}>`).join('\n');
    if (description) rolesFormatted = `${description}\n${rolesFormatted}`;
    embed.setDescription(rolesFormatted);
    if (color) embed.setColor(color);
    if (footer) embed.setFooter({text: footer});*/


    rolesInfo = roles.map(r => ({name: r.name, color: colorUtils.decToHex2D(Number(r.color))}));
    console.log(rolesInfo);

    // Construct the role selector image.
    var img = new imageUtils.RoleSelector(title, description, footer, `#${color}`, rolesInfo);
    await img.init();
    var attachment = await img.getAttachment();

    // Create a select menu for the role selector.
    const select = new StringSelectMenuBuilder()
        .setCustomId("normalRoleSelect")
        .setPlaceholder("Select a role...");
    roles.forEach(role => {
        select.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(role.name)
                .setValue(role.id)
        );
    });
    const row = new ActionRowBuilder()
		.addComponents(select);
    // Return completed message.
    return {files: [attachment], components: [row]};
}

/*
*   create
*   Creates a role selector.
*   @PARAM {channel} channel - the channel to create the role selector in.
*   @PARAM {array of string} roles - an array of roles to add to the selector.
*   ...
*   @RETURN none.
*/
async function create(channel, roles, name, description, footer, color) {
    // Open connection to database.
    const db = new dbUtils(CONFIG.files.db);
    await db.open();
    // Load SQL queries.
    var addSelector = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.addRoleSelector), 'utf8');
    // Send the selector to the channel.
    var selector = await buildSelector(name, description, footer, roles, color);
    const message = await channel.send(selector);
    // Add the new selector to the database.
    await db.run(addSelector, channel.guild.id, channel.id, message.id, name, description, footer, color ? color : null, roles.map(r => r.id).join(","));
    // Close the database connection.
    await db.close();
    return;
}

async function edit() {
    // what field would you like to edit?

    // edit that field

    // save and update
}

async function remove() {

}

async function list() {

}

async function refresh(guild, selectorID) {
    // Open connection to database.
    const db = new dbUtils(CONFIG.files.db);
    await db.open();
    // Load SQL queries.
    var getSelector = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.getRoleSelector), 'utf8');
    // Fetch the selector.
    var selectorData = await db.get(getSelector, selectorID);
    if (!selectorData) throw new Error(`No role selector found with the specified ID: ${selectorID}.`);
    if (selectorData.guild_id != guild.id) throw new Error(`Specified role selector ID (${selectorID}) is not in the same guild as the interaction. (${selectorData.guild_id} vs ${guild.id})`);
    // Find the channel and selector message.
    var channel = await guild.channels.cache.find(c => c.id == selectorData.channel_id);
    if (!channel) throw new Error(`Could not find channel for specified role selector ID (${selectorID}).`);
    var message = await channel.messages.fetch(selectorData.message_id);
    if (!message) throw new Error(`Could not find message for specified role selector ID (${selectorID}).`);
    // Get the actual roles.
    roles = [];
    await selectorData.roles.split(',').forEach(async roleID => {
        roles.push(await guild.roles.fetch(roleID));
    });
    // Update the selector.
    var selector = await buildSelector(selectorData.name, selectorData.description, selectorData.footer, roles, colorUtils.decToHex2D(Number(selectorData.color)));
    await message.edit(selector);
    // Close the database connection.
    await db.close();
    return;
}

// Export functions.
module.exports = {
    create: create,
    edit: edit,
    remove: remove,
    list: list,
    refresh,
};