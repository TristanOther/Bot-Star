/*
*   File: stringUtils.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/10/2024
*   Last Modified: 05/10/2024
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