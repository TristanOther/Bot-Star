/*
*   File: image.js
*   Project: Bot*
*   Author: Tristan Other (@TristanOther)
*   Date: 05/15/2024
*
*   This module allows for easy image manipulation. Using the @napi-rs/canvas library,
*   we have access to the HTML canvas. This file implements image templates for use in
*   the bot, as well as providing easy methods for drawing certain things without typing
*   all the context modifications manually each time.
*/

// Imports
const {AttachmentBuilder} = require("discord.js");
const Canvas = require('@napi-rs/canvas');
const path = require("path");

const COLORS = JSON.parse(process.env.COLOR_CONFIG);
const CONFIG = JSON.parse(process.env.CONFIG);
const ROOT_PATH = process.env.ROOT_PATH;

const stringUtils = require(path.join(ROOT_PATH, CONFIG.utils.stringUtils));

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
        // Fixes text being aligned on some unreadable garbage imaginary line which screws up any type of alignment or sizing you try to do.
        this.context.textBaseline = "top";
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
    *   drawPillBody
    *   Draws a "pill" shape, which in geometry seems to go by a million different names.
    *   @PARAM {integer} x - the x coordinate to draw the pill at (imaginary top left corner that's cut off by the fillet).
    *   @PARAM {integer} y - the y coordinate to draw the pill at (imaginary top left corner that's cut off by the fillet).
    *   @PARAM {integer} w - the width of the pill.
    *   @PARAM {integer} h - the height of the pill.
    *   @PARAM {string} color - a hex code color to draw the pill in.
    *   @PARAM {boolean} horizontal - whether the pill body should be horizontal or vertical (default = false).
    */
    async drawPillBody(x, y, w, h, color, horizontal = false) {
        // Save the current context.
        this.context.save();
        // Set the color.
        this.context.fillStyle = color;
        // Draw a horizontal pill body.
        if (horizontal) {
            const radius = h / 2;
            // Left circle -> rectangle body -> right circle.
            await this.drawCircle(x + radius, y + radius, radius, color);
            await this.drawRectangle(x + radius, y, w - h, h, color); // w - h accounts for the 2 circle radii added to the width.
            await this.drawCircle(x + (w - radius), y + radius, radius, color);
        // Draw a vertical pill body.
        } else {
            const radius = w / 2;
            // Top circle -> rectangle body -> bottom circle.
            await this.drawCircle(x + radius, y + radius, radius, color);
            await this.drawRectangle(x, y + radius, w, h - w, color); // h - w accounts for the 2 circle radii added to the height.
            await this.drawCircle(x + radius, y + (h - radius), radius, color);
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
            // Set visual parameters.
            this.context.lineWidth = thickness;
            this.context.strokeStyle = color;
            // Create a path and stroke a hollow circle.
            this.context.beginPath();
            this.context.arc(x, y, radius, 0, Math.PI * 2, true);
            this.context.stroke();
        } else {
            // Set visual parameters.
            this.context.fillStyle = color;
            // Create a path and fill a circle.
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
    *   it allows for a simpler function call, as properties such as border and
    *   circle are obfuscated into these function calls, rather than needing to be
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
    *   @PARAM {integer} maxHeight - the maximum height your text should take up (in pixels) (default = 201 (larger than the max this function generates)).
    *   @RETURN - None.
    */
    async sizeText(text, maxWidth, maxHeight = 201) {
        // Start off with a stupid font size.
        let fontSize = 200;
        do {
            // Set the context's font.
            this.context.font = `${fontSize}px sans-serif`;
            // Decrease the font size depending on the current size.
            if (fontSize <= 20) {
                fontSize -= 1;
            } else if (fontSize <= 30) {
                fontSize -= 2;
            } else if (fontSize <= 100) {
                fontSize -= 5; 
            } else {
                fontSize -= 10;
            }
        } while (this.context.measureText(text).width > maxWidth || this.context.measureText(text).actualBoundingBoxDescent > maxHeight);
    }

    /*
    *   drawText
    *   Draws text on the canvas.
    *   @PARAM {string} text - the text to draw.
    *   @PARAM {integer} x - x coordinate to place text (top left corner).
    *   @PARAM {integer} y - y coordinate to place text (top left corner).
    *   @PARAM {integer} maxWidth - the maximum width the text can take up.
    *   @PARAM {string} color - the color of the text (default white).
    *   @PARAM {boolean} autosize - whether or not to autosize the text. When off
    *                               context management is the caller's responsibility.
    */
    async drawText(text, x, y, maxWidth, color = "#ffffff", autosize = true) {
        // Save the current context.
        if (autosize) this.context.save();
        // Set the text color and size within the context.
        if (autosize) await this.sizeText(text, maxWidth);
        this.context.fillStyle = color;
        // Draw the text.
        this.context.fillText(text, x, y);
        // Restore the context from before starting.
        if (autosize) this.context.restore();
    }

    /*
    *   drawStatusBar
    *   Draws a status bar with the specified parameters. A status bar is a bar composed of parallel lines conveying information.
    *   @PARAM {integer} x - the x coordinate of the status bar (top left corner).
    *   @PARAM {integer} y - the y coordinate of the status bar (top left corner).
    *   @PARAM {integer} w - the width of the status bar (caller handles determinig adequate width).
    *   @PARAM {integer} h - the height of the status bar (caller handles determinig adequate height).
    *   @PARAM {array} colors - an array of hex codes representing each segment's color.
    *   @PARAM {integer} spacing - an optional value specifying the spacing between each segment (default = 5).
    *   @RETURN - None.
    */
    async drawStatusBar(x, y, w, h, colors, spacing) {
        // Preliminary maths.
        const segmentWidth = (w / colors.length) - spacing;
        // Error checking for ease-of-use.
//if (segmentWidth % 1 != 0) return console.error("Error in segment width.");
        // Draw segments.
        for (let i = 0; i < colors.length; i++) {
            let xShift = x + (i * (segmentWidth + spacing));
            await this.drawPillBody(xShift, y, segmentWidth, h, colors[i]);
        }
    }

    /*
    *   drawLegend
    *   Draws a status bar with the specified parameters. A status bar is a bar composed of parallel lines conveying information.
    *   @PARAM {integer} x - the x coordinate of the legend (top left corner).
    *   @PARAM {integer} y - the y coordinate of the status (top left corner).
    *   @PARAM {integer} w - the width of the status (caller handles determinig adequate width).
    *   @PARAM {integer} h - the height of the status (caller handles determinig adequate height).
    *   @PARAM {array} values - an array of text to use as the legend markers.
    *   @PARAM {string} color - an optional value specifying the color of the legend text (default = "#ffffff").
    *   @PARAM {boolean} horizontal - defines if the legend is horizontal or vertical (default = true).
    *   @RETURN - None.
    */
    async drawLegend(x, y, w, h, values, color = "#ffffff", horizontal = true) {
        // Save the current context.
        this.context.save();
        // Draw horizontal legend.
        if (horizontal) {
            // Preliminary calculations.
            const maxWidth = Math.floor(w / values.length);
            const shiftDistance = Math.floor(w / (values.length - 1));
            // Size text based on longest legend marker.
            const longest = values[stringUtils.getLongestStrIndex(values)];
            this.sizeText(longest, maxWidth, h);
            // Draw legend markers.
            for (let i = 0; i < values.length; i++) {
                this.drawText(values[i],
                              x + (i * shiftDistance) - (this.context.measureText(values[i]).width / 2), 
                              y, 
                              maxWidth,
                              color,
                              false);
            }
        // Draw vertical legend.
        } else {

        }
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
    *   @PARAM {integer} segmentSpacing - the spacing between the segments of the loading bar (default = 5).
    *   @PARAM {array} legend - optional array of values to place as legend markers along the progress bar.
    *   @RETURN - None.
    */
    async drawLoadingBar(x, y, maxWidth, height, colorData, segmentSpacing = 5, legend = false) {
        // Remove from the overall width any extra length that won't be needed.
        const extraWidth = (maxWidth + segmentSpacing) % colorData.length; // +segmentSpacing accounts for there being n-1 gaps for n segments.
        const adjWidth = maxWidth - extraWidth;
        // Shift the bar over to compensate for missing width.
        x += Math.ceil(extraWidth / 2);
        // Calculate the width of each segment.
        const segmentWidth = (adjWidth / colorData.length) - segmentSpacing;
        // Draw segments.
        for (let i = 0; i < colorData.length; i++) {
            let iX = x + (i * (segmentWidth + segmentSpacing));
            await this.drawPillBody(iX, y, segmentWidth, height, colorData[i]);
        }
        // Draw legend.
        if (legend) {
            const textWidth = 40;
            // Save the current context.
            this.context.save();
            // Get the text width for the longest string, and set the context to that width.
            const longest = legend[stringUtils.getLongestStrIndex(legend)];
            this.sizeText(longest, textWidth);
            // Draw the text in the set font size.
            for (let i = 0; i < legend.length; i++) {
                let iX = x + (i * Math.floor(adjWidth / (legend.length - 1))) - (textWidth / 2);
                await this.drawText(legend[i], iX, y + height + 10, textWidth, "#ffffff", false);
            }
            // Restore the context from before starting.
            this.context.restore();
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

// Class for generating a size `n` color swatch.
class ColorSwatch extends Image {
    /*
    *   Constructor for a ColorSwatch.
    *   @PARAM {integer} w - optional width for the swatch (default = 128).
    *   @PARAM {integer} h - optional height for the swatch (default = w).
    */
    constructor(w = 128, h = w) {
        super(w, h);
    }

    /*
    *   init
    *   Initializes this ColorSwatch by drawing color.
    *   @PARAM {string} color - color for the swatch as a hex code.
    *   @PARAM {string} textColor - color for the text of the swatch as a hex code.
    *   @RETURN - None.
    */
    async init(color, textColor) {
        // Draw the background color.
        await super.setBackground(color);
        // Save the current context.
        this.context.save();
        // Draw the text in the center of the screen.
        this.sizeText(color, Math.floor(this.canvas.width / 2));
        let mT = this.context.measureText(color);
        let textWidth = mT.width;
        let textHeight = Math.floor(mT.actualBoundingBoxAscent + mT.actualBoundingBoxDescent);
        let x = Math.floor((this.canvas.width - textWidth) / 2);
        let y = Math.floor((this.canvas.height - textHeight) / 2);
        await this.drawText(color, x, y, textWidth, textColor, false);
        // Restore the context from before starting.
        this.context.restore();
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
    *   @PARAM {integer} w - the width of the image.
    *   @PARAM {integer} h - the height of the image.
    */
    constructor(member, title, w, h) {
        // Use super constructor to set default size for a user card.
        super(w, h);
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
        await super.drawText(this.title, 180, 25, 300);
        // Draw username.
        await super.drawText(this.member.displayName, 180, 70, 600);
        // Draw user ID.
        await super.drawText(`id:${this.member.id}`, 600, 25, 180);
    }
}

// Class for image manipulation of a user-activity card.
class UserActivityCard extends UserCard {
    /*
    *   Constructor for a UserActivityCard.
    *   @PARAM {GuildMember} member - the member the card will be created for.
    *   @PARAM {string} timePeriod - the duration of time this card is for.
    */
    constructor(member, timePeriod) {
        super(member, `User Activity ${timePeriod}:`, 800, 350);
    }

    /*
    *   init
    *   Initializes this UserActivityCard by drawing on the UserCard template.
    *   @PARAM {array} colorData - an array containing a tuple of strings of hex colors to draw the activity bar and device activity.
    *   @PARAM {array} legendData - an array of strings for the legend.
    *   @RETURN - None.
    */
    async init(colorData, legendData) {
        // Draw the UserCard template.
        await super.init();
        // Seperate the color data.
        const activityColor = colorData.map(x => x[0]);
        const webActivity = colorData.map(x => x[1]);
        const desktopActivity = colorData.map(x => x[2]);
        const mobileActivity = colorData.map(x => x[3]);
        // Draw the device activity bars.
        await this.addDeviceActivityBars(20, 215, 760, 5, [mobileActivity, desktopActivity, webActivity], ["mobile", "desktop", "web"]);
        // Draw the activity bar.
        const segmentSpacing = 3;
        const maxBarWidth = Math.floor(this.canvas.width * 0.9);
        const barWidth = maxBarWidth - (maxBarWidth % activityColor.length);
        const barShift = Math.floor((this.canvas.width - barWidth) / 2);
        await super.drawStatusBar(barShift, 230, barWidth, 70, activityColor, segmentSpacing);
        await super.drawLegend(barShift, 305, barWidth, 10, legendData);
    }

    /*
    *   addDeviceActivityBars
    *   Draws activity data bars on the card.
    *   @PARAM {integer} x - the x coordinate of the lowest bar (top left corner of the bar, text will be to the left).
    *   @PARAM {integer} y - the y coordinate of the lowest bar (top left corner of the bar, text will be to the left).
    *   @PARAM {integer} maxWidth - the maximum width of the bars (will be scaled the same was as a loading bar).
    *   @PARAM {integer} height - the height of the bars.
    *   @PARAM {array} activities - list of arrays of data for where to draw the bars.
    *   @PARAM {string} activityTexts - the names of the activities to put as a name next to the bars.
    *   @PARAM {integer} segmentSpacing - the segment spacing of the corresponding loading bad (used to match widths) (default = 5).
    *   @RETURN - None.
    */
    async addDeviceActivityBars(x, y, maxWidth, height, activities, activityTexts, segmentSpacing = 5) {
        // Save the current context.
        this.context.save();
        // Get the longest activity text and size the text.
        const textWidth = 8 * height;
        const longest = activityTexts[stringUtils.getLongestStrIndex(activityTexts)];
        this.sizeText(longest, textWidth);
        // Draw each activity bar.
        for (let bar = 0; bar < activities.length; bar++) {
            const activity = activities[bar];
            const activityText = activityTexts[bar];
            var mT = this.context.measureText("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"); // Dummy text because bounding lines in HTML canvas are insane.
            var textHeight = Math.floor(mT.actualBoundingBoxDescent);
            var curY = y - ((textHeight * bar) * 2);
            // Remove from the overall width any extra length that won't be needed.
            const extraWidth = (maxWidth + segmentSpacing) % activity.length;
            const adjWidth = maxWidth - extraWidth;
            // Shift the bar over to compensate for missing width.
            var shiftX = Math.floor(extraWidth / 2) + x;
            // Loop through each timestamp, drawing bar segments as we reach the end of a group of valid timestamps.
            const segmentWidth = Math.round(adjWidth / activity.length);
            var curX = shiftX;
            var curWidth = 0;
            var totalWidth = 0;
            for (let i = 0; i < activity.length; i++) {
                if (activity[i]) {
                    curWidth += segmentWidth;
                    totalWidth += segmentWidth;
                } else if (curWidth) {
                    await super.drawPillBody(curX, curY + 2, curWidth - (2 * segmentSpacing), height, "#428df5", true);
                    curX += curWidth + segmentWidth;
                    curWidth = 0;
                } else {
                    curX += segmentWidth;
                    totalWidth += segmentWidth;
                }
            }
            // If we get to the end of the timestamps without the device going offline make sure to draw the last bar.
            if (curWidth) {
                // -2*segmentSpacing stops the final bar overflowing past the loading bar below it because of math stuff.
                await super.drawPillBody(curX, curY + 2, curWidth - (2 * segmentSpacing), height, "#428df5", true); 
            }
            // Draw text.
            
            await this.drawText(activityText, shiftX - textWidth, curY, textWidth, "#428df5", false);
        }
        // Restore the context from before starting.
        this.context.restore();
    }
}

// Export classes.
module.exports = {
    Image: Image,
    ColorSwatch: ColorSwatch,
    UserCard: UserCard,
    UserActivityCard: UserActivityCard,
};