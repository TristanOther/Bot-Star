/*
*   File: stringUtils.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/10/2024
*   Last Modified: 05/15/2024
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