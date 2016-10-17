"use strict";
var Promise = require("bluebird");
var normalizeUrl = require("normalize-url");
var urlModule = require("url");
var path = require("path");
var Extractor = require(path.join(__dirname, "..", "extractors", "cheerio"));
var logger = require(path.join(__dirname, "..", "logger"));

var DefaultSpider = function(startUrl, mapping) {
    this.startUrl = normalizeUrl(startUrl);
    this.mapping = [];
    this.mapping.push({
        "type": "links",
        "selector": "a",
        "properties": {
            "url": {
                "from": "attribute",
                "name": "href"
            },
            "anchor": {
                "from": "text"
            }
        }
    });
    // Extract link from sitemap
    this.mapping.push({
        "type": "links",
        "selector": "loc",
        "properties": {
            "url": {
                "from": "text"
            }
        }
    });

    if (mapping) {
        var self = this;
        mapping.forEach(function(o) {
            self.mapping.push(o);
        });
    }
};

/**
 * Return starting url
 * @returns {Promise}
 */
DefaultSpider.prototype.getStartUrl = function() {
    var self = this;
    return new Promise(function(resolve) {
        resolve(self.startUrl);
    });
};

/**
 * Return true if we should parse url html for finding new url
 * @returns {Promise}
 */
DefaultSpider.prototype.isLinkUrl = function(url) {
    return this.getStartHostname()
        .then(function(startHostName) {
            return urlModule.parse(url)
                .hostname === startHostName;
        });
};

/**
 * Return true if we should parse url html for finding structured data
 * @returns {Promise}
 */
DefaultSpider.prototype.isExtractUrl = function(url) {
    return this.isLinkUrl(url);
};

/**
 * Return start url hostname
 * @returns {Promise}
 */
DefaultSpider.prototype.getStartHostname = function() {
    var self = this;
    if (self.startHostName) {
        return new Promise(function(resolve) {
            resolve(self.startHostName);
        });
    }
    return self.getStartUrl()
        .then(function(startUrl) {
            self.startHostName = urlModule.parse(startUrl)
                .hostname;
            return self.startHostName;
        });
};

/**
 * Return extractor
 * @returns {Promise}
 */
DefaultSpider.prototype.getExtractor = function() {
    var self = this;
    return new Promise(function(resolve) {
        if (!self.extractor) {
            self.extractor = new Extractor();
        }
        resolve(self.extractor);
    });
};

DefaultSpider.prototype.handleDownload = function(content, headers, context) {
    var self = this;
    this.getExtractor()
        .then(function(extractor) {
            extractor.write({
                "content": content,
                "headers": headers,
                "mapping": self.mapping,
                "context": context
            });
            return context;
        })
        .catch(function(err) {
            logger.error(err);
        });
};

module.exports = DefaultSpider;
