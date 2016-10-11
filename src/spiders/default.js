"use strict";
var Promise = require("bluebird");
var normalizeUrl = require("normalize-url");
var urlModule = require("url");

var DefaultSpider = function(startUrl) {
    this.startUrl = normalizeUrl(startUrl);
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
            return urlModule.parse(normalizeUrl(url))
                .hostname === startHostName;
        });
};

/**
 * Return true if we should parse url html for finding structured data
 * @returns {Promise}
 */
DefaultSpider.prototype.isExtractUrl = function() {
    return new Promise(function(resolve) {
        resolve(true);
    });
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

module.exports = DefaultSpider;
