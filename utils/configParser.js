/*
*   File: configParser.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/10/2024
*   Last Modified: 05/13/2024
*
*   An implementation of a config parser as a JS module. Why not go with an 
*   existing library? Becasuse I'm doing this for fun and enjoy writing code
*   which relies on as few dependancies as possible. This code will just work as 
*   long as this bot works, no possibility of broken dependancy. If you don't 
*   like it, I don't know. That's your prerogative I guess ¯\_(ツ)_/¯.
*/

// Imports.
const fs = require("fs");
const stringUtils = require("./stringUtils.js");

// Class for parsing a config. Allows the config to be loaded and have actions
// run on it without recalling the parser module.
module.exports = class Config {    
    /*
    *   Constructor for a Config.
    *   @PARAM {string} path - the path to a config file.
    */
    constructor(path) {
        // Initialize config with default category for uncategorized fields.
        this.config = {"default": {}};
        
        // Check if path is to a .cfg file.
        path = path.toLowerCase();
        if (path.slice(-3) != "cfg") {
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
                    if (!this.config[current_category]) this.config[current_category] = {};
                // Otherwise the line is a field, add it to the current category.
                } else {
                    let args = line.split("=");
                    if (args.length != 2) throw new Error(`Invalid line in config. Line ${cur_line} contains an invalid assignment structure ${line}.`);
                    this.config[current_category][args[0].trim()] = args[1].trim();
                }
                // Increment current line.
                cur_line++;
            }
        // Pass up the error if we encounter one.
        } catch (err) {
            return err;
        }
    }

    /*  
    *   get
    *   Gets a category by name.
    *   @PARAM {string} cateogry - a cateogry name, or if none specified 'default' is used.
    *   @RETURN {object} - returns fields of the specified cateogry. 
    */
    get(category = 'default') {
        if (this.config[category]) {
            return this.config[category];
        } else if (this.config["default"][category]) {
            return this.config["default"][category];
        } else {
            throw new Error(`Category "${category} not found."`);
        }
    }
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