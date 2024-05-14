/*
*   File: index.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/10/2024
*   Last Modified: 05/14/2024
*
*   This is the main entrypoint for Bot*.
*/

// Imports
const configParser = require("./utils/configParser.js");
const {Client, GatewayIntentBits, Collection, Partials, REST, Routes} = require("discord.js");
const fs = require("fs");
const path = require("path");
// Global variable representing the local path so we have it for the rest of initialization.
const ROOT_PATH = path.resolve(__dirname);
process.env.ROOT_PATH = ROOT_PATH;

// Load configs.
const CONFIG = configParser.read("./configs/config.cfg");
process.env.CONFIG = JSON.stringify(CONFIG);
const CREDENTIALS = configParser.read(path.join(ROOT_PATH, CONFIG.configs.credentials));

// Global variables.
const BOT_TOKEN = CREDENTIALS.credentials.token;
const CLIENT_ID = CREDENTIALS.credentials.id;
const COMMANDS_PATH = CONFIG.folders.commands;
const COMMANDS_FOLDER = fs.readdirSync(COMMANDS_PATH);
const DEV_GUILD_ID = CREDENTIALS.devGuild.id;
const EVENTS_PATH = CONFIG.folders.events;
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

/*
*   Dynamic event handler.
*   This code automatically imports event modules stored in the configured folder,
*   allowing events to be added by simply dropping a new module into the folder.
*/
// Loop through every file in the configured folder for event modules.
for (const file of EVENTS_MODULES) {
    // Get the absolute path of this file.
	const filePath = path.join(ROOT_PATH, EVENTS_PATH, file);
	const event = require(filePath);
    // If the file has an execute function, add it to watched events.
    if ("execute" in event) {
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }
}

/*
*   Dynamic command handler.
*   This code automatically imports and registers command modules stored in the configured
*   folder, allowing commands to be added by dropping a new module into that folder.
*/
// Add a collection to the client for storing commands (used to access commands from interactions).
client.commands = new Collection();
// Arrays for storing commands we'll be registering globally and in the dev server.
const commands = [];
const globalCommands = [];

// Look through every folder in the configured folder for command modules (organization matters!)
for (const folder of COMMANDS_FOLDER) {
    // Get the absolute path of this folder.
    const folderPath = path.join(ROOT_PATH, COMMANDS_PATH, folder);
    const filesPath = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));
    // Look through each file in each subfolder.
	for (const file of filesPath) {
        // Get the absolute path of this file.
		const filePath = path.join(folderPath, file);
		const command = require(filePath);
        // If the command contains a data field and an execute function, it's a complete command module.
		if ("data" in command && "execute" in command) {
            // Dynamically give this command a category based on the folder it's stored in.
            command.data.category = folder;
            // Add this command to the client's collection of commands.
			client.commands.set(command.data.name, command);
            // If the command is marked as global add it to the array of global commands, otherwise the dev array.
            if (command.global) {
                globalCommands.push(command.data.toJSON());
            } else {
                commands.push(command.data.toJSON());
            }
        // Log error if we encounter a module in the commands folder that doesn't have the proper fields to be a command.
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Construct and prepare an instance of the REST module.
const rest = new REST().setToken(BOT_TOKEN);

// Register the loaded slash (/) commands with the Discord API so they show up in the client.
(async () => {
	try {
        // Example code for wiping commands by registering an empty array.
        /*
        console.log("Deleting commands from dev server.");
        rest.put(Routes.applicationGuildCommands(CLIENT_ID, DEV_GUILD_ID), { body: [] })
            .then(() => console.log("Successfully deleted all guild commands."))
            .catch(console.error);
        */

		// Refresh commands in the dev guild. Uses put to fully refresh with current command set.
		const data = await rest.put(
			Routes.applicationGuildCommands(CLIENT_ID, DEV_GUILD_ID),
			{ body: commands },
		);
		console.log(`Successfully reloaded ${commands.length}/${data.length} dev application (/) commands.`);

        // Refresh global commands. Uses put to fully refresh with current command set.
        const globalData = await rest.put(
			Routes.applicationCommands(CLIENT_ID),
			{ body: globalCommands },
		);
		console.log(`Successfully reloaded ${globalCommands.length}/${globalData.length} global application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();

/*
*   Connect the bot to the Discord API.
*   This line is always so lonely down here at the bottom of the file. I'll just use this
*   opportunity to say hi to anyone reading this. I hope you're having a good day :)
*/
client.login(BOT_TOKEN);