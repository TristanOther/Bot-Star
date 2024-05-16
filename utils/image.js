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
const COLORS = JSON.parse(process.env.COLOR_CONFIG);

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
    *   Sets the background of the canvas.
    *   @PARAM {string} bgColor - the background color in hex format (#ffffff).
    *   @PARAM {string} bColor - color in hex form for border (optional).
    *   @PARAM {string} bThickness - thickness for border (default = 1).
    *   @RETURN - None.
    */
    async setBackground(bgColor, bColor = false, bThickness = 1) {
        // Color in background.
        await this.drawRectangle(0, 0, this.canvas.width, this.canvas.height, bgColor);
        // If border is specified...
        if (bColor) await this.drawRectangle(0, 0, this.canvas.width, this.canvas.height, bColor, bThickness);
    }

    /*
    *   drawRectangle
    *   Draws a rectangle to the canvas.
    *   @PARAM {integer} x - the x coordinate of the rectangle (top left corner).
    *   @PARAM {integer} y - the x coordinate of the rectangle (top left corner).
    *   @PARAM {integer} w - the width of the rectangle.
    *   @PARAM {integer} h - the height of the rectangle.
    *   @PARAM {string} color - the color of the rectangle.
    *   @PARAM {integer} thickness - optional thickness for the rectangle. If not provided the rectangle will be filled in.
    *   @RETURN - None.
    */
    async drawRectangle(x, y, w, h, color, thickness = false) {
        // Save the current context.
        this.context.save();
        // Draw the rectangle.
        if (thickness) {
            // Draw a rectangle outline.
            this.context.strokeStyle = color;
            this.context.lineWidth = thickness;
            this.context.strokeRect(x, y, w, h);
        } else {
            // Draw a solid rectangle.
            this.context.fillStyle = color;
            this.context.fillRect(x, y, w, h);
        }
        // Restore the context from before starting.
        this.context.restore();
    }

    /*
    *   drawCircle
    *   Draws a circle to the canvas.
    *   @PARAM {integer} x - the x coordinate of the center of the circle.
    *   @PARAM {integer} y - the y coordinate of the center of the circle.
    *   @PARAM {integer} radius - the radius of the circle in pixels.
    *   @PARAM {string} color - the color of the circle in hex format (#ffffff).
    *   @PARAM {integer} thickness - outline thickness (circle will be solid if no value is specified);
    *   @RETURN - None.
    */
    async drawCircle(x, y, radius, color, thickness = false) {
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
        if (border) this.drawCircle((image.width / 2) + x, (image.height / 2) + y, (image.width / 2) + (border.thickness / 2), border.color, border.thickness);
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
    *   sizeText
    *   Sets this context to the appropriate font size for the text you want to draw.
    *   @PARAM {string} text - the text that's going to be drawn.
    *   @PARAM {integer} maxWidth - the maximum width your text should take up (in pixels).
    *   @RETURN - None.
    */
    async sizeText(text, maxWidth) {
        let fontSize = 100;
        do {
            this.context.font = `${fontSize -= (fontSize <= 20) ? 3 : 10}px sans-serif`;
        } while (this.context.measureText(text).width > maxWidth);
    }

    /*
    *   drawText
    *   Draws text on the canvas.
    *   @PARAM {string} text - the text to draw.
    *   @PARAM {integer} x - x coordinate to place text (bottom left corner).
    *   @PARAM {integer} y - y coordinate to place text (bottom left corner).
    *   @PARAM {integer} maxWidth - the maximum width the text can take up.
    *   @PARAM {string} color - the color of the text (default white).
    */
    async drawText(text, x, y, maxWidth, color = "#ffffff") {
        // Save the current context.
        this.context.save();
        // Set the text color and size within the context.
        await this.sizeText(text, maxWidth);
        this.context.fillStyle = color;
        // Draw the text.
        this.context.fillText(text, x, y);
        // Restore the context from before starting.
        this.context.restore();
    }

    /*
    *   drawLoadingBar
    *   Draws a loading/progress/data bar on the canvas.
    *   @PARAM {integer} x - the x coordinate of the loading bar (top left corner).
    *   @PARAM {integer} y - the y coordinate of the loading bar (top left corner).
    *   @PARAM {integer} maxWidth - the maximum width of the loading bar (may be scaled down slightly to fit data nicely).
    *   @PARAM {integer} height - the height of the loading bar.
    *   @PARAM {array} colorData - array of hex codes for the colors to be drawn in each segment.
    *   @PARAM {integer} subSegments - an optional number representing the number of sub-segments per larger segment there should be.
    *                                  If this option is provided a value the colorData will be split into n/subSegments larger segments,
    *                                  with subSegments sub-segments to each larger segment. If too much color data is provided the beginning 
    *                                  will be truncated.
    *   @PARAM {string} borderColor - the color of the border lines on the loading bar (default black).
    *   @RETURN - None.
    */
    async drawLoadingBar(x, y, maxWidth, height, colorData, subSegments = false, borderColor = "#000000") {
        const borderThickness = 7;
        const subBorderThickness = 2;
        // Remove from the overall width any extra length that won't be needed.
        var width = maxWidth - ((maxWidth - borderThickness) % colorData.length); // -5 accounts for there being 1 more outline border edge than segment.
        // Draw the background rectangle.
        await this.drawRectangle(x, y, width, height, borderColor);
        // If subsegments are enabled:
        if (subSegments) {
            // Trim data off the beginning if necessary so the segments can be drawn evenly.
            var trimAmount = colorData.length % subSegments;
            colorData = colorData.slice(trimAmount);
            // Draw segments.
            var segmentWidth = colorData.length / subSegments;
            for (i = 0; i < colorData.length; i++) {
                let subSegmentThickness = ((width - ((((subSegments * segmentWidth) - 1) * subBorderThickness) + (segmentWidth * borderThickness))) / colorData.length);
                let curSegment = Math.floor(i / segmentWidth); // How many segments (not sub-segments) have been drawn.
                let tempY = y + borderThickness;
                let tempX = (x + borderThickness) + // Shift for initial thick border (left outer boarder).
                            (curSegment * borderThickness) + // Shift for current large inner borders (segment border).
                            ((i - curSegment) * subBorderThickness) + // Shift for subsegment borders.
                            (i * subSegmentThickness); // Shift for segment fill-in.
                await this.drawRectangle(tempX, tempY, subSegmentThickness, (height - (borderThickness * 2)), colorData[i]);

            }
        // Otherwise just draw each segment.
        } else {
            for (i = 0; i < colorData.length; i++) {
                let tempY = y + borderThickness;
                let tempX = (x + borderThickness) + (i * ((width - borderThickness) / colorData.length));
                await this.drawRectangle(tempX, tempY, (((width - borderThickness) / colorData.length) - borderThickness), (height - (borderThickness * 2)), colorData[i]);
            }
        }
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
        // Add the user's profile picture.
        if (this.member.presence) {
            await super.drawCircleImageBorder(this.member.user.displayAvatarURL(), 25, 25, COLORS.status[this.member.presence.status], 5);
        } else {
            await super.drawCircleImage(this.member.user.displayAvatarURL(), 25, 25);
        }
        // Draw the header text.
        await super.drawText("User Activity (24hr):", 180, 55, 400);
        // Draw username.
        await super.drawText(this.member.displayName, 180, 135, 720);
        // Draw user ID.
        await super.drawText(`id:${this.member.id}`, 590, 40, 200);
        // Draw the activity bar.
        await super.drawLoadingBar(20, 180, 760, 80, [COLORS.status.online, COLORS.status.idle, COLORS.status.dnd, COLORS.status.idle, COLORS.status.online,
                                                      COLORS.status.dnd, COLORS.status.online, COLORS.status.idle, COLORS.status.online, COLORS.status.dnd,
                                                      COLORS.status.idle, COLORS.status.idle, COLORS.status.dnd, COLORS.status.idle, COLORS.status.online,
                                                      COLORS.status.dnd, COLORS.status.dnd, COLORS.status.dnd, COLORS.status.online, COLORS.status.online,
                                                      COLORS.status.online, COLORS.status.idle, COLORS.status.dnd, COLORS.status.idle, COLORS.status.online,
                                                      COLORS.status.dnd, COLORS.status.online, COLORS.status.idle, COLORS.status.online, COLORS.status.dnd,
                                                      COLORS.status.idle, COLORS.status.idle, COLORS.status.dnd, COLORS.status.idle, COLORS.status.online,
                                                      COLORS.status.dnd, COLORS.status.dnd, COLORS.status.dnd, COLORS.status.online, COLORS.status.online,
                                                      COLORS.status.online, COLORS.status.idle, COLORS.status.dnd, COLORS.status.idle, COLORS.status.online,
                                                      COLORS.status.dnd, COLORS.status.online, COLORS.status.idle, COLORS.status.online, COLORS.status.dnd,
                                                      COLORS.status.idle, COLORS.status.idle, COLORS.status.dnd, COLORS.status.idle, COLORS.status.online,
                                                      COLORS.status.dnd, COLORS.status.dnd, COLORS.status.dnd, COLORS.status.online, COLORS.status.online], 5);
    }
}

// Export classes.
module.exports = {
    Image: Image,
    UserCard: UserCard
};