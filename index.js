/*
*   File: index.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/10/2024
*   Last Modified: 05/11/2024
*
*   This is the main entrypoint for Bot*.
*/

/*  TODO: 
*   - Linter? https://discordjs.guide/preparations/setting-up-a-linter.html#setting-up-eslint-rules
*   - Activity tracker (user opt-in)
*   - Music
*   - Autogenerated help list.
*   - Levels
*/

// Imports
const configParser = require("./utils/configParser.js");
const {Client, GatewayIntentBits, Collection, Partials, REST, Routes} = require("discord.js");
const fs = require("fs");

// Load configs.
const CONFIG = new configParser("./configs/config.cfg");
const CREDENTIALS = new configParser("./configs/credentials.cfg");

// Global variables.
const BOT_TOKEN = CREDENTIALS.get("Bot_Credentials").token;
const CLIENT_ID = CREDENTIALS.get("Bot_Credentials").id;
const COMMANDS_PATH = CONFIG.get("File_Paths").commands;
const COMMANDS_FOLDER = fs.readdirSync(COMMANDS_PATH);
const DEV_GUILD_ID = CREDENTIALS.get("Dev_Guild").id;
const EVENTS_PATH = CONFIG.get("File_Paths").events;
const EVENTS_MODULES = fs.readdirSync(EVENTS_PATH).filter(file => file.endsWith(".js"));

const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.AutoModerationConfiguration,
    GatewayIntentBits.AutoModerationExecution,
    GatewayIntentBits.GuildMessagePolls,
    GatewayIntentBits.DirectMessagePolls
],
partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

//=======================//
// Dynamic Event Handler //
//=======================//

// Automatically imports events from the configured folder.
for (const file of EVENTS_MODULES) {
	const filePath = `${EVENTS_PATH}/${file}`;
	const event = require(filePath);
    if ("execute" in event) {
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }
}

//=========================//
// Dynamic Command Handler //
//=========================//

// Collections for commands.
client.commands = new Collection();
const commands = [];
const globalCommands = [];

// Automatically imports command files from configured folder.
for (const folder of COMMANDS_FOLDER) {
	const commandPath = `${COMMANDS_PATH}/${folder}`;
	const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith(".js"));
	for (const file of commandFiles) {
		const filePath = `${COMMANDS_PATH}/${folder}/${file}`;
		const command = require(filePath);
        // If the command contains a data field and an execute function, it's a complete command.
		if ("data" in command && "execute" in command) {
			client.commands.set(command.data.name, command);
            command.data.category = folder;
            // If the command is marked as global register it to the bot globally, otherwise just in the dev server.
            if (command.global) {
                globalCommands.push(command.data.toJSON());
            } else {
                commands.push(command.data.toJSON());
            }
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Construct and prepare an instance of the REST module.
const rest = new REST().setToken(BOT_TOKEN);

(async () => {
	try {
        // Example for how to wipe commands if desired.
        /*console.log("Deleting commands from dev server.");
        rest.put(Routes.applicationGuildCommands(CLIENT_ID, DEV_GUILD_ID), { body: [] })
            .then(() => console.log("Successfully deleted all guild commands."))
            .catch(console.error);*/

		// Refresh commands in the dev guild. Uses put to fully refresh with current command set.
		const data = await rest.put(
			Routes.applicationGuildCommands(CLIENT_ID, DEV_GUILD_ID),
			{ body: commands },
		);
		console.log(`Successfully reloaded ${data.length} dev application (/) commands.`);

        // Refresh global commands. Uses put to fully refresh with current command set.
        const globalData = await rest.put(
			Routes.applicationCommands(CLIENT_ID),
			{ body: globalCommands },
		);
		console.log(`Successfully reloaded ${globalData.length} global application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();


//===========//
// Login Bot //
//===========//

client.login(BOT_TOKEN);