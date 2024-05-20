/*
*   File: dbUtils.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/13/2024
*
*   This is a util module for working with SQLITE3. Creating an instance of this class
*   allows SQLITE3 to be used asynchronously so you don't have to juggle nested DB calls
*   as you would normally with SQLITE3. This allows SQLITE3 to be used for complex call structures
*   without requiring complicated callback management. Basically it's just an ease-of-use utility.
*/

// Imports
const sqlite3 = require("sqlite3").verbose();

// Class for working with a DB. Ensuring databases are closed is the caller's responsibility.
module.exports = class Database {
    // Class fields.
    active;
    db;
    path;

    /*
    * Constructor for a Database.
    * @PARAM {string} path - the path to the database file.
    */
    constructor(path) {
        this.path = path;
    }

    /*
    *   open
    *   Opens the connection in this Database.
    *   @RETURN - None.
    */
    async open() {
        if (this.active) return console.error("This Database already has an active DB connection!");
        this.active = true;
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.path, sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /*
    *   exec
    *   Runs an `exec` command on this Database.
    *   @PARAM {string} query - the SQL query to `exec`.
    *   @PARAM {list-of arguments} ...args - any number of arguments to provide to the query.
    *   @RETURN - None.
    */
    async exec(query, ...args) {
        if (!this.active) return console.error("This Database has been closed and no longer has an active DB connection!");
        return new Promise((resolve, reject) => {
            this.db.exec(query, ...args, (err) => {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /*
    *   run
    *   Runs a `run` command on this Database.
    *   @PARAM {string} query - the SQL query to `run`.
    *   @PARAM {list-of arguments} ...args - any number of arguments to provide to the query.
    *   @RETURN - None.
    */
    async run(query, ...args) {
        if (!this.active) return console.error("This Database has been closed and no longer has an active DB connection!");
        return new Promise((resolve, reject) => {
            this.db.run(query, ...args, (err) => {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /*
    *   get
    *   Runs a `get` command on this Database.
    *   @PARAM {string} query - the SQL query to `get`.
    *   @PARAM {list-of arguments} ...args - any number of arguments to provide to the query.
    *   @RETURN {array} - returns an array containing the first row that matches the query.
    */
    async get(query, ...args) {
        if (!this.active) return console.error("This Database has been closed and no longer has an active DB connection!");
        return new Promise((resolve, reject) => {
            this.db.get(query, ...args, (err, row) => {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /*
    *   all
    *   Runs an `all` command on this Database.
    *   @PARAM {string} query - the SQL query to `all`.
    *   @PARAM {list-of arguments} ...args - any number of arguments to provide to the query.
    *   @RETURN {array} - returns an array containing all rows matching the query.
    */
    async all(query, ...args) {
        if (!this.active) return console.error("This Database has been closed and no longer has an active DB connection!");
        return new Promise((resolve, reject) => {
            this.db.all(query, ...args, (err, rows) => {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /*
    *   each
    *   Not implemented yet as I haven't had a use for it and don't really care.
    *   @RETURN - ERROR.
    */
    async each() {
        if (!this.active) return console.error("This Database has been closed and no longer has an active DB connection!");
        return console.error("Not implemented.");
    }

    /*
    *   close
    *   Closes the connection in this Database.
    *   @RETURN - None.
    */
    async close() {
        if (!this.active) return console.error("This Database has already been closed and no longer has an active DB connection!");
        this.active = false;
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}