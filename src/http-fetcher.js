"use strict";
var Transform = require("stream")
    .Transform;
var util = require("util");
var RateLimiter = require("limiter")
    .RateLimiter;
var Error = require("@petitchevalroux/error");
var path = require("path");
var logger = require(path.join(__dirname, "logger"));

function HttpFetcherStream(options) {
    if (!(this instanceof HttpFetcherStream)) {
        return new HttpFetcherStream(options);
    }
    this.options = options || {};
    this.options.objectMode = true;
    this.httpClient = options.httpClient;
    delete options.httpClient;
    Transform.call(this, this.options);
    this.limiter = new RateLimiter(5, 10000);
}
util.inherits(HttpFetcherStream, Transform);

HttpFetcherStream.prototype._transform = function(chunk, encoding, callback) {
    var self = this;
    self.limiter.removeTokens(1, function(err) {
        if (err) {
            callback(err);
            return;
        }
        logger.debug("downloading (url: %s)", chunk.url);
        self.httpClient.get(chunk.url, function(err, response, body) {
            if (err) {
                callback(new Error(
                    "Unable to download (chunk: %j)",
                    chunk, err));
            } else if (response.statusCode !== 200) {
                callback(new Error(
                    "Non 200 http status (response: %j)",
                    response));
            } else {
                callback(null, {
                    "url": chunk.url,
                    "context": chunk.context,
                    "body": body,
                    "headers": response.headers
                });
            }
        });
    });
};


module.exports = HttpFetcherStream;
