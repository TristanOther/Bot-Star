/*
*   File: info.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/11/2024
*
*   This command allows users to check information about users and the server.
*/

// Imports
const {SlashCommandBuilder, EmbedBuilder} = require("discord.js");

module.exports = {
    global: true,
    // Create a slash command called `info` with subcommands `user` and `server`.
    // - `user` subcommand allows for an optional target user.
	data: new SlashCommandBuilder()
		.setName("info")
		.setDescription("Get info about a user or server.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("user")
                .setDescription("Info about a user.")
                .addUserOption(option => 
                    option.setName("target")
                        .setDescription("The user.")
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName("server")
                .setDescription("Info about the server.")),
    
    /*
    *   execute
    *   Executes this command.
    *   @PARAM {obj} interaction - the interaction that triggered this command.
    *   @PARAM {string} color - the color code that embeds in this command should use.
    *   @RETURN - None.
    */
    async execute(interaction, color) {
        // Userinfo subcommand.
        if (interaction.options.getSubcommand() === "user") {
            // Get the targeted guildMember, otherwise use the sender if noone was specified.
            var user = interaction.options.getUser("target");
            var member = user ? await interaction.guild.members.fetch(user) : interaction.member;

            // Create an embed containing information about the member.
            const embed = new EmbedBuilder()
                .setColor(color)
                .setAuthor({name: `Information on ${member.displayName}:`, iconURL: member.user.displayAvatarURL()})
                .addFields(
                    {name: "Display Name:", value: member.displayName, inline: true},
                    {name: "Username:", value: member.user.username, inline: true},
                    {name: "ID:", value: member.id, inline: true},

                    {name: "Account Created:", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}>`, inline: true},
                    {name: "Joined Server:", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}>`, inline: true},
                    {name: "Bot?", value: member.user.bot ? "Yes" : "No", inline: true}
                )
                .setTimestamp()
            
            // Reply to the interaction with the created embed.
            await interaction.reply({embeds: [embed]});

        // Serverinfo subcommand.
        } else if (interaction.options.getSubcommand() === "server") {
            // Get the owner of the guild.
            var guildOwner = await interaction.guild.fetchOwner();

            // Create an embed containing information about the server.
            const embed = new EmbedBuilder()
                .setColor(color)
                .setAuthor({name: `Information on ${interaction.guild.name}:`, iconURL: interaction.guild.iconURL()})
                .addFields(
                    {name: "Server Name:", value: interaction.guild.name, inline: true},
                    {name: "Abbreviation:", value: interaction.guild.nameAcronym, inline: true},
                    {name: "ID:", value: interaction.guild.id, inline: true},

                    {name: "Member Count:", value: String(interaction.guild.members.cache.filter(member => !member.user.bot).size), inline: true},
                    {name: "Bot Count:", value: String(interaction.guild.members.cache.filter(member => member.user.bot).size), inline: true},
                    {name: "Channel Count:", value: String(interaction.guild.channels.cache.size), inline: true},

                    {name: "NSFW Level:", value: String(interaction.guild.nsfwLevel), inline: true},
                    {name: "Partnered?", value: String(interaction.guild.partnered), inline: true},
                    {name: "Verified?", value: String(interaction.guild.verified), inline: true},

                    {name: "Server Created:", value: `<t:${Math.floor(interaction.guild.createdTimestamp / 1000)}>`, inline: true},
                    {name: "Server Description:", value: interaction.guild.description ? interaction.guild.description : "N/A", inline: true},
                    {name: "Rules Channel:", value: interaction.guild.rulesChannel ? interaction.guild.rulesChannel : "N/A", inline: true},

                    {name: "Owner Nickname:", value: guildOwner.displayName, inline: true},
                    {name: "Owner Username:", value: guildOwner.user.username, inline: true},
                    {name: "Owner ID:", value: String(guildOwner.id), inline: true},
                )
                .setTimestamp()

            // Reply to the interaction with the created embed.
            await interaction.reply({embeds: [embed]});
        }
    }
};