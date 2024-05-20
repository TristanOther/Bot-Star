/*
*   File: stringUtils.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/10/2024
*
*   Util modules for working with strings.
*/

/*
*   isWhitespace
*   Determines if an input string contains only whitespace.
*   @PARAM {string} str - Input string.
*   @RETURN {boolean} - True if the string is only whitespace, otherwise false.
*/
exports.isWhitespace = (str) => {
    return (str.trim() == '');
}

/*
*   unquote
*   Removes quotes (single or double) from around a string.
*   @PARAM {string} str - Input string.
*   @RETURN {string} - The input string without quotes.
*/
exports.unquote = (str) => {
    return str.match(/^["|'].*["|']$/) ? str.slice(1, -1) : str;
}

/*
*   getLongestStr
*   Finds the array index of the longest string in an array.
*   @PARAM {array} arr - the array of input strings.
*   @RETURN {integer} - the index of the longest string.
*/
exports.getLongestStrIndex = (arr) => {
    return arr.reduce((maxIndex, currentString, currentIndex, array) => {
        return currentString.length > array[maxIndex].length ? currentIndex : maxIndex;
    }, 0);
}