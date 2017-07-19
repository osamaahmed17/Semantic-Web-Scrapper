"use strict";
var path = require("path");
var assert = require("assert");
var Spider = require(path.join(__dirname, "..", "src", "spiders", "regex"));

describe("Regex Spider", function() {
    describe("getHostDepth", function() {
        var spider = new Spider(
            "https://en.wikipedia.org/wiki/Googlebot");
        it("return host depth", function() {
            return spider.getHostDepth(
                    "en.wikipedia.org"
                )
                .then(function(result) {
                    assert.equal(result, 0);
                    return result;
                });
        });
    });

    describe("setHostDepth", function() {
        var spider = new Spider(
            "https://en.wikipedia.org/wiki/Googlebot");
        it("set host depth", function() {
            return spider
                .setHostDepth(
                    "en.wikipedia.org",
                    42)
                .then(function(result) {
                    assert.equal(result, 42);
                    return spider.getHostDepth(
                        "en.wikipedia.org"
                    );
                })
                .then(function(result) {
                    assert.equal(result, 42);
                    return result;
                })
                .then(function() {
                    return spider.getHostDepth(
                        "www.google.com"
                    );
                })
                .then(function(result) {
                    assert.equal(result, 0);
                    return result;
                });
        });

        it("don't overide host depth", function() {
            return spider
                .setHostDepth(
                    "fr.wikipedia.org",
                    47)
                .then(function(result) {
                    assert.equal(result, 47);
                    return spider.getHostDepth(
                        "fr.wikipedia.org"
                    );
                })
                .then(function(result) {
                    assert.equal(result, 47);
                    return result;
                })
                .then(function() {
                    return spider.setHostDepth(
                        "fr.wikipedia.org",
                        88);
                })
                .then(function(result) {
                    assert.equal(result, 47);
                    return spider.getHostDepth(
                        "fr.wikipedia.org"
                    );
                })
                .then(function(result) {
                    assert.equal(result, 47);
                    return result;
                });
        });
    });

});
