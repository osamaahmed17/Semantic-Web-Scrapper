"use strict";
var path = require("path");
var assert = require("assert");
var Spider = require(path.join(__dirname, "..", "src", "spiders", "default"));

describe("Default Spider", function() {
    describe("getStartUrl", function() {
        var spider = new Spider("http://example.com/");
        it("return start url", function(done) {
            spider.getStartUrl()
                .then(function(url) {
                    assert.equal(url,
                        "http://example.com/");
                    done();
                    return url;
                })
                .catch(function(err) {
                    assert(err);
                    done();
                });
        });

    });

    describe("isLinkUrl", function() {
        var spider = new Spider("http://example.com/");
        it("return true if same domain", function(done) {
            spider.isLinkUrl("http://example.com/foo")
                .then(function(value) {
                    assert.equal(value, true);
                    done();
                    return value;
                })
                .catch(function(err) {
                    done();
                    assert.equal(err, false);
                });

        });

        it("return false if not the same domain", function(done) {
            spider.isLinkUrl("sample.com/foo")
                .then(function(value) {
                    assert.equal(value, false);
                    done();
                    return value;
                })
                .catch(function(err) {
                    done();
                    assert.equal(err, false);
                });
        });
    });
});
