"use strict";
var Transform = require("stream")
    .Transform;
var util = require("util");
var Error = require("@petitchevalroux/error");
var cheerio = require("cheerio");
var contentType = require("content-type");
var Entities = require("html-entities")
    .AllHtmlEntities;
var entities = new Entities();
var entitiesDecode = entities.decode;


function CheerioExtractor(options) {
    this.options = options || {};
    this.options.objectMode = true;
    Transform.call(this, this.options);
}
util.inherits(CheerioExtractor, Transform);

CheerioExtractor.prototype._transform = function(chunk, encoding, callback) {
    var self = this;
    try {
        var isXml = this.isXml(chunk.headers);
        var domContext = cheerio.load(chunk.content, {
            "xmlMode": isXml
        });
        var items = {};

        chunk.mapping.forEach(function(typeMapping) {
            domContext(typeMapping.selector)
                .each(function(i, selectedItem) {
                    var outItem = {};
                    selectedItem = domContext(selectedItem);
                    Object.getOwnPropertyNames(typeMapping.properties)
                        .forEach(function(property) {
                            var rule = typeMapping.properties[
                                property];
                            var value = null;
                            var ruleItem = selectedItem;
                            if (rule.selector) {
                                ruleItem = domContext(
                                    rule.selector,
                                    selectedItem
                                );
                            }
                            if (rule.from ===
                                "attribute") {
                                value = ruleItem.attr(
                                    rule.name);
                            } else if (rule.from ===
                                "text") {
                                value = ruleItem.text();
                            }
                            if (typeof(value) ===
                                "string") {
                                if (rule.transforms) {
                                    value = self.transform(
                                        rule.transforms,
                                        value,
                                        ruleItem.html()
                                    );
                                }
                                outItem[property] =
                                    value;
                            }
                        });
                    items = self.addItem(typeMapping.type,
                        items, outItem);
                });

        });

        callback(null, {
            "context": chunk.context,
            "items": items
        });
    } catch (err) {
        self.emit("error", new Error("extracting object (chunk.context:%j)",
            chunk.context,
            err));
        callback(err);
    }
};

CheerioExtractor.prototype.addItem = function(type, items, item) {
    if (Object.getOwnPropertyNames(item)
        .length) {
        if (!items[type]) {
            items[type] = [item];
        } else {
            items[type].push(item);
        }
    }
    return items;
};

CheerioExtractor.prototype.isXml = function(headers) {
    if (typeof(headers) === "object" && headers["content-type"]) {
        var value = contentType.parse(headers["content-type"]);
        return value.type === "text/xml" || "application/xml";
    }
    return false;
};

/**
 * Perform value transformation
 * @param {array} operations
 * @param {string} value
 * @returns {string}
 */
CheerioExtractor.prototype.transform = function(operations, value, html) {
    operations.forEach(function(operation) {
        if (operation === "trim") {
            value = value.trim();
        } else if (operation === "entities") {
            value = entitiesDecode(value);
        } else if (operation === "normalizeWhitespace") {
            /* eslint-disable no-control-regex*/
            // Replace tab,
            // space,
            // non breaking space(\xA0)
            // with space
            value = value.replace(
                new RegExp("[\t \xA0]+", "g"),
                " "
            );
            // Replace space u0020,
            // carriage return u000D,
            // next page u2398 before end of line u000A
            value = value.replace(
                new RegExp("[\r\f ]+\u000A+", "g"),
                "\n"
            );
            // Replace multiple end of line and whitespace
            value = value
                .replace(
                    new RegExp("\n+[\r\f ]*", "g"),
                    "\n"
                )
                .trim();
            /* eslint-enable no-control-regex*/
        } else if (operation === "preserveLineBreak") {
            if (typeof(html) === "string") {
                html = html
                    .replace(/<br\s?\/?>/gi, "\n")
                    .replace(/<p\.*?>(.*?)<\/p>/gi, "\n$1\n");
                value = cheerio.load(html)
                    .text();
            }
        }

    });
    return value;
};

module.exports = CheerioExtractor;
