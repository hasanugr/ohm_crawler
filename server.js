const CrawlerImdb = require('./crawlers/imdb_crawler')
var express = require('express')
var app = express();

app.use(express.static(__dirname + '/'));

app.get('/api/getImdbData', function (req, res) {
  if (req.query.imdbId) {
    let imdbCode = req.query.imdbId
    let imdbCrawler = new CrawlerImdb(imdbCode)

    imdbCrawler.getImdbData(function (data) {
      res.status(200)
          .send(data);
    })
  } else {
    res.status(304)
      .send("IMDB Id'si giriniz.");
  }
});

app.get('/api/getImdbSearchResults', function (req, res) {
  if (req.query.searchName) {
    slugify = function(text) {
      var trMap = {
          'çÇ':'c',
          'ğĞ':'g',
          'şŞ':'s',
          'üÜ':'u',
          'ıİ':'i',
          'öÖ':'o'
      };
      for(var key in trMap) {
          text = text.replace(new RegExp('['+key+']','g'), trMap[key]);
      }
      return  text.replace(/[^-a-zA-Z0-9\s]+/ig, '') // remove non-alphanumeric chars
                  .replace(/\s/gi, "_") // convert spaces to dashes
                  .replace(/[-]+/gi, "-") // trim repeated dashes
                  .toLowerCase();
    }

    let searchName = slugify(req.query.searchName)
    var https = require('https');
    var options = {
      'method': 'GET',
      'hostname': 'v2.sg.media-imdb.com',
      'path': '/suggestion/'+searchName[0]+'/'+searchName+'.json',
      'headers': {
      }
    };

    var req = https.request(options, function (res) {
      var chunks = [];
      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function (chunk) {
        var body = Buffer.concat(chunks);
        body = JSON.parse(body.toString());
        createResponseObject(body);
      });

      res.on("error", function (error) {
        console.error(error);
      });
    });
    req.end();

    function createResponseObject(obj) {
      var searchResponse = []
      for (var i = 0 ; i < obj.d.length ; i++) {
        var thisItem = obj.d[i];
        var thisObject = {
          id: thisItem.id,
          name: thisItem.l,
          image: typeof thisItem.i !== "undefined" ? thisItem.i.imageUrl : "",
          year: typeof thisItem.y !== "undefined" ? (thisItem.y).toString() : ""
        }
        searchResponse.push(thisObject);
      }
      finish(searchResponse);
    }

    function finish(searchResponse) {
      res.status(200)
        .send(searchResponse);
    }

  }else {
    res.status(304)
      .send("Sorgulanacak film ismi girediniz.")
  }
})

app.listen(process.env.PORT || 3000, function () {
  console.log('Russian Paradise Bithes');
});