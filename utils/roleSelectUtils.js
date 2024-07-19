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

const {ActionRowBuilder, ButtonBuilder, ButtonStyle, RoleSelectMenuBuilder, SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder} = require("discord.js");

/*
*   create
*   Creates a role selector.
*   @PARAM {channel} channel - the channel to create the role selector in.
*   @PARAM {array of string} roles - an array of roles to add to the selector.
*   @RETURN none.
*/
async function create(channel, roles, name, color) {
    // Open connection to database.
    const db = new dbUtils(CONFIG.files.db);
    await db.open();
    // Load SQL queries.
    var addSelector = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.addRoleSelector), 'utf8');
    // Create an embed for the role selector.
    const embed = new EmbedBuilder()
    .setAuthor({name: name})
    .setDescription(`Select roles:\n${roles.map(r => `<@&${r.id}>`).join('\n')}`);
    if (color) embed.setColor(color);
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
    // Send the selector to the channel.
    const message = await channel.send({embeds: [embed], components: [row]});
    // Add the new selector to the database.
    await db.run(addSelector, channel.guild.id, channel.id, message.id, name, color ? color : null, roles.map(r => r.id).join(","));
    // Close the database connection.
    await db.close();
    return;
}

async function edit() {
    
}

async function remove() {

}

async function list() {

}

// Export functions.
module.exports = {
    create: create,
    edit: edit,
    remove: remove,
    list: list,
};