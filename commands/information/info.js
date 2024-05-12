/*
*   File: info.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/11/2024
*   Last Modified: 05/11/2024
*
*   This command allows users to check information about users and the server.
*/

const {SlashCommandBuilder, EmbedBuilder} = require("discord.js");

module.exports = {
    global: true,
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

    async execute(interaction, color) {
        if (interaction.options.getSubcommand() === "user") {
            var member = await interaction.guild.members.fetch(interaction.options.getUser("target"));
            if (!member) member = interaction.member;

            const embed = new EmbedBuilder()
                .setColor(color)
                .setAuthor({name: `Information on ${member.displayName}:`, iconURL: member.user.displayAvatarURL()})
                .addFields(
                    {name: "Display Name:", value: member.displayName, inline: true},
                    {name: "Username:", value: member.user.username, inline: true},
                    {name: "ID:", value: member.id, inline: true},

                    {name: "Account Created:", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}>`, inline: true},
                    {name: "Joined Server:", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}>`, inline: true},

                )
                .setTimestamp()
            await interaction.reply({embeds: [embed]});
        } else if (interaction.options.getSubcommand() === "server") {
            var guildOwner = await interaction.guild.fetchOwner();
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
            await interaction.reply({embeds: [embed]});
        }
    }
};