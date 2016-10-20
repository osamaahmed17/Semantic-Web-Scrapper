"use strict";
var path = require("path");
var assert = require("assert");
var Extractor = require(path.join(__dirname, "..", "src", "extractors",
    "cheerio"));


describe("Cheerio Extractor", function() {
    describe("extract links from html", function() {
        var html =
            "<a href='http://exemple.com'>Hello world</a>" +
            "<a href='http://exemple.com/2'>C</a>";
        var extractor = new Extractor();
        extractor.on("data", function(data) {
            it("return array of links", function(done) {
                assert.equal(data.items.links.length,
                    2);
                done();
            });
            it("return url of links", function(done) {
                assert.equal(data.items.links[0]
                    .url,
                    "http://exemple.com");
                assert.equal(data.items.links[1]
                    .url,
                    "http://exemple.com/2");
                done();
            });
            it("return anchor of links", function(done) {
                assert.equal(data.items.links[0]
                    .anchor, "Hello world");
                assert.equal(data.items.links[1]
                    .anchor, "C");
                done();
            });
            it("return context", function(done) {
                assert.equal(data.context,
                    "foo");
                done();
            });
        });
        extractor.write({
            "mapping": [{
                "type": "links",
                "selector": "a",
                "properties": {
                    "url": {
                        "from": "attribute",
                        "name": "href"
                    },
                    "anchor": {
                        "from": "text"
                    }
                }
            }],
            "content": html,
            "context": "foo"
        });
    });

    describe("extract properties from html", function() {
        var html =
            "<html><body><h1>Foo title</h1><dl><dt>feature 1 </dt>" +
            "<dd>value 1</dd><dt>feature 2</dt><dd>value 2</dd>" +
            "<dt>feature 3</dt><dd>value 3</dd></dl></body></html>";
        var extractor = new Extractor();
        extractor.on("data", function(data) {
            it(
                "return values from properties with selector",
                function(done) {
                    assert.equal(data.items.objects[
                            0].feature2,
                        "value 2");
                    assert.equal(data.items.objects[
                            0].feature1,
                        "value 1");
                    done();
                });
        });
        extractor.write({
            "mapping": [{
                "type": "objects",
                "selector": "dl",
                "properties": {
                    "feature2": {
                        "selector": ":nth-child(4)",
                        "from": "text"
                    },
                    "feature1": {
                        "selector": ":nth-child(2)",
                        "from": "text"
                    }
                }
            }],
            "content": html,
            "context": "foo"
        });
    });

    describe("transform properties", function() {
        var html =
            "<html><body>" +
            "<h1>  &lt;&gt;&quot;&amp;&copy;&#8710;    </h1>" +
            "<p class='whitespace'>\n\t\u00A0\r\f \nfoo\n\t\u00A0\r\f \nfoo\n\n\t\u00A0\r\f </p>" +
            "</body></html>";
        var extractor = new Extractor();
        extractor.on("data", function(data) {
            it(
                "return trimmed property with decoded entities",
                function(done) {
                    assert.equal(
                        data.items.objects[0].feature,
                        "<>\"&©∆"
                    );
                    assert.equal(
                        data.items.objects[0].whitespace,
                        "foo\nfoo"
                    );
                    done();
                });
        });
        extractor.write({
            "mapping": [{
                "type": "objects",
                "selector": "body",
                "properties": {
                    "feature": {
                        "selector": "h1",
                        "from": "text",
                        "transforms": [
                            "trim",
                            "entities"
                        ]
                    },
                    "whitespace": {
                        "selector": ".whitespace",
                        "from": "text",
                        "transforms": [
                            "normalizeWhitespace"
                        ]
                    }
                }
            }],
            "content": html,
            "context": "foo"
        });
    });

});
