/*
*   File: colorUtils.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/20/2024
*
*   Util modules for working with colors.
*/

// Imports
const path = require("path");

const CONFIG = JSON.parse(process.env.CONFIG);
const ROOT_PATH = process.env.ROOT_PATH;

const MathUtils = require(path.join(ROOT_PATH, CONFIG.utils.mathUtils));


/*
*   generateHexPair
*   Generates a single random hex pair. (e.g. "ff")
*   @PARAM {integer} min - the minimum value of the hex pair (default = 0).
*   @PARAM {integer} max - the maximum value of the hex pair (default = 255).
*   @RETURN {string} - returns a single 2-digit hex value.
*/
function generateHexPair(min = 0, max = 255) {
    // Ensure we don't go out of bounds.
    min = Math.max(0, min);
    max = Math.min(255, max);
    // Generate a random integer between 0 and 255 and convert it to a hexadecimal string
    var randomValue = Math.floor(Math.random() * (max - min + 1) + min).toString(16);

    // If the generated value is a single digit, prepend a '0' to make it a two-digit hex value
    if (randomValue.length === 1) {
        randomValue = "0" + randomValue;
    }

    return randomValue;
}


/*
*   decToHex2D
*   Converts a decimal value to a hex value with a minimum of 2 digits.
*   @PARAM {integer} num - the decimal number to convert.
*   @RETURN {string} - returns the hex number value of the input (minimum 2 digit hex number returned).
*/
function decToHex2D(num) {
    num = num.toString(16);
    if (num.length == 1) {
        num = "0" + num;
    }
    return num;
}

/*
*   hexToDec
*   Converts a hex value to its decimal representation.
*   @PARAM {string} num - the hex number to convert.
*   @RETURN {number} - returns the decimal value of the input.
*/
function hexToDec(num) {
    return parseInt(num, 16);
}

/*
*   hslToRgb
*   Converts an HSL value to an RGB value. Math courtesy of https://www.baeldung.com/cs/convert-color-hsl-rgb.
*   @PARAM {integer} h - the hue of the color.
*   @PARAM {integer} s - the saturation of the color.
*   @PARAM {integer} l - the lightness of the color.
*   @RETURN {string} - returns a 6-digit hex string of the RGB representation of the color. (e.g. "ffffff")
*/
function hslToRgb(h, s, l) {
    // Calculate needed equation constants.
    const chroma = (1 - Math.abs((2 * l) - 1)) * s;
    const hPrime = h / 60;
    const x = chroma * (1 - Math.abs((hPrime % 2) - 1));
    const m = l - (chroma / 2);
    // Piecewise/matrix for the RGB formula.
    var rgb;
    if (0 <= hPrime && hPrime <= 1) {
        rgb = [chroma, x, 0];
    } else if (1 <= hPrime && hPrime <= 2) {
        rgb = [x, chroma, 0];
    } else if (2 <= hPrime && hPrime <= 3) {
        rgb = [0, chroma, x];
    } else if (3 <= hPrime && hPrime <= 4) {
        rgb = [0, x, chroma];
    } else if (4 <= hPrime && hPrime <= 5) {
        rgb = [x, 0, chroma];
    } else if (5 <= hPrime && hPrime <= 6) {
        rgb = [chroma, 0, x];
    }
    // Finalize the RGB values.
    rgb[0] = Math.floor((rgb[0] + m) * 255);
    rgb[1] = Math.floor((rgb[1] + m) * 255);
    rgb[2] = Math.floor((rgb[2] + m) * 255);
    // Convert the RGB into a hex representation.
    return `${decToHex2D(rgb[0])}${decToHex2D(rgb[1])}${decToHex2D(rgb[2])}`;
}

