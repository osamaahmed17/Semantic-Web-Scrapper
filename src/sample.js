"use strict";
var path = require("path");
var scraper = require(path.join(__dirname, "index"));
var RegexSpider = scraper.RegexSpider;
var Crawler = scraper.Crawler;
var util = require("util");
var process = require("process");

var regexes = [];
regexes.push(new RegExp(
    "^https?://dev.petitchevalroux.net/index(\..*?|)\.html"));
var mapping = [];
mapping.push({
    "type": "articles",
    "selector": "table.contents h5 a",
    "properties": {
        "url": {
            "from": "attribute",
            "name": "href"
        },
        "title": {
            "from": "text"
        }
    }
});

function SampleSpider() {
    RegexSpider.call(
        this,
        "http://dev.petitchevalroux.net/index.html",
        regexes,
        regexes,
        mapping
    );
}
util.inherits(SampleSpider, RegexSpider);
var crawler = new Crawler();
crawler.write(new SampleSpider());
crawler
    .on("data", function(data) {
        process.stdout.write(util.format("%j\n", data));
    })
    .on("error", function(error) {
        process.stderr.write(util.format("errro: %j\n", error));
    });
