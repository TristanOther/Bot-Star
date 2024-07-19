/*
*   File: roleSelect.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 07/16/2024
*
*   This command allows for the creation of role selectors.
*/

// Imports
const path = require("path");

const CONFIG = JSON.parse(process.env.CONFIG);
const ROOT_PATH = process.env.ROOT_PATH;

const roleSelectUtils = require(path.join(ROOT_PATH, CONFIG.utils.roleSelectUtils));

const {ActionRowBuilder, ButtonBuilder, ButtonStyle, RoleSelectMenuBuilder, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits} = require("discord.js");

module.exports = {
    global: true,
	data: new SlashCommandBuilder()
		.setName("roleselect")
		.setDescription("Commands for role selectors.")
        .addSubcommandGroup(subcommandgroup =>
            subcommandgroup
                .setName("create")
                .setDescription("Creates a role selector.")
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("quick") // TODO: Add "quick" which is the same thing but supports multiple roles and "full" which requires channel being specified etc.
                        .setDescription("Quick and easy to drop in chat, only supports 1 role.")
                        .addRoleOption(option => 
                            option.setName("role")
                                .setDescription("The role to select.")
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName("normal")
                        .setDescription("Selector for roles.")
                        .addStringOption(option =>
                            option.setName("name")
                                .setDescription("A name for this selector.")
                                .setRequired(true))
                        .addChannelOption(option => 
                            option.setName("channel")
                                .setDescription("The channel to place this selector in (default current channel).")
                                .setRequired(false))
                        .addStringOption(option =>
                            option.setName("color")
                                .setDescription("A Hex color to use for the role select (e.g. #ffffff).")
                                .setRequired(false))
                        ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    /*
    *   execute
    *   Executes this command.
    *   @PARAM {obj} interaction - the interaction that triggered this command.
    *   @PARAM {string} color - the color code that embeds in this command should use.
    *   @RETURN - None.
    */
    async execute(interaction, color) {
        // Selector creation commands.
        if (interaction.options.getSubcommandGroup() == "create") {
            if (interaction.options.getSubcommand() == "quick") {
                var role = interaction.options.getRole("role");

                // Create an embed for the role selector.
                const embed = new EmbedBuilder()
                .setColor(color)
                .setAuthor({name: `Role Select:`})
                .setDescription(`Selector for ${role}`)

                // Create add button.
                const add = new ButtonBuilder()
                .setCustomId(`quickRoleSelectAdd.${role.id}`)
                .setLabel('Add')
                .setStyle(ButtonStyle.Success)

                // Create remove button.
                const remove = new ButtonBuilder()
                .setCustomId(`quickRoleSelectRemove.${role.id}`)
                .setLabel('Remove')
                .setStyle(ButtonStyle.Danger)

                // Create button row.
                const row = new ActionRowBuilder()
			        .addComponents(add, remove);
        
                // Reply to the interaction with the created embed.
                await interaction.reply({embeds: [embed], components: [row]});
            } else if (interaction.options.getSubcommand() == "normal") {
                var name = interaction.options.getString("name");
                name = name ? name : "Role selector:";
                var channel = interaction.options.getChannel("channel");
                channel = channel ? channel : interaction.channel;
                var setColor = interaction.options.getString("color");
                setColor = setColor ? setColor.replace('#', '') : color;
                if (setColor != color && !setColor.match(/[0-9a-fA-F]{6}/)) {
                    await interaction.reply({content: `Invalid hex color entered \`${setColor}\`. Please use the format \`#ffffff\`, or leave this option blank.`, ephemeral: true});
                    return;
                }

                const select = new RoleSelectMenuBuilder()
                    .setCustomId("test")
                    .setPlaceholder("Select roles...")
                    .setMinValues(1)
			        .setMaxValues(25);

                const row = new ActionRowBuilder()
                    .addComponents(select);
                
                const response = await interaction.reply({content: "**Choose roles to add to this role selector, then click outside the box to confirm.**", components: [row], ephemeral: true});
                
                const collectorFilter = i => i.user.id === interaction.user.id;

                try {
                    const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 600_000 });

                    var roles = confirmation.roles;

                    await roleSelectUtils.create(channel, roles, name, color);

                    await interaction.editReply({content: "**Role selector created successfully.**", components: []});
                } catch (e) {
                    console.error(e);
                    await interaction.editReply({ content: '**Confirmation not received within 10 minutes, creation cancelled.**', components: [] });
                }

                // TODO: add ordering to roles (place them by role hierarchy).
            }
        } 
    }
};