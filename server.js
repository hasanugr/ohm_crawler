const CrawlerImdb = require('./crawlers/imdb_crawler')
const CrawlerGetList = require('./crawlers/imdb_getList')
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
        body = JSON.parse(body.toString())
        createResponseObject(body);
      });

      res.on("error", function (error) {
        console.error(error);
      });
    });
    req.end();

    function createResponseObject(obj) {
      var searchResponse = []
      if (obj.d) {
        for (var i = 0 ; i < obj.d.length ; i++) {
          var thisItem = obj.d[i];
          if (thisItem.id.slice(0,2) === "tt") {
            var thisObject = {
              id: thisItem.id,
              name: thisItem.l,
              image: typeof thisItem.i !== "undefined" ? thisItem.i.imageUrl : "",
              year: typeof thisItem.y !== "undefined" ? (thisItem.y).toString() : ""
            }
            searchResponse.push(thisObject);
          }
        }
        finish(searchResponse);
      }else {
        res.status(304)
          .send("Sonuç bulunamadı.")
      }
    }

    function finish(searchResponse) {
      res.status(200)
        .send(searchResponse);
    }

  }else {
    res.status(304)
      .send("Sorgulanacak film ismi girediniz.")
  }
});

app.get('/api/getMovieList', function (req, res) {
  if (req.query.genre && req.query.year && req.query.quantity) {
    let queryList = {
      genre: req.query.genre,
      year: req.query.year,
      quantity: parseInt(req.query.quantity),
      failedIds: []
    }
    let imdbGetList = new CrawlerGetList(queryList)

    imdbGetList.getImdbData(function (getListData) {
      queryList["moviesDetails"] = [];
      let failedCount = 0;
      let imdbIdList = getListData.imdb_idList;
      imdbIdList.forEach(element => {
        let imdbCrawler = new CrawlerImdb(element)
        imdbCrawler.getImdbData(function (data) {
          if (data.status === "Success") {
            queryList["moviesDetails"].push(data);
          }else {
            queryList.failedIds.push(data.id);
            failedCount++;
          }
          if (queryList["moviesDetails"].length === (imdbIdList.length - failedCount)) {
            queryList.quantity = queryList.quantity - failedCount;
            res.status(200)
              .send(queryList)
          }
        })
      });
      
    })
  }else {
    res.status(304)
      .send("Eksik bilgi girdiniz")
  }
});

app.listen(process.env.PORT || 3000, function () {
  console.log('Russian Paradise Bithes');
});