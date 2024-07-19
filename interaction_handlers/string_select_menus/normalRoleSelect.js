/*
*   File: normalRoleSelect.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 07/19/2024
*
*   String select menu handler for role selectors.
*/

module.exports = {
    component_id: "normalRoleSelect",
    async execute(interaction) {
        try {
            let role = interaction.guild.roles.cache.get(interaction.values[0]);
            if (interaction.member.roles.cache.some(r => r.id == role.id)) {
                interaction.member.roles.remove(role).catch(console.error);
                await interaction.reply({content: `Role ${role} removed.`, ephemeral: true});
            } else {
                interaction.member.roles.add(role).catch(console.error);
                await interaction.reply({content: `Role ${role} added.`, ephemeral: true});
            }
        } catch (err) {
            console.log(err);
            await interaction.reply({content: `Request failed...`});
        }
    }
}