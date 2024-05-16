/*
*   File: counter.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/15/2024
*
*   This command allows users to create counters to display in the server (think membercount).
*/

// Imports
const fs = require("fs");
const path = require("path");
const ROOT_PATH = process.env.ROOT_PATH;
const CONFIG = JSON.parse(process.env.CONFIG);
const dbUtils = require(path.join(ROOT_PATH, CONFIG.utils.dbUtils));
const counterUtils = require(path.join(ROOT_PATH, CONFIG.utils.counterUtils));
const {SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits} = require("discord.js");

module.exports = {
    global: true,
    // Create a slash command called `counter` with subcommands `create` and `delete`.
	data: new SlashCommandBuilder()
		.setName("counter")
		.setDescription("Counter commands.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("add")
                .setDescription("Add a new counter.")
                .addStringOption(option => 
                    option
                        .setName("type")
                        .setDescription("The type of counter.")
                        .setRequired(true)
                        .addChoices(
                            {name: "Members only", value: "members"},
                            {name: "Bots only", value: "bots"},
                            {name: "Everyone", value: "all"}
                ))
                .addChannelOption(option => 
                    option.setName("type")
                        .setName("channel")
                        .setDescription("The channel to display the counter.")
                        .setRequired(true)
        ))
        .addSubcommand(subcommand =>
            subcommand
                .setName("update")
                .setDescription("Update an existing counter.")
                .addStringOption(option => 
                    option
                        .setName("type")
                        .setDescription("The type of counter to update.")
                        .setRequired(true)
                        .addChoices(
                            {name: "Members only", value: "members"},
                            {name: "Bots only", value: "bots"},
                            {name: "Everyone", value: "all"}
                ))
                .addChannelOption(option => 
                    option.setName("type")
                        .setName("channel")
                        .setDescription("The new channel to display the counter.")
                        .setRequired(true)
        ))
        .addSubcommand(subcommand =>
            subcommand
                .setName("delete")
                .setDescription("Delete an existing counter.")
                .addStringOption(option => 
                    option
                        .setName("type")
                        .setDescription("The type of counter to delete.")
                        .setRequired(true)
                        .addChoices(
                            {name: "Members only", value: "members"},
                            {name: "Bots only", value: "bots"},
                            {name: "Everyone", value: "all"}
                ))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("list")
                .setDescription("Lists active counters in this server.")
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    
    /*
    *   execute
    *   Executes this command.
    *   @PARAM {obj} interaction - the interaction that triggered this command.
    *   @PARAM {string} color - the color code that embeds in this command should use.
    *   @RETURN - None.
    */
    async execute(interaction, color) {
        // Add counter subcommand.
        if (interaction.options.getSubcommand() == "add") {
            // Get command arguments.
            var counterType = interaction.options.getString("type");
            var channel = interaction.options.getChannel("channel");
            // Open connection to database.
            const db = new dbUtils(CONFIG.files.db);
            await db.open();
            // Load SQL queries.
            var addCounter = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.addCounter), 'utf8');
            var getCounter = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.getCounter), 'utf8');
            // Check if this counter type is already configured for the server.
            var existingCounters = await db.get(getCounter, interaction.guild.id, counterType);
            if (existingCounters) {
                await interaction.reply({content: `There already exists a counter for \`${counterType}\` in this server. You can update it instead.`, ephemeral: false});
                return;
            }
            // Add the new counter to the database.
            await db.run(addCounter, interaction.guild.id, channel.id, counterType);
            // Add the new counter to the active counters collection.
            if (!interaction.client.counters[counterType]) interaction.client.counters[counterType] = [];
            interaction.client.counters[counterType].push({"guild": interaction.guild.id, "channel": channel.id});
            // Close the database connection.
            await db.close();
            // Perform the initial update on the new counter.
            var oldName = channel.name;
            await counterUtils.updateCounter(interaction.guild, channel, counterType);
            // Create and send embed confirming creation.
            const embed = new EmbedBuilder()
                .setTitle('COUNTER CREATED')
                .setColor(color)
                .setDescription(`\`${counterType.slice(0, 1).toUpperCase()}${counterType.slice(1)}\` counter has been added to the channel \`${oldName}\` and it has been renamed to \`${channel.name}\`.`);
            await interaction.reply({embeds: [embed], emphemeral: false});
        // Update counter subcommand.
        } else if (interaction.options.getSubcommand() == "update") {
            // Get command arguments.
            var counterType = interaction.options.getString("type");
            var channel = interaction.options.getChannel("channel");
            // Open connection to database.
            const db = new dbUtils(CONFIG.files.db);
            await db.open();
            // Load SQL queries.
            var getCounter = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.getCounter), 'utf8');
            var updateCounter = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.updateCounter), 'utf8');
            // Check if the specified counter type exists.
            var existingCounter = await db.get(getCounter, interaction.guild.id, counterType);
            if (!existingCounter) {
                await interaction.reply({content: `There is no existing \`${counterType}\` counter in this server. You can add it instead.`, ephemeral: false});
                return;
            }
            // Update the counter in the DB.
            await db.run(updateCounter, channel.id, interaction.guild.id, counterType);
            // Close the database connection.
            await db.close();
            // Update the counter in the active counter collection.
            interaction.client.counters[counterType].find(counter => counter.guild == interaction.guild.id).channel = channel.id;
            // Get the old channel and save it's current name.
            var oldChannel = interaction.guild.channels.cache.find(c => c.id == existingCounter.channel_id);
            var oldChannelOldName = oldChannel.name;
            // Save the new channel's name.
            var newChannelOldName = channel.name;
            // Swap the counter channels.
            await counterUtils.swapChannel(interaction.guild, oldChannel, channel, counterType);
            // Create and send embed confirming update.
            const embed = new EmbedBuilder()
                .setTitle('COUNTER UPDATED')
                .setColor(color)
                .setDescription(`\`${counterType.slice(0, 1).toUpperCase()}${counterType.slice(1)}\` counter has been swapped from the channel \`${oldChannelOldName}\` (renamed \`${oldChannel.name}\`) to the channel \`${newChannelOldName}\` (renamed \`${channel.name}\`).`);
            await interaction.reply({embeds: [embed], emphemeral: false});
        // Delete counter subcommand.
        } else if (interaction.options.getSubcommand() == "delete") {
            // Get command arguments.
            var counterType = interaction.options.getString("type");
            // Open connection to database.
            const db = new dbUtils(CONFIG.files.db);
            await db.open();
            // Load SQL queries.
            var getCounter = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.getCounter), 'utf8');
            var removeCounter = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.removeCounter), 'utf8');
            // Check if the specified counter type exists.
            var existingCounter = await db.get(getCounter, interaction.guild.id, counterType);
            if (!existingCounter) {
                await interaction.reply({content: `There is no existing \`${counterType}\` counter in this server.`, ephemeral: false});
                return;
            }
            // Remove the counter from the DB.
            db.run(removeCounter, interaction.guild.id, counterType);
            // Remove the counter from the active counter collection.
            var counterIndex = interaction.client.counters[counterType].findIndex(counter => counter.guild == interaction.guild.id);
            interaction.client.counters[counterType].splice(counterIndex, 1);
            // Remove the counter from the channel name.
            var channel = interaction.guild.channels.cache.find(c => c.id == existingCounter.channel_id);
            var oldName = channel.name;
            await interaction.guild.channels.edit(channel.id, {name: counterUtils.removeCounter(oldName)});
            // Create and send embed confirming deletion.
            const embed = new EmbedBuilder()
                .setTitle('COUNTER REMOVED')
                .setColor(color)
                .setDescription(`\`${counterType.slice(0, 1).toUpperCase()}${counterType.slice(1)}\` counter has been removed from the channel \`${oldName}\` and the channel has been reverted to \`${channel.name}\`.`);
            await interaction.reply({embeds: [embed], emphemeral: false});
        // List counters subcommand.
        } else if (interaction.options.getSubcommand() == "list") {
            // Open connection to database.
            const db = new dbUtils(CONFIG.files.db);
            await db.open();
            // Load SQL queries.
            var getCounters = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.getCounters), 'utf8');
            // Get counters for this server.
            var counters = await db.all(getCounters, interaction.guild.id);
            var formattedCounters = [];
            counters.forEach(counter => {
                var channel = interaction.guild.channels.cache.find(c => c.id == counter.channel_id);
                formattedCounters.push(`${counter.counter_type} --- #${channel.name}`);
            });
            // Create and send embed showing list of counters.
            const embed = new EmbedBuilder()
                .setTitle('COUNTER LIST')
                .setColor(color)
                .setDescription(`\`\`\`${formattedCounters.join("\n")}\`\`\``);
            await interaction.reply({embeds: [embed], emphemeral: false});
        }
    }
};