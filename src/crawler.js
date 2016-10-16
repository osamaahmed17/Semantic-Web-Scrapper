"use strict";
var Promise = require("bluebird");
var urlModule = require("url");
var normalizeUrl = require("normalize-url");
var Stream = require("stream");
var uniqueStream = require("unique-stream");
var Error = require("@petitchevalroux/error");
var path = require("path");
var logger = require(path.join(__dirname, "logger"));
var Duplex = require("stream")
    .Duplex;
var Downloader = require("./downloader");
var util = require("util");

var Crawler = function(options) {
    if (!(this instanceof Crawler)) {
        return new Crawler(options);
    }
    var self = this;
    self.options = options || {};
    self.options.objectMode = true;
    self.downloader = self.options.downloader || new Downloader();
    delete self.options.downloader;
    Duplex.call(self, this.options);
    self.downloadStream = new Stream();
    self.downloadStream.readable = true;
    self.downloadStream
        .pipe(uniqueStream())
        .pipe(self.downloader)
        .on("data", function(chunk) {
            self.handleDownload(chunk.body, chunk.headers, chunk.url,
                chunk.context.spiderId);
        })
        .on("error", function(err) {
            self.emit("error", new Error(err));
        });
};

util.inherits(Crawler, Duplex);

Crawler.prototype.spiders = [];

Crawler.prototype.addSpider = function(spider) {
    var self = this;
    return new Promise(function(resolve) {
        self.spiders.push(spider);
        resolve(self.spiders.length - 1);
    });
};

Crawler.prototype._read = function() {

};

Crawler.prototype._write = function(spider, encoding, callback) {
    var self = this;
    this.addSpider(spider)
        .then(function(spiderId) {
            return spider.getExtractor()
                .then(function(extractor) {
                    extractor
                        .on("data",
                            function(data) {
                                self.handleExtract(
                                    data.items,
                                    data.context.url,
                                    data.context.spiderId
                                );
                            })
                        .on("error", function(err) {
                            self.emit("error", new Error(err));
                        });
                    return spider.getStartUrl();
                })
                .then(function(url) {
                    return {
                        "url": url,
                        "context": {
                            "spiderId": spiderId
                        }
                    };
                });
        })
        .then(function(response) {
            self.download(response);
            callback(null, response);
            return response;
        })
        .catch(function(err) {
            callback(err);
        });
};


Crawler.prototype.getDownloader = function() {
    var self = this;
    return new Promise(function(resolve, reject) {
        if (typeof(self.downloader) === "undefined") {
            reject(new Error("Downloader undefined"));
        } else {
            resolve(self.downloader);
        }
    });
};

Crawler.prototype.download = function(chunk) {
    this.downloadStream.emit("data", chunk);
};

Crawler.prototype.handleDownload = function(content, headers, url, spiderId) {
    this.spiders[spiderId].handleDownload(content, headers, {
        "url": url,
        "spiderId": spiderId
    });
};

Crawler.prototype.handleExtract = function(items, url, spiderId) {
    var self = this;
    var urls = [];
    if (items.links) {
        items.links.forEach(function(link) {
            try {
                var toLower = link.url.toLowerCase();
                if (toLower.substr(0, 7) !== "mailto:") {
                    urls[normalizeUrl(urlModule.resolve(
                        url,
                        link.url))] = true;
                }
            } catch (err) {
                self.emit("error", new Error(
                    "normalizing (url: %j, link:%j)", url,
                    link));
            }
        });
    }
    delete items.links;
    self.push({
        url: url,
        items: items
    });
    Object.getOwnPropertyNames(urls)
        .forEach(function(url) {
            self.handleUrl(url, spiderId);
        });
};

Crawler.prototype.handleUrl = function(url, spiderId) {
    var promises = [];
    var spider = this.spiders[spiderId];
    var self = this;
    promises.push(spider.isLinkUrl(url));
    promises.push(spider.isExtractUrl(url));
    Promise
        .all([
            spider.isLinkUrl(url),
            spider.isExtractUrl(url)
        ])
        .then(function(results) {
            logger.debug(
                "%s (isLink: %d, isExtract: %d)",
                url,
                results[0],
                results[1]
            );
            // If url is link or extract url
            if (results[0] || results[1]) {
                self.download({
                    "url": url,
                    "context": {
                        "spiderId": spiderId
                    }
                });
            }
            return results;
        })
        .catch(function(err) {
            self.emit("error", new Error(err));
        });
};

module.exports = Crawler;
