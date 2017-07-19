"use strict";
var path = require("path");
var Spider = require(path.join(__dirname, "default"));
var util = require("util");
var Promise = require("bluebird");
var Error = require("@petitchevalroux/error");
var urlModule = require("url");
var logger = require(path.join(__dirname, "..", "logger"));

function RejexSpider(startUrl, linkRegexes, extractRegexes, mapping,
    maxHostDepth) {
    this.linkRegexes = linkRegexes;
    this.extractRegexes = extractRegexes || this.linkRegexes;
    this.maxHostDepth = typeof(maxHostDepth) !== "undefined" ? maxHostDepth : -
        1;
    Spider.call(this, startUrl, mapping);
}
util.inherits(RejexSpider, Spider);

/**
 * Return true if we should parse url html for finding new url
 * @returns {Promise}
 */
RejexSpider.prototype.isLinkUrl = function(url, contextUrl) {
    var self = this;
    return this
        .matchRegexes(url, this.linkRegexes)
        .then(function(isMatchingUrl) {
            if (!isMatchingUrl || self.maxHostDepth < 0) {
                return isMatchingUrl;
            }
            return self
                .getHostnameFromUrl(contextUrl)
                .then(function(contextHostname) {
                    return self.
                    getHostDepth(contextHostname)
                        .then(function(contextDepth) {
                            if (contextDepth > self.maxHostDepth) {
                                return false;
                            }
                            return self
                                .getHostnameFromUrl(url)
                                .then(function(hostname) {
                                    if (hostname ===
                                        contextHostname) {
                                        return contextDepth <=
                                            self.maxHostDepth;
                                    }
                                    return self
                                        .setHostDepth(
                                            hostname,
                                            contextDepth +
                                            1)
                                        .then(function(
                                            depth) {

                                            return depth <=
                                                self.maxHostDepth;
                                        });
                                });
                        });
                });
        });
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

RejexSpider.prototype.getHostDepth = function(hostname) {
    var self = this;
    return new Promise(function(resolve, reject) {
        try {
            var depth = 0;
            if (typeof(self.hostDepths) !== "undefined" &&
                typeof(self.hostDepths[hostname]) !== "undefined") {
                depth = self.hostDepths[hostname];
            }
            logger.debug(
                "host depth (host: %s, depth: %d, valid: %d)",
                hostname,
                depth,
                depth <= self.maxHostDepth
            );
            resolve(depth);
        } catch (err) {
            reject(err);
        }
    });
};

RejexSpider.prototype.getHostnameFromUrl = function(url) {
    return new Promise(function(resolve, reject) {
        try {
            resolve(new urlModule
                .URL(url)
                .hostname);
        } catch (err) {
            reject(err);
        }
    });

};

RejexSpider.prototype.setHostDepth = function(hostname, depth) {
    var self = this;
    return new Promise(function(resolve, reject) {
        try {
            if (!self.hostDepths) {
                self.hostDepths = [];
            }
            // Depths are immutable
            if (typeof(self.hostDepths[hostname]) === "undefined") {
                self.hostDepths[hostname] = depth;
            }
            logger.debug(
                "host depth (host: %s, depth: %d, valid: %d)",
                hostname,
                self.hostDepths[hostname],
                self.hostDepths[hostname] <= self.maxHostDepth
            );
            resolve(self.hostDepths[hostname]);
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = RejexSpider;
