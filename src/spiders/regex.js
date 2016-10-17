"use strict";
var path = require("path");
var Spider = require(path.join(__dirname, "default"));
var util = require("util");
var Promise = require("bluebird");
var Error = require("@petitchevalroux/error");

function RejexSpider(startUrl, linkRegexes, extractRegexes, mapping) {
    this.linkRegexes = linkRegexes;
    this.extractRegexes = extractRegexes || this.linkRegexes;
    Spider.call(this, startUrl, mapping);
}
util.inherits(RejexSpider, Spider);

/**
 * Return true if we should parse url html for finding new url
 * @returns {Promise}
 */
RejexSpider.prototype.isLinkUrl = function(url) {
    return this.matchRegexes(url, this.linkRegexes);
};

/**
 * Return true if we should parse url html for finding structured data
 * @returns {Promise}
 */
RejexSpider.prototype.isExtractUrl = function(url) {
    return this.matchRegexes(url, this.extractRegexes);
};

/**
 * Return true if str match at least one regex in regexes
 * @param {string} str
 * @param {array} regexes
 * @returns {Promise}
 */
RejexSpider.prototype.matchRegexes = function(str, regexes) {
    return new Promise(function(resolve, reject) {
        try {
            for (var i = 0; i < regexes.length; i++) {
                if (regexes[i].test(str)) {
                    resolve(true);
                    return;
                }
            }
            resolve(false);
        } catch (err) {
            reject(new Error("matching regex (str: %s)", str, err));
        }
    });
};

module.exports = RejexSpider;
