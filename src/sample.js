"use strict";
var path = require("path");
var scraper = require(path.join(__dirname, "index"));
var RegexSpider = scraper.RegexSpider;
var Crawler = scraper.Crawler;
var util = require("util");
var process = require("process");

var regexes = [];
regexes.push(
    new RegExp("^https?://dev.petitchevalroux.net/index(\..*?|)\.html")
);
var mapping = [];
// Extract all articles
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
        // Start Url
        "http://dev.petitchevalroux.net/index.html",
        // Regexes matching urls to extract links from
        regexes,
        // Regexes matching urls to extract data from
        regexes,
        mapping
    );
}
util.inherits(SampleSpider, RegexSpider);

var crawler = new Crawler();
crawler.write(new SampleSpider());
crawler
    .on("data", function(data) {
        process.stdout.write("data:" + JSON.stringify(data, null, 2) + "\n");
    })
    .on("error", function(error) {
        process.stdout.write("error:" + JSON.stringify(error, null, 2) +
            "\n");
    });
