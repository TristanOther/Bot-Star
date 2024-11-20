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
    curHeight = 0;

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
        if (bColor) {
            await this.drawRectangle(0, 0, this.canvas.width, this.canvas.height, bColor, bThickness);
            this.curHeight += bThickness;
        }
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
    */
    async drawPillBody(x, y, w, h, color) {
        const horizontal = w > h;
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
    *   @PARAM {boolean} dimScale - whether the dimensions provided are pixels or scale %.
    *   @RETURN - None.
    */
    async drawImageHelper(src, x, y, w , h, circle, border, dimScale) {
        // Save the current context.
        this.context.save();
        // Retrieve the image.
        const image = await Canvas.loadImage(src);
        if (!image) return console.error("Could not retrieve image.");
        // Ensure width and height have values (pixels or scale depending on dimScale).
        if (dimScale) {
            w = w ? (image.width * w) : image.width;
            h = h ? (image.height * h) : image.height;
        } else {
            if (!w) w = image.width;
            if (!h) h = image.height;
        }
        // Draw the image.
        if (circle) {
            this.context.beginPath();
            this.context.arc((w / 2) + x, (h / 2) + y, (w / 2), 0, Math.PI * 2, true);
            this.context.closePath();
            this.context.clip();
        }
        this.context.drawImage(image, x, y, w, h);
        // Restore the context from before starting.
        this.context.restore();
        // Draw border if applicable.
        if (border) this.drawCircle((w / 2) + x, (h / 2) + y, (w / 2) + (border.thickness / 2), border.color, border.thickness);
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
    *   @PARAM {boolean} dimScale - whether the dimensions provided are pixels or scale % (default = false).
    *   @RETURN - None.
    */
    async drawImage(src, x, y, w = false, h = false, dimScale = false) {
        await this.drawImageHelper(src, x, y, w, h, false, false, dimScale);
    }

    async drawCircleImage(src, x, y, w = false, h = false, dimScale = false) {
        await this.drawImageHelper(src, x, y, w, h, true, false, dimScale);
    }

    async drawImageBorder(src, x, y, bColor, bThickness, w = false, h = false, dimScale = false) {
        await this.drawImageHelper(src, x, y, w, h, false, {color: bColor, thickness: bThickness}, dimScale);
    }

    async drawCircleImageBorder(src, x, y, bColor, bThickness, w = false, h = false, dimScale = false) {
        await this.drawImageHelper(src, x, y, w, h, true, {color: bColor, thickness: bThickness}, dimScale);
    }

    /*
    *   sizeText
    *   Sets this context to the appropriate font size for the text you want to draw.
    *   @PARAM {string} text - the text that's going to be drawn.
    *   @PARAM {integer} maxWidth - the maximum width your text should take up (in pixels).
    *   @PARAM {integer} maxHeight - the maximum height your text should take up (in pixels) (default = 201 (larger than the max this function generates as bounded by fontsize)).
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
    *   @PARAM {boolean} autosize - whether or not to autosize the text. When off context
    *                               management is the caller's responsibility (default = true).
    *   @PARAM {boolean} addHeight - whether or not the height of this element should be added
    *                                to the used height of the current image (default = false).
    */
    async drawText(text, x, y, maxWidth, color = "#ffffff", autosize = true, addHeight = false) {
        // Save the current context.
        if (autosize) this.context.save();
        // Set the text color and size within the context.
        if (autosize) await this.sizeText(text, maxWidth);
        this.context.fillStyle = color;
        // Draw the text.
        this.context.fillText(text, x, y);
        // Add element height to current image use.
        if (addHeight) this.curHeight += this.context.measureText(text).actualBoundingBoxDescent;
        // Restore the context from before starting.
        if (autosize) this.context.restore();
    }

    /*
    *   drawTextWithWrap
    *   Draws text on the canvas with word wrapping (does not support autosizing).
    *   @PARAM {string} text - the text to draw.
    *   @PARAM {integer} x - x coordinate to place text (top left corner).
    *   @PARAM {integer} y - y coordinate to place text (top left corner).
    *   @PARAM {integer} maxWidth - the maximum width the text can take up.
    *   @PARAM {string} color - the color of the text (default white).
    *   @PARAM {integer} fontSize - the font size to use.
    *   @PARAM {boolean} addHeight - whether or not the height of this element should be added
    *                                to the used height of the current image (default = false).
    */
    async drawTextWithWrap(text, x, y, maxWidth, color = "#ffffff", fontSize = 32, addHeight = false) {
        this.context.save();

        this.context.font = `${fontSize}px sans-serif`;

        var words = text.split(" ");
        var lines = [];
        var currentLine = words[0];

        for (var i = 1; i < words.length; i++) {
            var word = words[i];
            var width = this.context.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        
        for (let i = 0; i < lines.length; i++) {
            await this.drawText(lines[i], x, y + (fontSize * i), maxWidth, color, false)
        }

        if (addHeight) this.curHeight += (lines.length * fontSize);
        
        this.context.restore();
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
        if (segmentWidth % 1 != 0) return console.error("Error in segment width.");
        // Draw segments.
        for (let i = 0; i < colors.length; i++) {
            let xShift = x + (i * (segmentWidth + spacing));
            await this.drawPillBody(xShift, y, segmentWidth, h, colors[i]);
        }
    }

    /*
    *   drawActivityBar
    *   Draws an activity bar with the specified parameters. An activity bar is a bar displaying when something is active over time.
    *   @PARAM {integer} x - the x coordinate of the activity bar (top left corner).
    *   @PARAM {integer} y - the y coordinate of the activity bar (top left corner).
    *   @PARAM {integer} w - the width of the activity bar (caller handles determinig adequate width).
    *   @PARAM {integer} h - the height of the activity bar (caller handles determinig adequate height).
    *   @PARAM {array} activity - an array of boolean values indicating if a section is active
    *   @PARAM {string} color - a hex code for the color of the bar.
    *   @PARAM {integer} spacing - an optional parameter for the spacing of the loading bar this activity bar corresponds to. 
    *                              Adjusts so there's no extra length on the end of drawn segments (default = 0).
    */
    async drawActivityBar(x, y, w, h, activity, color, spacing = 0) {
        // Preliminary maths.
        const sectionWidth = Math.floor(w / activity.length);
        var curX = x;
        var curWidth = 0;
        activity.push(0); // Add an extra false value so the last bar gets drawn without duplicate code.
        // Draw bar.
        for (let i = 0; i <= activity.length; i++) {
            if (activity[i]) {
                curWidth += sectionWidth;
            } else if (curWidth > 0) {
                await this.drawPillBody(curX, y, curWidth - spacing, h, color);
                curX += curWidth + sectionWidth;
                curWidth = 0;
            } else {
                curX += sectionWidth;
            }
        }
    }

    /*
    *   drawLegend
    *   Draws legend markers for use along a visual data representation.
    *   NOTE: text will overflow slightly on either side to align with the bounding box given. Enter the height/width (vertical/horizontal legend) 
    *         of the graph you're matching.
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
            // Not yet implemented.
        }
        // Restore the context from before starting.
        this.context.restore();
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
        const borderWidth = Math.floor(this.canvas.height * 0.05);
        await super.setBackground(COLORS.templates.main_theme, COLORS.templates.accent_theme, borderWidth);
        // Add the user's profile picture.
        if (this.member.presence) {
            await super.drawCircleImageBorder(this.member.user.displayAvatarURL(),
                                              Math.floor(borderWidth * 2),
                                              Math.floor(borderWidth * 2),
                                              COLORS.status[this.member.presence.status],
                                              Math.floor(borderWidth / 4),
                                              Math.floor(this.canvas.width / 800), // These scale the pfp based on the card dimensions V
                                              Math.floor(this.canvas.height / 350), // (800x350 was the original card design dimensions, and fit a default PFP scaling well.)
                                              true);
        } else {
            await super.drawCircleImage(this.member.user.displayAvatarURL(),
                                        (borderWidth * 2),
                                        (borderWidth * 2),
                                        Math.floor(this.canvas.width / 800),
                                        Math.floor(this.canvas.height / 350),
                                        true);
        }
        // Draw the header text.
        await super.drawText(this.title,
                             Math.floor(this.canvas.width / 4.5),
                             Math.floor(this.canvas.height / 6.2),
                             Math.floor((this.canvas.width / 5) * 3));
        // Draw username.
        await super.drawText(this.member.displayName,
                             Math.floor(this.canvas.width / 4.5),
                             Math.floor((this.canvas.height / 3.7)),
                             Math.floor((this.canvas.width / 5) * 2.8));
        // Draw user ID.
        await super.drawText(`id:${this.member.id}`,
                             Math.floor((this.canvas.width / 7) * 6) - Math.floor(borderWidth / 1.5),
                             borderWidth,
                             Math.floor(this.canvas.width / 7));
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
        super(member, `User Activity ${timePeriod}:`, 1600, 700);
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
        // Draw the status bar.
        const segmentSpacing = 3 * Math.floor(this.canvas.width / 800);
        const maxBarWidth = Math.floor(this.canvas.width * 0.9);
        const barWidth = maxBarWidth - (maxBarWidth % activityColor.length);
        const barShift = Math.floor((this.canvas.width - barWidth) / 2);
        const barHeight = Math.floor(this.canvas.height * 0.2);
        await super.drawStatusBar(barShift, (3.5 * barHeight), barWidth, barHeight, activityColor, segmentSpacing);
        await super.drawLegend(barShift, (4.55 * barHeight), barWidth, barHeight * 0.15, legendData);
        // Draw the activity bars.
        const actBarHeight = Math.floor(barHeight / 15);
        await this.drawActivityBar(barShift,
                                   Math.floor(2.7 * barHeight),
                                   barWidth,
                                   actBarHeight,
                                   webActivity,
                                   COLORS.templates.activity,
                                   segmentSpacing);
        await this.drawImage(CONFIG.images.wbActIcn,
                             barShift - Math.floor(actBarHeight * 6),
                             Math.floor(2.7 * barHeight) - Math.floor(2 * actBarHeight),
                             Math.floor(5 * actBarHeight),
                             Math.floor(5 * actBarHeight));
        await this.drawActivityBar(barShift,
                                   Math.floor(3 * barHeight),
                                   barWidth,
                                   actBarHeight,
                                   desktopActivity,
                                   COLORS.templates.activity,
                                   segmentSpacing);
        await this.drawImage(CONFIG.images.dsktpActIcn,
                             barShift - Math.floor(actBarHeight * 6),
                             Math.floor(3 * barHeight) - Math.floor(2 * actBarHeight),
                             Math.floor(5 * actBarHeight),
                             Math.floor(5 * actBarHeight));
        await this.drawActivityBar(barShift,
                                   Math.floor(3.3 * barHeight),
                                   barWidth,
                                   actBarHeight,
                                   mobileActivity,
                                   COLORS.templates.activity,
                                   segmentSpacing);
        await this.drawImage(CONFIG.images.mblActIcn,
                             barShift - Math.floor(actBarHeight * 6),
                             Math.floor(3.3 * barHeight) - Math.floor(2 * actBarHeight),
                             Math.floor(5 * actBarHeight),
                             Math.floor(5 * actBarHeight));
        
    }
}

// Class for image manipulation of a role selector.
class RoleSelector extends Image {
    /*
    *   Constructor for a RoleSelector.
    *   @PARAM {string} title - the title of this role selector.
    *   @PARAM {string} description - the description of this role selector.
    *   @PARAM {string} footer - the footer of this role selector.
    *   @PARAM {string} color - a hex code for the accent color of this role selector.
    *   @PARAM {obj} roles - an object containing the relevant information about roles in this selector.
    */
    constructor(title, description, footer, color, roles) {
        // Use super constructor to set size for the role selector.
        super(1000, 1000);
        // Set class variables.
        this.title = title;
        this.description = description;
        this.footer = footer;
        this.color = color;
        this.roles = roles;
    }

    /*
    *   init
    *   Initializes this RoleSelector by drawing the template.
    *   @RETURN - None.
    */
    async init() {
        // Draw the background.
        const borderWidth = Math.floor(this.canvas.height * 0.02);
        await super.setBackground(COLORS.templates.main_theme, this.color, borderWidth);

        // Draw the title and description.
        this.curHeight += Math.floor(this.canvas.height * 0.02) * 2; // Add top title gap.
        let titleHeight = this.curHeight;
        await super.drawText(this.title,
                             Math.floor(this.canvas.width * 0.02) * 2,
                             this.curHeight,
                             this.canvas.width - (Math.floor(this.canvas.width * 0.02) * 4),
                             "#ffffff",
                            true,
                            true);
        titleHeight = this.curHeight - titleHeight;
        this.curHeight += Math.floor(titleHeight / 3); // Add bottom title gap.
        if (this.description) {
            await super.drawTextWithWrap(this.description,
                                         Math.floor(this.canvas.width * 0.02) * 2,
                                         Math.floor(this.curHeight),
                                         this.canvas.width - (Math.floor(this.canvas.width * 0.02) * 6),
                                         "#ffffff",
                                         Math.floor(titleHeight / 1.75),
                                         true);
            this.curHeight += Math.floor(titleHeight / 2); // Add bottom description gap.                          
        }
        // Draw roles/rolereqs/lvlreqs headers.
        await super.drawText("Roles:",
                             Math.floor(this.canvas.width * 0.02) * 3,
                             Math.floor(this.curHeight),
                             Math.floor((this.canvas.width - (Math.floor(this.canvas.width * 0.02) * 6)) / 4),
                             "#ffffff",
                             true,
                             true);
        // Get role text size.
        const roleWidth = Math.floor((this.canvas.width - (Math.floor(this.canvas.width * 0.02) * 6)) / 3);
        const roleHeight = Math.floor(this.canvas.height / 14);
        var roleNames = this.roles.map(r => r.name);
        var longestRoleName = roleNames[stringUtils.getLongestStrIndex(roleNames)];
        this.context.save();
        super.sizeText(longestRoleName, roleWidth * 0.9, roleHeight * 0.8);
        // Draw roles.
        for (const role of this.roles) {
            this.curHeight += Math.floor(roleHeight / 2);
            await super.drawPillBody(Math.floor(this.canvas.width * 0.02) * 3,
                                     this.curHeight,
                                     roleWidth,
                                     roleHeight,
                                     `#${role.color}`);
            // while (this.context.measureText(text).width > maxWidth || this.context.measureText(text).actualBoundingBoxDescent > maxHeight);
            const textWidth = this.context.measureText(role.name).width;
            const textHeight = this.context.measureText(role.name).actualBoundingBoxDescent;
            await super.drawText(role.name,
                                 Math.floor(this.canvas.width * 0.02) * 3 + Math.floor((roleWidth - textWidth) / 2),
                                 this.curHeight + Math.floor((roleHeight - textHeight) / 2),
                                 roleWidth,
                                 "#ffffff",
                                 false,
                                 false);
            this.curHeight += roleHeight;
        }
        this.context.restore();
        // Draw footer.
        if (this.footer) {
            this.curHeight += Math.floor(roleHeight / 2);
            await super.drawTextWithWrap(this.footer,
                            Math.floor(this.canvas.width * 0.02) * 3,
                            this.curHeight,
                            this.canvas.width - (Math.floor(this.canvas.width * 0.02) * 4),
                            "#ffffff",
                            Math.floor(titleHeight / 2),
                            true);
        }
        // Draw selector type.
    }
}

// Export classes.
module.exports = {
    Image: Image,
    ColorSwatch: ColorSwatch,
    UserCard: UserCard,
    UserActivityCard: UserActivityCard,
    RoleSelector: RoleSelector,
};