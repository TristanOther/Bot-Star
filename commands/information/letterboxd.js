/*
*   File: letterboxd.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 01/29/2025
*
*   This command allows users to interact with the movie database/social media site Letterboxd.
*/

// Imports
const fs = require("fs");
const path = require("path");
const ROOT_PATH = process.env.ROOT_PATH;
const CONFIG = JSON.parse(process.env.CONFIG);
const dbUtils = require(path.join(ROOT_PATH, CONFIG.utils.dbUtils));
const {SlashCommandBuilder, EmbedBuilder} = require("discord.js");

const puppeteer = require('puppeteer');


module.exports = {
    global: true,
    // Create a slash command called `letterboxd` with subcommands `profile` and `watchlist`.
	data: new SlashCommandBuilder()
		.setName("letterboxd")
		.setDescription("Commands for interacting with Letterboxd.")
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup
            .setName("profile")
            .setDescription("Commands related to your Letterboxd profile.")
            .addSubcommand(subcommand =>
                subcommand
                .setName("set")
                .setDescription("Set your Letterboxd profile.")
                .addStringOption(option => 
                    option
                    .setName("username")
                    .setDescription("Your Letterboxd username.")
                    .setRequired(true)
                )
            )
        )
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup
            .setName("watchlist")
            .setDescription("Commands for interacting with your watchlist.")
            .addSubcommand(subcommand =>
                subcommand
                .setName("random")
                .setDescription("Get a random movie from your watchlist.")
            )
        ),
    /*
    *   execute
    *   Executes this command.
    *   @PARAM {obj} interaction - the interaction that triggered this command.
    *   @PARAM {string} color - the color code that embeds in this command should use.
    *   @RETURN - None.
    */
    async execute(interaction, color) {
        // Open connection to database.
        const db = new dbUtils(CONFIG.files.db);
        await db.open();
        // Profile commands.
        if (interaction.options.getSubcommandGroup() == "profile") {
            // Set your profile.
            if (interaction.options.getSubcommand() == "set") {
                var username = interaction.options.getString("username");
                // Load SQL queries.
                var uniAddUser = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.uniAddUser), 'utf8');
                var setLetterboxd = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.setLetterboxd), 'utf8');
                // Run database queries.
                await db.run(uniAddUser, interaction.user.id);
                await db.run(setLetterboxd, username, interaction.user.id);
                // Respond to interaction.
                await interaction.reply({content: `Set Letterboxd username to: \`${username}\`.`, ephemeral: true});
            }
        // Watchlist commands.
        } else if (interaction.options.getSubcommandGroup() == "watchlist") {
            // Get a random item from user's watchlist.
            if (interaction.options.getSubcommand() == "random") {
                await interaction.deferReply();
                // Load SQL queries.
                var getLetterboxd = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.getLetterboxd), 'utf8');
                // Get username.
                var username = await db.get(getLetterboxd, interaction.user.id);
                username = username.letterboxd_username;
                if (username == null) {
                    await interaction.editReply({content: "No Letterboxd username configured.", ephemeral: true});
                    await db.close();
                    return;
                }
                // Get watchlist.
                scrapeWatchlist(username).then(async movies => {
                    var randomMovie = movies[Math.floor(Math.random() * movies.length)];
                    var movieDetails = await scrapeMovieDetails(randomMovie.link);
                    var userLink = `https://letterboxd.com/${username}`;
                    var userDetails = await scrapeUserDetails(userLink);
                    const embed = new EmbedBuilder()
                    .setAuthor({name: userDetails.username, iconURL: userDetails.avatarURL, url: userLink})
                    .setColor(color)
                    .setTitle(`${randomMovie.title}${movieDetails.year != null ? ` (${movieDetails.year})` : ''}`)
                    .setURL(randomMovie.link)
                    .setThumbnail(randomMovie.poster)
                    .setDescription(movieDetails.desc)
                    .setFooter({text: `You have ${movies.length} movies on your watchlist.`});
                    await interaction.editReply({embeds: [embed]});
                }).catch(async err => {
                    await interaction.editReply({content: `Error fetching movies. Is \`${username}\` the correct username?`, ephemeral: true});
                });
            }
        }
        // Close the database connection.
        await db.close();
    }
};

/*
*   scrapeWatchlist
*   Scrapes a user's watchlist.
*   @PARAM {string} username - the user's Letterboxd username.
*   @RETURN - An array of movies from the user's watchlist.
*/
async function scrapeWatchlist(username) {
    let pageNum = 1;
    let movies = [];
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    while (true) {
        const url = `https://letterboxd.com/${username}/watchlist/page/${pageNum}/`;
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Scrape movies from current page
        const pageMovies = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.poster-container')).map(el => {
                const posterDiv = el.querySelector('.film-poster');
                const imageElement = el.querySelector('div img');
                return {
                    title: posterDiv.getAttribute('data-film-name'),
                    year: posterDiv.getAttribute('data-film-release-year'),
                    link: `https://letterboxd.com${posterDiv.getAttribute('data-film-link')}`,
                    poster: imageElement.getAttribute('src')
                };
            });
        });

        if (pageMovies.length === 0) {
            break; // Exit loop if no more movies are found
        }

        movies = movies.concat(pageMovies);

        // Check for "Next" button
        const nextButtonExists = await page.evaluate(() => {
            return !!document.querySelector('.next');
        });

        if (!nextButtonExists) {
            break; // Exit loop if there's no next page
        }

        pageNum++; // Move to the next page
    }

    await browser.close();
    return movies;
}

/*
*   scrapeMovieDetails
*   Scrapes a movie's description.
*   @PARAM {string} movieUrl - the URL of the movie to scrape.
*   @RETURN - Details about a movie in the form of an object.
*/
async function scrapeMovieDetails(movieUrl) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(movieUrl, { waitUntil: 'networkidle2' });

    // Scrape movie description
    const description = await page.evaluate(() => {
        const descriptionElement = document.querySelector('.review div p');
        const yearElement = document.querySelector(".releaseyear a");
        return {
            desc: descriptionElement ? descriptionElement.innerText : 'No description available',
            year: yearElement.innerText
        };
    });

    await browser.close();
    return description;
}

/*
*   scrapeUserDetails
*   Scrapes a movie's description.
*   @PARAM {string} userURL - the user's Letterboxd username.
*   @RETURN - An array of movies from the user's watchlist.
*/
async function scrapeUserDetails(userURL) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(userURL, { waitUntil: 'networkidle2' });

    const description = await page.evaluate(() => {
        const avatarElement = document.querySelector('.avatar img');
        const usernameElement = document.querySelector(".displayname");
        return {
            avatarURL: avatarElement.getAttribute('src'),
            username: usernameElement.innerText
        };
    });

    await browser.close();
    return description;
}