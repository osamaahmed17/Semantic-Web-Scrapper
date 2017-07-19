"use strict";
var path = require("path");
var scraper = require(path.join(__dirname, ".."));
var RegexSpider = scraper.RegexSpider;
var Crawler = scraper.Crawler;
var Downloader = scraper.Downloader;
var util = require("util");
var process = require("process");


var downloader = new Downloader({
    "timeout":5000,
    'retries':1
});

downloader.on("http:error",function(err) {
    process.stdout.write("http:error: " + JSON.stringify({
        "url":err.url,
        "error":err.code
    }) + "\n");
});
downloader.on("http:response",function(response) {
    process.stdout.write("http:response: " + JSON.stringify({
        "url":response.request.uri.href,
        "status":response.statusCode,
        "headers":response.headers
    }) + "\n");
});

var crawler = new Crawler({"downloader":downloader});
crawler.write(new RegexSpider(
        // Start Url
        "http://petitchevalroux.net",
        // Regexes matching urls to extract links from
        [new RegExp("^https?://")],
        // Regexes matching urls to extract data from
        [],
        [],
        1
    )
);

crawler
    .on("data", function(data) {
        process.stdout.write("crawler:data: " + JSON.stringify(data) + "\n");
    })
    .on("error", function(error) {
        process.stderr.write("crawler:error: \n" + error.stack + "\n");
    });
