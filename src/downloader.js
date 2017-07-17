"use strict";

var Transform = require("stream")
    .Transform;
var util = require("util");
var Promise = require("bluebird");
var request = require("request");
var urlModule = require("url");
var path = require("path");
var HttpFetcher = require(path.join(__dirname, "http-fetcher"));
var Error = require("@petitchevalroux/error");

function Downloader(options) {
    if (!(this instanceof Downloader)) {
        return new Downloader(options);
    }
    this.options = Object.assign({
        "timeout": 5000
    }, options || {});
    this.httpClient = request.defaults({
        "timeout": this.options.timeout,
        "gzip": true,
        "headers": {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:49.0) Gecko/20100101 Firefox/49.0"
        }
    });

    this.HttpFetcher = this.options.HttpFetcher ?
        this.options.HttpFetcher : HttpFetcher;

    Transform.call(this, {
        "objectMode": true
    });
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
        var options = self.options;
        options.httpClient = self.httpClient;
        self.hostStreams[host] = new self.HttpFetcher(options);
        self.hostStreams[host]
            .on("data", function(chunk) {
                self.push(chunk);
            })
            .on("error", function(err) {
                self.emit("error", new Error(
                    "host stream (host:%s)", host, err));
            })
            .on("http:response", function(response) {
                self.emit("http:response", response);
            })
            .on("http:error", function(err) {
                self.emit("http:error", err);
            });
        resolve(self.hostStreams[host]);
    });
};

module.exports = Downloader;
