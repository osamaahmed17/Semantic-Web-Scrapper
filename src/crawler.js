"use strict";
var Promise = require("bluebird");
var urlModule = require("url");
var normalizeUrl = require("normalize-url");
var uniqueStream = require("unique-stream");
var Error = require("@petitchevalroux/error");
var path = require("path");
var logger = require(path.join(__dirname, "logger"));
var {
    Duplex,
    PassThrough,
    Writable
} = require("stream");
var DownloadStream = require("@petitchevalroux/http-download-stream")
    .Stream;
var util = require("util");

var Crawler = function(options) {
    if (!(this instanceof Crawler)) {
        return new Crawler(options);
    }
    var self = this;
    self.options = options || {};
    Duplex.call(self, {
        "objectMode": true
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
                            self.emit("error", new Error(
                                "extractor stream (spiderId:%d)",
                                spiderId, err));
                        });
                    return spider.getStartUrl();
                })
                .then(function(url) {
                    return {
                        "url": url,
                        "spiderId": spiderId
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
    this.getDownloadStream(chunk.spiderId)
        .write(chunk.url);
};

Crawler.prototype.getDownloadStream = function(spiderId) {
    if (!this.downloadStreamMap) {
        this.downloadStreamMap = new Map();
    }
    if (!this.downloadStreamMap.has(spiderId)) {
        const self = this;
        const downloadStream = new PassThrough();
        downloadStream
            .pipe(uniqueStream())
            .pipe(new DownloadStream())
            .pipe(new Writable({
                objectMode: true,
                write: (chunk, encoding, callback) => {
                    self.handleDownload(
                        chunk.output.body,
                        chunk.output.headers,
                        chunk.input,
                        spiderId);
                    callback();
                }
            }));
        this.downloadStreamMap.set(spiderId, downloadStream);
    }
    return this.downloadStreamMap.get(spiderId);
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
                if (typeof(link.url) === "string") {
                    var toLower = link.url.toLowerCase();
                    if (toLower.substr(0, 7) !== "mailto:") {
                        urls[normalizeUrl(urlModule.resolve(
                            url,
                            link.url))] = true;
                    }
                }
            } catch (err) {
                self.emit("error", new Error(
                    "normalizing (url: %j, link:%j)", url,
                    link, err));
            }
        });
    }

    var spider = this.spiders[spiderId];
    spider.isExtractUrl(url)
        .then(function(isExtract) {
            delete items.links;
            if (isExtract) {
                self.push({
                    url: url,
                    items: items
                });
            }
            return isExtract;
        })
        .catch(function(err) {
            self.emit(
                "error",
                new Error("isExtract (url: %s)", url, err)
            );
        });
    Object.keys(urls)
        .forEach(function(linkUrl) {
            self.handleUrl(linkUrl, spiderId, url);
        });
};

Crawler.prototype.handleUrl = function(url, spiderId, contextUrl) {
    var spider = this.spiders[spiderId];
    var self = this;
    Promise
        .all([
            spider.isLinkUrl(url, contextUrl),
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
                    "spiderId": spiderId
                });
            }
            return results;
        })
        .catch(function(err) {
            self.emit("error", new Error("handleUrl (url:%s)", url, err));
        });
};

module.exports = Crawler;
