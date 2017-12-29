"use strict";

var path = require("path");

module.exports = {
    RegexSpider: require(path.join(__dirname, "spiders", "regex")),
    Spider: require(path.join(__dirname, "spiders", "default")),
    Crawler: require(path.join(__dirname, "crawler")),
};
