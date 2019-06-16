const Crawler = require('crawler')
class CrawlerGetList {
  constructor (queryList) {
    this.queryList = queryList;
    this.imdb_idList = []
  }

  getImdbData (callback) {
    let thatsAll = false; // Founded all possible datas

    var listCrawler = new Crawler({
      maxConnections: 10,
      // This will be called for each crawled page
      callback: (error, res, done) => {
        if (error) {
          console.log(error)
        } else if (res.statusCode === 404) {
          return console.log(JSON.stringify(res))
        } else {
          let $ = res.$
          if ($('.desc .next-page').length === 0) {
            thatsAll = true;
          }

          $('.article .lister .lister-item').each((index, element) => {
            this.imdb_idList.push($(element).find('a').eq(0).attr('href').split('title/')[1].split('/')[0]);
          })
          
        }
        done()
      }
    })

    listCrawler.queue('https://www.imdb.com/search/title/?title_type=feature&view=simple&genres=' + this.queryList.genre + '&year=' + this.queryList.year)
    
    // when all requests are completed
    listCrawler.on('drain', () => {
      if (this.imdb_idList.length >= this.queryList.quantity || thatsAll) {
        this.imdb_idList = this.imdb_idList.slice(0,this.queryList.quantity);
        callback(this);
      }else if (!thatsAll) {
        listCrawler.queue('https://www.imdb.com/search/title/?title_type=feature&view=simple&genres=' + this.queryList.genre + '&year=' + this.queryList.year + '&start=' + (this.imdb_idList.length+1).toString())
      }
    })
  }

}

module.exports = CrawlerGetList
