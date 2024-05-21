# Bot-Star
Bot* is an all-purpose Discord bot. I add random features people ask for or I things I just feel like programming, so there may not be much of a consistent theme.

This bot is free to use, licensed under the GNU v3 license (see license file).

You may download the code and host your own instance of this bot, as well as modify it as you see fit according to the license rules. Instructions for how to setup the bot and create the files not included in this repo (e.g. credentials file) can be found at the bottom of this page.
## TODO
A TODO list for this project is included in the README both so people can see upcoming features and so I have a nicely formatted list to work off of.

#### Features
- Dynamic help menu. (/help)
- Command info command. (/help \<command>)
- Privacy command. (/privacy)
- Suggestion command. (/suggest \<suggestion>)
- Bugreport command. (/bugreport \<description>)
- Autoresponder.
- Levels.
- Music.
- Ping.

#### Activity Tracker
- Change all measurements to be relative/dynamic.
- Possibly scale up image 2x.
- Ensure any time a device is active within a timestamp that it is marked for that device.
- Modify coloring to account for percent of time range that an activity takes up (might fix).
- Add custom time range to history command.
- Add user setting for what style of chart the user wants data as, a bar displaying activity over time or a pie chart showing percentages of time (low priority).
- Add user setting for activity history privacy. Currently on/off is the setting, but change it to off/private/public. Off = no data saved or viewable, private = only you can check your own history and the response is ephemeral, public = anyone can check your history.
- Add user setting for setting timezone (whoever runs the command will have *their* timezone shown, and it will say what timezone it's in).
- Debounce presenceUpdate event (low priority).
- Do an even more custom image management system to make images more precise? (extremely low priority)

#### Code
- Cleanup code in `*`.
- Add try/catch to all await calls (particularly ones I don't control). Had some issues with channel editing calls simply terminating a command even when they didn't error. *-rolls eyes with malintent-*
- Cleanup code in `hex.js`.
- Cleanup code in `image.js`.
- Cleanup code in `activityTracker.js`.


## How can I host my own instance of Bot*?
These instructions are geared towards novice users. If you're familiar with Discord bots written in Node you can just do step 2 to create the missing files and populate them yourself. (Also note dev mode in step 4.)

### Step 0 - Prerequisites.
You'll need to install NodeJS to use this bot https://nodejs.org/en. I currently have v18.13.0 installed, but I recommend downloading the latest LTS (long term support) version.

Some packages are required to run the bot, but they'll be automatically installed when you go to run the bot the first time.

### Step 1 - Download the code.
You can download the code as a ZIP file by clicking the green `<> code` dropdown at the top right of this page and clicking `Download ZIP`.

Alternatively, if you have GIT installed you can grab the repo from the command line using `git clone git@github.com:TristanOther/Bot-Star.git`.

### Step 2 - Create missing files.
Create the following files:
- `bot_star.db` in the main folder. You don't need to put anything in this file, the bot will set it up for you.
- `credentials.cfg` in the `config` folder. Paste the following into this file:
```
# Bot credentials.
[credentials]
token = 
id = 

# Developer guild information.
[devGuild]
id = 
```

### Step 3 - Create a Discord bot.
Navigate to https://discord.com/developers/applications.
- Click the `New Application` at the top right.
- Enter a name and create the application.
- From the `General Information` tab copy your `APPLICATION ID`. Place this in your `credentials.cfg` file as `id`.
- Next click the `Bot` tab on the left. Click `Reset Token`, and a new token will be generated for your bot. You can **only see this once**. If you lose it you'll need to reset the token to get a new one. (This isn't a problem, but you'll have to update the config again with the new token.) Copy this token and put it in your `credentials.cfg` file as `token`.

### Step 4 - Dev mode.
By default, the bot is set to dev mode. What does this do? When using slash commands, your app has to register the commands with Discord so they show up in the app. This can be done globally (for all servers the bot is in), or for a single server. Global registration is slow, it can take up to an hour for commands to show up, and sometimes requires restarting your Discord client to see new commands. Registering commands in a single server on the other hand is effectively instant, and often used for development. The dev mode switch in Bot* enables development commands, but you have to pick a server ID for them to appear in as your "dev server". You have the following two (three) options:
- Disable dev mode. In `config.cfg` in the `configs` folder, set `enabled = 0` under the `dev` category.
- Configure a development server by filling in the `id` field of the `devGuild` category in your `credentials.cfg`. 
    - To get a server's ID you must have developer mode enabled in Discord.
        - Go into settings in your Discord client.
        - Select the `Advanced` tab on the sidebar.
        - Enabled the `Developer Mode` switch.
    - You can now copy a server's ID by right clicking the server icon on Desktop/Web and clicking `Copy ID`, or clicking the server name on Mobile and scrolling down to `Copy ID`.
- Secret option 3: Modify the code! You can change how dev mode works if you like.

### Step 5 - Start your engines!
To start the bot, simply navigate using terminal into the directory you saved the bot to and run `node index.js`.

You can also create a more elegant startup script if you feel like it or want to host it on some sort of automated box. I may add one myself at some point, but the bot is currently in heavy development.
