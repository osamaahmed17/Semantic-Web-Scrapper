# node-semantic-scraper

## Install
```
npm install --save "@petitchevalroux/semantic-scraper"
```

## Sample spider extracting articles from a website
### Code
```javascript
var scraper = require("@petitchevalroux/semantic-scraper");
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
        process.stdout.write("data:" + JSON.stringify(data, null, 2)+"\n");
    })
    .on("error", function(error) {
        process.stdout.write("error:" + JSON.stringify(error, null, 2)+"\n");
    });
```
### Output
```
data:{
  "url": "http://dev.petitchevalroux.net/index.html",
  "items": {
    "articles": [
      {
        "url": "/php/passer-une-variable-environnement-php-via-php-fpm.408.html",
        "title": "Passer une variable d'environnement à php via php-fpm"
      },
      {
        "url": "/linux/docker-elk-redis-premiere-installation-linux.407.html",
        "title": "Docker, Elk et Redis, première installation"
      },
      {
        "url": "/mysql/comment-sauvegarder-votre-mot-passe-mysql-mysql.406.html",
        "title": "Comment sauvegarder votre mot de passe mysql"
      },
      {
        "url": "/linux/wheezy-impossible-ajouter-vpn-linux.405.html",
        "title": "Wheezy : Impossible d'ajouter un VPN "
      },
      {
        "url": "/hebergement/comparatif-vps-2013-test.404.html",
        "title": "Comparatif VPS 2013 : Le test"
      },
      {
        "url": "/hebergement/test-vps-pulseheberg.403.html",
        "title": "Test du VPS Pulseheberg"
      },
      {
        "url": "/hebergement/test-vps-be1host.402.html",
        "title": "Test du VPS Be1Host"
      },
      {
        "url": "/hebergement/test-vps-ikoula-flexicloud-2013.401.html",
        "title": "Test du VPS Ikoula Flexicloud 2013"
      },
      {
        "url": "/hebergement/test-vps-firstheberg-2013.400.html",
        "title": "Test VPS Firstheberg 2013"
      },
      {
        "url": "/hebergement/test-vps-ovh-2013.399.html",
        "title": "Test du VPS OVH 2013"
      }
    ]
  }
}
```
