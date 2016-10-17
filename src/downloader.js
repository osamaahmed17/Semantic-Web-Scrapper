"use strict";

var Transform = require("stream")
    .Transform;
var util = require("util");
var Promise = require("bluebird");
var request = require("request");
var urlModule = require("url");
var path = require("path");
var HttpFetcher = require(path.join(__dirname, "http-fetcher"));
var logger = require(path.join(__dirname, "logger"));

function Downloader(options) {
    if (!(this instanceof Downloader)) {
        return new Downloader(options);
    }
    this.options = options || {};
    this.httpClient = request.defaults({
        "timeout": 5000,
        "gzip": true,
        "headers": {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:49.0) Gecko/20100101 Firefox/49.0"
        }
    });

    this.options.objectMode = true;
    Transform.call(this, this.options);
}

util.inherits(Downloader, Transform);

Downloader.prototype._transform = function(chunk, encoding, callback) {
    var host = urlModule.parse(chunk.url)
        .hostname;
    this.getHostStream(host)
        .then(function(stream) {
            stream.write(chunk);
            callback();
            return chunk;
        })
        .catch(function(err) {
            callback(err);
        });
};

Downloader.prototype.hostStreams = {};

Downloader.prototype.getHostStream = function(host) {
    if (typeof(this.hostStreams[host]) !== "undefined") {
        var self = this;
        return new Promise(function(resolve) {
            resolve(self.hostStreams[host]);
        });
    }
    return this.createHostStream(host);
};

Downloader.prototype.createHostStream = function(host) {
    var self = this;
    return new Promise(function(resolve) {
        self.hostStreams[host] = new HttpFetcher({
            "httpClient": self.httpClient
        });
        self.hostStreams[host]
            .on("data", function(chunk) {
                self.push(chunk);
            })
            .on("error", function(err) {
                logger.error(err);
            });
        resolve(self.hostStreams[host]);
    });
};

module.exports = Downloader;
