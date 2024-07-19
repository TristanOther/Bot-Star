/*
*   File: quickRoleSelectRemove.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 07/18/2024
*
*   Button for adding the role from a quick-select role selector.
*/

module.exports = {
    component_id: "quickRoleSelectRemove",
    async execute(interaction, args) {
        try {
            let role = interaction.guild.roles.cache.get(args[0]);
            interaction.member.roles.remove(role).catch(console.error);
            await interaction.reply({content: `Role ${role} removed.`, ephemeral: true});
        } catch (err) {
            console.log(err);
            await interaction.reply({content: `Request failed...`});
        }
    }
}