/*
*   randomColor
*   Generates a random RGB color.
*   @PARAM {string} color - an optional color to generate a random shade of. If not specified a completely random color will be generated.
*                           Supports: red, orange, yellow, green, blue, purple, pink, brown, and grey.
*   @PARAM {boolean} RGB - returns the color in RGB format if true, otherwise HSL (default = false).
*   @RETURN {string | array} - returns a 6-digit hex string of the RGB representation of the color ("ffffff") if RGB is true, otherwise an array of HSL values [h, s, l];
*/
function randomColor(color = false, RGB = false) {
    var h, s, l;
    // If no color specified, generate a completely random color, otherwise generate a shade of the specified color.
    if (!color) {
        /*
        *   Hue       : 0 - 360
        *   Saturation: 0 - 1
        *   Lightness : 0 - 1
        */
        h = MathUtils.randNumRounded(0, 360);
        s = MathUtils.randNum(0, 1);
        l = MathUtils.randNum(0, 1);
    } else if (color == "red") {
        /*
        *   Hue       : 0 - 10, 350 - 360
        *   Saturation: 0.2 - 1
        *   Lightness : 0.05 - 0.6
        */
       h = MathUtils.randNumRounded(0, 20);
       h = (h > 10) ? (h + 340) : h;
       s = MathUtils.randNum(0.2, 1);
       l = MathUtils.randNum(0.05, 0.6);
    } else if (color == "orange") {
        /*
        *   Hue       : 11 - 37
        *   Saturation: 0.25 - 1
        *   Lightness : 0.3 - 0.9
        */
        h = MathUtils.randNumRounded(11, 37);
        s = MathUtils.randNum(0.25, 1);
        l = MathUtils.randNum(0.3, 0.9);
    } else if (color == "yellow") {
        /*
        *   Hue       : 38 - 64
        *   Saturation: 0.4 - 1
        *   Lightness : 0.3 - 0.9
        */
        h = MathUtils.randNumRounded(38, 64);
        s = MathUtils.randNum(0.4, 1);
        l = MathUtils.randNum(0.3, 0.9);
    } else if (color == "green") {
        /*
        *   Hue       : 65 - 170
        *   Saturation: 0.1 - 1
        *   Lightness : 0.04 - 0.9
        */
        h = MathUtils.randNumRounded(65, 170);
        s = MathUtils.randNum(0.1, 1);
        l = MathUtils.randNum(0.04, 0.9);
    } else if (color == "blue") {
        /*
        *   Hue       : 171 - 255
        *   Saturation: 0.1 - 1
        *   Lightness : 0.04 - 0.95
        */
        h = MathUtils.randNumRounded(171, 255);
        s = MathUtils.randNum(0.1, 1);
        l = MathUtils.randNum(0.04, 0.95);
    } else if (color == "purple") {
        /*
        *   Hue       : 256 - 276
        *   Saturation: 0.15 - 1
        *   Lightness : 0.04 - 0.95
        */
        h = MathUtils.randNumRounded(256, 276);
        s = MathUtils.randNum(0.15, 1);
        l = MathUtils.randNum(0.04, 0.95);
    } else if (color == "pink") {
        /*
        *   Hue       : 0 - 10, 331 - 360 | 277 - 330
        *   Saturation: 0.2 - 1           | 0.15 - 1
        *   Lightness : 0.8 - 0.9         | 0.12 - 0.9
        */
        // Pick the red-range pinks vs the magenta range. 1/5 chance because there's more magenta range than red range pinks.
        let odds = randNumRounded(0, 100);
        if (odds < 20) {
            h = MathUtils.randNumRounded(0, 39);
            h = (h > 10) ? (h + 321) : h;
            s = MathUtils.randNum(0.2, 1);
            l = MathUtils.randNum(0.8, 0.9);
        } else {
            h = MathUtils.randNumRounded(277, 330);
            s = MathUtils.randNum(0.15, 1);
            l = MathUtils.randNum(0.12, 0.95);
        }                
    } else if (color == "brown") {
        /*
        *   Hue       : 11 - 37
        *   Saturation: 0.25 - 1
        *   Lightness : 0.03 - 0.25
        */
        h = MathUtils.randNumRounded(11, 37);
        s = MathUtils.randNum(0.25, 1);
        l = MathUtils.randNum(0.03, 0.25);
    } else if (color == "grey") {
        /*
        *   Hue       : 0 - 360
        *   Saturation: 0 - 0.05
        *   Lightness : 0 - 1
        */
        h = MathUtils.randNumRounded(0, 360);
        s = MathUtils.randNum(0, 0.05);
        l = MathUtils.randNum(0, 1);
    }
    return RGB ? hslToRgb(h, s, l) : [h, s, l];
}

// Export functions.
module.exports = {
    generateHexPair: generateHexPair,
    decToHex2D: decToHex2D,
    hexToDec: hexToDec,
    hslToRgb: hslToRgb,
    randomColor: randomColor,
};