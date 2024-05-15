/*
*   File: image.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/15/2024
*   Last Modified: 05/15/2024
*
*   This module allows for easy image manipulation. Using the @napi-rs/canvas library,
*   we have access to the HTML canvas. This file implements image templates for use in
*   the bot, as well as providing easy methods for drawing certain things without typing
*   all the context modifications manually each time.
*/

// Imports
const Canvas = require('@napi-rs/canvas');
const {AttachmentBuilder} = require("discord.js");

// Base class for image manipulation.
class Image {
    // Class variables.
    canvas;
    context;

    /*
    *   Constructor for an Image.
    *   @PARAM {integer} w - the width of the image.
    *   @PARAM {integer} h - the height of the image.
    */
    constructor(w, h) {
        this.canvas = Canvas.createCanvas(w, h);
        this.context = this.canvas.getContext('2d');
    }

    /*
    *   setBackground
    *   Sets the background of the image.
    *   @PARAM {string} bgColor - the background color in hex format (#ffffff).
    *   @PARAM {string} bColor - color in hex form for border (optional).
    *   @PARAM {string} bThickness - thickness for border (default = 1).
    *   @RETURN - None.
    */
    async setBackground(bgColor, bColor = false, bThickness = 1) {
        // Check bgColor for validity.
        bgColor = bgColor.toLowerCase();
        if (!bgColor.match(/^[#](\d|[a-f]){6}$/)) return console.error("Background color must be in the format #ffffff.");
        // Save the current context.
        this.context.save();
        // Color in background.
        this.context.fillStyle = bgColor;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // If border is specified...
        if (bColor) {
            if (!bColor.match(/^[#](\d|[a-f]){6}$/)) return console.error("Border color must be in the format #ffffff.");
            this.context.strokeStyle = bColor;
            this.context.lineWidth = bThickness;
            this.context.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        }
        // Restore the context from before starting.
        this.context.restore();
    }

    /*
    *   drawCircle
    *   Draws a circle.
    *   @PARAM {integer} x - the x coordinate of the center of the circle.
    *   @PARAM {integer} y - the y coordinate of the center of the circle.
    *   @PARAM {integer} radius - the radius of the circle in pixels.
    *   @PARAM {string} color - the color of the circle in hex format (#ffffff).
    *   @PARAM {integer} thickness - outline thickness (circle will be solid if no value is specified);
    *   @RETURN - None.
    */
    async drawCircle(x, y, radius, color, thickness = false) {
        // Check color for validity.
        color = color.toLowerCase();
        if (!color.match(/^[#](\d|[a-f]){6}$/)) return console.error("Color must be in the format #ffffff.");
        // Save the current context.
        this.context.save();
        // Draw the circle.
        if (thickness) {
            this.context.lineWidth = thickness;
            this.context.strokeStyle = color;
            this.context.beginPath();
            this.context.arc(x, y, radius, 0, Math.PI * 2, true);
            this.context.stroke();
        } else {
            this.context.beginPath();
            this.context.arc(x, y, radius, 0, Math.PI * 2, true);
            this.context.fill();
        }
        // Restore the context from before starting.
        this.context.restore();
    }

    /*
    *   drawImageHelper
    *   Helper for drawing an image to the canvas.
    *   @PARAM {string} src - path or URL to the image to add.
    *   @PARAM {integer} x - the x coordinate the image (top left corner).
    *   @PARAM {integer} y - the y coordinate the image (top left corner).
    *   @PARAM {integer} w - the width of the image (defaults to image width).
    *   @PARAM {integer} h - the height of the image (defaults to image height).
    *   @PARAM {boolean} circle - whether or not the image should be a circle.
    *   @PARAM {obj} border - parameters to draw a border in the form {color: <hex>, thickness <int>}.
    *   @RETURN - None.
    */
    async drawImageHelper(src, x, y, w , h, circle, border) {
        // Save the current context.
        this.context.save();
        // Retrieve the image.
        const image = await Canvas.loadImage(src);
        if (!image) return console.error("Could not retrieve image.");
        // Ensure width and height have values.
        if (!w) w = image.width;
        if (!h) h = image.height;
        // Draw the image.
        if (circle) {
            this.context.beginPath();
            this.context.arc((image.width / 2) + x, (image.height / 2) + y, (image.width / 2), 0, Math.PI * 2, true);
            this.context.closePath();
            this.context.clip();
        }
        this.context.drawImage(image, x, y, w, h);
        // Restore the context from before starting.
        this.context.restore();
        // Draw border if applicable.
        if (border) this.drawCircle((image.width / 2) + x, (image.height / 2) + y, (image.width / 2) + border.thickness, border.color, border.thickness);
    }

    /*
    *   drawImage, drawCircleImage, drawImageBorder, drawCircleImageBorder
    *   These functions with similar signatures all call the same helper to draw 
    *   an image to the canvas. They're split up into seperate functions because
    *   it allows for a drastically simpler function call, as properties such as border
    *   and circle are obfuscated into these function calls, rather than needing to be
    *   given optional configurations when called from elsewhere in the code.
    *   @PARAM {string} src - path or URL to the image to add.
    *   @PARAM {integer} x - the x coordinate the image (top left corner).
    *   @PARAM {integer} y - the y coordinate the image (top left corner).
    *   @PARAM {string} bColor - border color in hex form.
    *   @PARAM {integer} bThickness - border thickness.
    *   @PARAM {integer} w - the width of the image (defaults to image width).
    *   @PARAM {integer} h - the height of the image (defaults to image height).
    *   @RETURN - None.
    */
    async drawImage(src, x, y, w = false, h = false) {
        await this.drawImageHelper(src, x, y, w, h, false, false);
    }

    async drawCircleImage(src, x, y, w = false, h = false) {
        await this.drawImageHelper(src, x, y, w, h, true, false);
    }

    async drawImageBorder(src, x, y, bColor, bThickness, w = false, h = false) {
        await this.drawImageHelper(src, x, y, w, h, false, {color: bColor, thickness: bThickness});
    }

    async drawCircleImageBorder(src, x, y, bColor, bThickness, w = false, h = false) {
        await this.drawImageHelper(src, x, y, w, h, true, {color: bColor, thickness: bThickness});
    }

    /*
    *   getAttachment
    *   Builds a Discord attachment from the current canvas.
    *   @RETURN {AttachmentBuilder} - returns an attachment of the current image.
    */
    async getAttachment() {
        const attachment = new AttachmentBuilder(await this.canvas.encode('png'), { name: 'image.png' });
        return attachment;
    }
}

// Class for image manipulation of a default user-card template.
class UserCard extends Image {
    // Class variables.
    member;
    title;

    /*
    *   Constructor for a UserCard.
    *   @PARAM {GuildMember} member - the member the card will be created for.
    *   @PARAM {string} title - the title that should be displayed on this card.
    */
    constructor(member, title) {
        // Use super constructor to set default size for a user card.
        super(800, 300);
        // Set class variables.
        this.member = member;
        this.title = title;
    }

    /*
    *   init
    *   Initializes this UserCard by drawing the template.
    *   @RETURN - None.
    */
    async init() {
        // Draw the background.
        await super.setBackground("#29292e", "#202020", 20);
        // Get the color for the status outline on the user's PFP.
        var color;
        if (this.member.presence) {
            switch(this.member.presence.status) {
                case "online":
                    color = "#0c9439";
                    break;
                case "idle":
                    color = "#d1b31f";
                    break;
                case "dnd":
                    color = "#c4281a";
                    break;
                default:
                    color = false;
                    break;
            }
        }
        // Add the user's profile picture.
        if (color) {
            await super.drawCircleImageBorder(this.member.user.displayAvatarURL(), 20, 20, color, 5);
        } else {
            await super.drawCircleImage(this.member.user.displayAvatarURL(), 20, 20);
        }
    }
}

// Export classes.
module.exports = {
    Image: Image,
    UserCard: UserCard
};