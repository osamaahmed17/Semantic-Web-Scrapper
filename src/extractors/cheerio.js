"use strict";
var Transform = require("stream")
    .Transform;
var util = require("util");
var Error = require("@petitchevalroux/error");
var cheerio = require("cheerio");
var contentType = require("content-type");


function CheerioExtractor(options) {
    this.options = options || {};
    this.options.objectMode = true;
    Transform.call(this, this.options);
}
util.inherits(CheerioExtractor, Transform);

CheerioExtractor.prototype._transform = function(chunk, encoding, callback) {
    try {
        var isXml = this.isXml(chunk.headers);
        var domContext = cheerio.load(chunk.content, {
            "xmlMode": isXml
        });
        var items = {};
        var self = this;

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

module.exports = CheerioExtractor;
