/*
*   File: configParser.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/10/2024
*
*   An implementation of a config parser as a JS module. Why not go with an 
*   existing library? Because I'm doing this for fun and enjoy writing code
*   which relies on as few dependancies as possible. This code will just work as 
*   long as this bot works, no possibility of broken dependancy. If you don't 
*   like it, I don't know. That's your prerogative I guess ¯\_(ツ)_/¯.
*/

// Imports
const fs = require("fs");
const path = require("path");
// String utils path is hard coded because config can't be parsed without this file...
const stringUtils = require("./stringUtils.js");

/*
*   read
*   Reads the config at the provided path and returns its fields as an object.
*   @PARAM {string} path - the path to a config.
*   @RETURN {obj} - the config's fields as an object.
*/
exports.read = (path) => {    
    // Initialize config with default category for uncategorized fields.
    var config = {"default": {}};

    // Check if path is to a .cfg file.
    if (!path.toLowerCase().endsWith("cfg")) {
        throw new Error(`Config files should end with .cfg, specified path: ${path}.`);
    }
    // Try to parse config file.
    try {
        // Read lines from the config file.
        const cfg = fs.readFileSync(path, "utf8");
        const cfg_lines = cfg.split("\r\n");
        // Set default cateogry and intialize to line 1.
        var current_category = "default";
        var cur_line = 1;
        // Loop through each line in the config file.
        for (let line of cfg_lines) {
            // If this line is a comment or empty line, ignore it.
            if (line.startsWith('#') || stringUtils.isWhitespace(line)) {
                continue;
            // If this line is a cateogry header, update the cateogry we're adding fields to.
            } else if (line.match(/\[(.*?)\]/)) {
                current_category = line.slice(1, -1);
                if (!config[current_category]) config[current_category] = {};
            // Otherwise the line is a field, add it to the current category.
            } else {
                let args = line.split("=");
                if (args.length != 2) throw new Error(`Invalid line in config. Line ${cur_line} contains an invalid assignment structure ${line}.`);
                config[current_category][args[0].trim()] = stringUtils.unquote(args[1].trim());
            }
            // Increment current line.
            cur_line++;
        }
    // Pass up the error if we encounter one.
    } catch (err) {
        return err;
    }

    // Return the read config object.
    return config;
}

/*
*   Example config file format: test.cfg
*
*   # Comment
*   var = content
*   var2 = content
*
*   # coment
*   [section_header]
*   var3 = content
*/