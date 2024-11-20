/*
*   File: ticTacToe.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 08/20/2024
*
*   Play tic-tac-toe.
*/

// Imports
const path = require("path");
const fs = require("fs");

const CONFIG = JSON.parse(process.env.CONFIG);
const ROOT_PATH = process.env.ROOT_PATH;

const dbUtils = require(path.join(ROOT_PATH, CONFIG.utils.dbUtils));

const {ActionRowBuilder, ButtonBuilder, ButtonStyle, RoleSelectMenuBuilder, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits} = require("discord.js");
const { time } = require("console");

async function saveWinner(challengerID, challengedID, firstPlayerID, gameState) {
    const gs = gameState.map(r => r.join(',')).join('|');
    // Open connection to database.
    const db = new dbUtils(CONFIG.files.db);
    await db.open();
    // Load SQL queries.
    var addTTT = fs.readFileSync(path.join(ROOT_PATH, CONFIG.queries.addTTT), 'utf8');
    // Add the new cstarter to the database.
    await db.run(addTTT, challengerID, challengedID, firstPlayerID, gs);
    // Close the database connection.
    await db.close();
}

module.exports = {
    global: true,
	data: new SlashCommandBuilder()
		.setName("tictactoe")
		.setDescription("Play tic-tac-toe!")
        .addUserOption(option =>
            option.setName("opponent")
                .setDescription("Challenge a user!")
                .setRequired(true)),
    /*
    *   execute
    *   Executes this command.
    *   @PARAM {obj} interaction - the interaction that triggered this command.
    *   @PARAM {string} color - the color code that embeds in this command should use.
    *   @RETURN - None.
    */
    async execute(interaction, color) {
        var opponent = interaction.options.getUser("opponent");
        if (interaction.user.id == opponent.id) {
            interaction.reply({content: "You can't play with yourself silly. In public? How scandalous!", ephemeral: true});
            return;
        }
        // Create accept button.
        const accept = new ButtonBuilder()
            .setCustomId(`nonConstantState.ticTacToeAccept.expectedUser.${opponent.id}`)
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success);
        // Create reject button.
        const reject = new ButtonBuilder()
            .setCustomId(`nonConstantState.ticTacToeReject.expectedUser.${opponent.id}`)
            .setLabel('Reject')
            .setStyle(ButtonStyle.Danger);
        // Create button row.
        var row = new ActionRowBuilder()
            .addComponents(accept, reject);
        // Issue the challenge.
        let response = await interaction.reply({content: `**${opponent}, you have been challenged to mortal combat by ${interaction.user}. Respond within 2 minutes, or face the consequences.**`, components: [row], ephemeral: false});
        // Await response.
        const collectorFilter = i => i.user.id == opponent.id;
        try {
            const confirmation = await response.awaitMessageComponent({filter: collectorFilter, time: 120_000});
            if (confirmation.customId == `nonConstantState.ticTacToeReject.expectedUser.${opponent.id}`) {
                confirmation.update({content: `It appears ${opponent} is a chicken and refuses to fight! Challenge rejected.`, components: [], ephemeral: false});
                return;
            } else if (confirmation.customId == `nonConstantState.ticTacToeAccept.expectedUser.${opponent.id}`) {
                // Gamestate and row variables.
                gameState = [['-', '-', '-'], ['-', '-', '-'], ['-', '-', '-']];
                players = [interaction.user, opponent];
                currentPlays = 0;
                currentTurn = Math.floor(Math.random() * 2);
                symbols = [currentTurn === 1 ? 'O' : 'X', currentTurn === 1 ? 'X' : 'O']
                firstPlayer = currentTurn;
                var row1, row2, row3;
                // Function for updating the rows.
                function updateBoard(win = [], gameOver = false) {
                    var button00 = new ButtonBuilder()
                        .setCustomId(`nonConstantState.ticTacToe.0.0.expectedUser.${players[currentTurn].id}`)
                        .setLabel(gameState[0][0])
                        .setStyle(win.includes("00") ? ButtonStyle.Success : (gameState[0][0] == '-' ? ButtonStyle.Primary : ButtonStyle.Secondary))
                        .setDisabled(gameState[0][0] != '-' || gameOver);
                    var button01 = new ButtonBuilder()
                        .setCustomId(`nonConstantState.ticTacToe.0.1.expectedUser.${players[currentTurn].id}`)
                        .setLabel(gameState[0][1])
                        .setStyle(win.includes("01") ? ButtonStyle.Success : (gameState[0][1] == '-' ? ButtonStyle.Primary : ButtonStyle.Secondary))
                        .setDisabled(gameState[0][1] != '-' || gameOver);
                    var button02 = new ButtonBuilder()
                        .setCustomId(`nonConstantState.ticTacToe.0.2.expectedUser.${players[currentTurn].id}`)
                        .setLabel(gameState[0][2])
                        .setStyle(win.includes("02") ? ButtonStyle.Success : (gameState[0][2] == '-' ? ButtonStyle.Primary : ButtonStyle.Secondary))
                        .setDisabled(gameState[0][2] != '-' || gameOver);
                    var button10 = new ButtonBuilder()
                        .setCustomId(`nonConstantState.ticTacToe.1.0.expectedUser.${players[currentTurn].id}`)
                        .setLabel(gameState[1][0])
                        .setStyle(win.includes("10") ? ButtonStyle.Success : (gameState[1][0] == '-' ? ButtonStyle.Primary : ButtonStyle.Secondary))
                        .setDisabled(gameState[1][0] != '-' || gameOver);
                    var button11 = new ButtonBuilder()
                        .setCustomId(`nonConstantState.ticTacToe.1.1.expectedUser.${players[currentTurn].id}`)
                        .setLabel(gameState[1][1])
                        .setStyle(win.includes("11") ? ButtonStyle.Success : (gameState[1][1] == '-' ? ButtonStyle.Primary : ButtonStyle.Secondary))
                        .setDisabled(gameState[1][1] != '-' || gameOver);
                    var button12 = new ButtonBuilder()
                        .setCustomId(`nonConstantState.ticTacToe.1.2.expectedUser.${players[currentTurn].id}`)
                        .setLabel(gameState[1][2])
                        .setStyle(win.includes("12") ? ButtonStyle.Success : (gameState[1][2] == '-' ? ButtonStyle.Primary : ButtonStyle.Secondary))
                        .setDisabled(gameState[1][2] != '-' || gameOver);
                    var button20 = new ButtonBuilder()
                        .setCustomId(`nonConstantState.ticTacToe.2.0.expectedUser.${players[currentTurn].id}`)
                        .setLabel(gameState[2][0])
                        .setStyle(win.includes("20") ? ButtonStyle.Success : (gameState[2][0] == '-' ? ButtonStyle.Primary : ButtonStyle.Secondary))
                        .setDisabled(gameState[2][0] != '-' || gameOver);
                    var button21 = new ButtonBuilder()
                        .setCustomId(`nonConstantState.ticTacToe.2.1.expectedUser.${players[currentTurn].id}`)
                        .setLabel(gameState[2][1])
                        .setStyle(win.includes("21") ? ButtonStyle.Success : (gameState[2][1] == '-' ? ButtonStyle.Primary : ButtonStyle.Secondary))
                        .setDisabled(gameState[2][1] != '-' || gameOver);
                    var button22 = new ButtonBuilder()
                        .setCustomId(`nonConstantState.ticTacToe.2.2.expectedUser.${players[currentTurn].id}`)
                        .setLabel(gameState[2][2])
                        .setStyle(win.includes("22") ? ButtonStyle.Success : (gameState[2][2] == '-' ? ButtonStyle.Primary : ButtonStyle.Secondary))
                        .setDisabled(gameState[2][2] != '-' || gameOver);
                    row1 = new ActionRowBuilder()
                        .addComponents(button00, button01, button02);
                    row2 = new ActionRowBuilder()
                        .addComponents(button10, button11, button12);
                    row3 = new ActionRowBuilder()
                        .addComponents(button20, button21, button22);
                }
                // Function checking win condition.
                function gameOver() {
                    return ((gameState[0][0] == gameState[0][1]) && (gameState[0][1] == gameState[0][2]) && (gameState[0][0] != '-')) ||
                           ((gameState[1][0] == gameState[1][1]) && (gameState[1][1] == gameState[1][2]) && (gameState[1][0] != '-')) ||
                           ((gameState[2][0] == gameState[2][1]) && (gameState[2][1] == gameState[2][2]) && (gameState[2][0] != '-')) ||
                           ((gameState[0][0] == gameState[1][0]) && (gameState[1][0] == gameState[2][0]) && (gameState[0][0] != '-')) ||
                           ((gameState[0][1] == gameState[1][1]) && (gameState[1][1] == gameState[2][1]) && (gameState[0][1] != '-')) ||
                           ((gameState[0][2] == gameState[1][2]) && (gameState[1][2] == gameState[2][2]) && (gameState[0][2] != '-')) ||
                           ((gameState[0][0] == gameState[1][1]) && (gameState[1][1] == gameState[2][2]) && (gameState[0][0] != '-')) ||
                           ((gameState[0][2] == gameState[1][1]) && (gameState[1][1] == gameState[2][0]) && (gameState[0][2] != '-')) ||
                           currentPlays == 9;
                }
                // Function updating the board based on where the win occurred, and returning winner text.
                function getWinner() {
                    var winningChar;
                    if ((gameState[0][0] == gameState[0][1]) && (gameState[0][1] == gameState[0][2]) && (gameState[0][0] != '-')) {
                        updateBoard(["00", "01", "02"], true);
                        winningChar = gameState[0, 0];
                    } else if ((gameState[1][0] == gameState[1][1]) && (gameState[1][1] == gameState[1][2]) && (gameState[1][0] != '-')) {
                        updateBoard(["10", "11", "12"], true);
                        winningChar = gameState[1, 0];
                    } else if ((gameState[2][0] == gameState[2][1]) && (gameState[2][1] == gameState[2][2]) && (gameState[2][0] != '-')) {
                        updateBoard(["20", "21", "22"], true);
                        winningChar = gameState[2, 0];
                    } else if ((gameState[0][0] == gameState[1][0]) && (gameState[1][0] == gameState[2][0]) && (gameState[0][0] != '-')) {
                        updateBoard(["00", "10", "20"], true);
                        winningChar = gameState[0, 0];
                    } else if ((gameState[0][1] == gameState[1][1]) && (gameState[1][1] == gameState[2][1]) && (gameState[0][1] != '-')) {
                        updateBoard(["01", "11", "21"], true);
                        winningChar = gameState[0, 1];
                    } else if ((gameState[0][2] == gameState[1][2]) && (gameState[1][2] == gameState[2][2]) && (gameState[0][2] != '-')) {
                        updateBoard(["02", "12", "22"], true);
                        winningChar = gameState[0, 2];
                    } else if ((gameState[0][0] == gameState[1][1]) && (gameState[1][1] == gameState[2][2]) && (gameState[0][0] != '-')) {
                        updateBoard(["00", "11", "22"], true);
                        winningChar = gameState[0, 0];
                    } else if ((gameState[0][2] == gameState[1][1]) && (gameState[1][1] == gameState[2][0]) && (gameState[0][2] != '-')) {
                        updateBoard(["02", "11", "20"], true);
                        winningChar = gameState[0, 2];
                    } else {
                        updateBoard();
                        return "'twas a draw!"
                    }
                    return `${players[winningChar == 'X' ? (firstPlayer === 1 ? 0 : 1) : firstPlayer]} reigns victorious!`;
                }
                // Set the initial board.
                updateBoard();
                await confirmation.update({content: `**${interaction.user}, ${opponent} has accepted your challenge. ${players[currentTurn]} shall go first. You have 30 seconds to make your move.**`, components: [row1, row2, row3]});
                while(!gameOver()) {
                    // Await response.
                    const collectorFilter = i => i.user.id == players[currentTurn].id;
                    try {
                        const confirmation = await response.awaitMessageComponent({filter: collectorFilter, time: 30_000});
                        var args = confirmation.customId.split('.');
                        let x = args[2];
                        let y = args[3];
                        gameState[x][y] = symbols[currentTurn];
                        currentTurn = currentTurn === 1 ? 0 : 1;
                        currentPlays++;
                        if (gameOver()) {
                            let result = getWinner();
                            await confirmation.update({content: `**Game Over! ${result}**`, components: [row1, row2, row3], ephemeral: false});
                            await saveWinner(players[0].id, players[1].id, players[firstPlayer].id, gameState);
                            return;
                        } else {
                            updateBoard();
                            await confirmation.update({content: `**${players[currentTurn]} it's your turn. You have 30 seconds to make your move.**`, components: [row1, row2, row3], ephemeral: false});
                        }
                    }  catch (e) { 
                        console.error(e);
                        await confirmation.update({ content: `**No response received within 30 seconds, ${players[currentTurn === 1 ? 0 : 1]} wins by forfeit.**`, components: [], ephemeral: false});
                        await saveWinner(players[0].id, players[1].id, players[firstPlayer].id, gameState);
                        return;
                    }
                }
            }
        } catch (e) {
            console.error(e);
            await interaction.editReply({content: '**No response received within 2 minutes, challenge cancelled.**', components: [], ephemeral: false});
            return;
        }
    }
};