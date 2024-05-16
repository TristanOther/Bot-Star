/*
*   File: pokemon.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/14/2024
*
*   This command allows a user to lookup pokemon.
*/

// Imports
const {SlashCommandBuilder, EmbedBuilder} = require("discord.js");
//const {getPokemon} = require("pkmonjs")
const fs = require("fs");

module.exports = {
    global: true,
    // Create a slash command called `pokemon`.
	data: new SlashCommandBuilder()
		.setName("pokemon")
		.setDescription("Looks up a Pokemon.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("id")
                .setDescription("Lookup a Pokemon by Pokedex ID.")
                .addIntegerOption(option =>
                    option
                        .setName("id")
                        .setDescription("The Pokedex ID of a Pokemon.")
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName("name")
                .setDescription("Lookup a Pokemon by name.")
                .addStringOption(option =>
                    option
                        .setName("name")
                        .setDescription("The name of a Pokemon.")
                        .setRequired(true))),
    
    /*
    *   execute
    *   Executes this command.
    *   @PARAM {obj} interaction - the interaction that triggered this command.
    *   @PARAM {string} color - the color code that embeds in this command should use.
    *   @RETURN - None.
    */
    async execute(interaction, color) {
        // Manually load the database file because the package is being a POS.
        var pokedex = JSON.parse(fs.readFileSync("./pokedex.json", "utf8"));

        var pokemon;
        // If an ID lookup:
        if (interaction.options.getSubcommand() == "id") {
            var id = interaction.options.getInteger("id");
            //pokemon = await getPokemon(id);
            pokemon = pokedex.filter(p => p.idPokedex == id);
        // If a name lookup:
        } else if (interaction.options.getSubcommand() == "name") {
            var name = interaction.options.getString("name");
            //pokemon = await getPokemon(name);
            pokemon = pokedex.filter(p => p.name == name);
        }
        
        // If the pokemon wasn't found, reject.
        if (pokemon.length == 0) {
            await interaction.reply({content: "Pokemon not found.", ephemeral: true});
            return;
        } else {
            pokemon = pokemon[0];
        }

        // Create an embed from the retrieved pokemon info.
        var fixedName = pokemon.name.slice(0, 1).toUpperCase() + pokemon.name.slice(1);
        var fixedColor = pokemon.color.name.slice(0, 1).toUpperCase() + pokemon.color.name.slice(1);
        const embed = new EmbedBuilder()
            .setColor(color)
            .setAuthor({name: `Information on ${fixedName}:`, iconURL: pokemon.image.default})
            .addFields(
                {name: "Name:", value: fixedName, inline: true},
                {name: "Pokedex ID:", value: String(pokemon.idPokedex), inline: true},
                {name: "Generation:", value: pokemon.generation.name, inline: true},

                {name: "HP:", value: String(pokemon.stats.hp), inline: true},
                {name: "Attack:", value: String(pokemon.stats.attack), inline: true},
                {name: "Defense:", value: String(pokemon.stats.defense), inline: true},

                {name: "Speed:", value: String(pokemon.stats.speed), inline: true},
                {name: "S Attack:", value: String(pokemon.stats.specialAttack), inline: true},
                {name: "S Defense:", value: String(pokemon.stats.specialDefense), inline: true},

                {name: "Height:", value: String(pokemon.stats.height), inline: true},
                {name: "Weight:", value: String(pokemon.stats.weight), inline: true},
                {name: "Color:", value: fixedColor, inline: true},

                {name: pokemon.stats.types.name.size > 1 ? "Types:" : "Type:", value: Object.values(pokemon.stats.types.name).join(", "), inline: true},
                {name: "Description:", value: pokemon.description, inline: true},
            )
            .setImage(pokemon.image.default)
            .setTimestamp()

        // Reply to the interaction with the created embed.
        await interaction.reply({embeds: [embed]});
    }
};