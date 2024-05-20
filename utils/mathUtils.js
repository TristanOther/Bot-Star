/*
*   File: mathUtils.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/20/2024
*
*   Util modules for maths.
*/

/*
*   randNum
*   Generates a random number between min (inclusive) and max (exclusive).
*   @PARAM {integer} min - the minimum value.
*   @PARAM {integer} max - the maximum value.
*   @RETURN {number} - returns a number in the given range.
*/
function randNum(min, max) {
    return Math.random() * (max - min) + min;
}

/*
*   randNumRounded
*   Generates a random number between min (inclusive) and max (inclusive), rounded to a whole number.
*   @PARAM {integer} min - the minimum value.
*   @PARAM {integer} max - the maximum value.
*   @RETURN {integer} - returns a number in the given range.
*/
function randNumRounded(min, max) {
    max += 1; // Make it include the maximum value.
    return Math.floor(randNum(min, max));
}

// Export functions.
module.exports = {
    randNum: randNum,
    randNumRounded: randNumRounded,
};