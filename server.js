const CrawlerImdb = require('./crawlers/imdb_crawler')
var express = require('express')
var app = express();

app.use(express.static(__dirname + '/'));

app.get('/api/getImdbData', function (req, res) {
  console.log('Start --> '+Date())
  if (req.query.imdbId) {
    let imdbCode = req.query.imdbId
    let imdbCrawler = new CrawlerImdb(imdbCode)

    imdbCrawler.getImdbData(function (data) {
      res.status(200)
          .send(data);
      console.log('End --> '+Date())
    })
  } else {
    res.status(304)
      .send("IMDB Id'si giriniz.");
  }
});

app.listen(process.env.PORT || 3000, function () {
  console.log('Russian Paradise Bithes');
});