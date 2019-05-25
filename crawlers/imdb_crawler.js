const Crawler = require('crawler')
class CrawlerImdb {
  constructor (imdbId) {
    this.imdb_id = imdbId
    //this.title
    //this.audience
    //this.imdb_rate
    //this.metacritic_score
    //this.image
    //this.trailer_link
    //this.description
    //this.long_description
    //this.runtime
    //this.release_date
    //this.keywords
    //this.original_language
    this.additional_titles = []
    this.directors = []
    this.categories = []
    this.companies = []
    this.countries = []
    this.languages = []
    this.actors = []
    this.writers = []
  }

  getImdbData (callback) {
    console.log('Start Crawler --> '+Date())
    let isFinishBasics = false;
    let isFinishDetails = false;

    const finishBasics = () => {
      isFinishBasics = true;
      if (isFinishDetails) {
        finish();
      }
    }
    const finishDetails = () => {
      isFinishDetails = true;
      if (isFinishBasics) {
        finish();
      }
    }

    const finish = () => {
      console.log('Finish Crawler --> '+Date())
      callback(this)
    }

    var mainCrawler = new Crawler({
      maxConnections: 10,
      // This will be called for each crawled page
      callback: (error, res, done) => {
        if (error) {
          console.log(error)
        } else if (res.statusCode === 404) {
          return console.log(JSON.stringify(res))
        } else {
          let $ = res.$
          let seasonLength = $("div.seasons-and-year-nav div>a[href*='?season=']").length;
          if (seasonLength > 0) { // TV Series Field
            callback('Movie dışında bir Id girdiniz.')
          }else { // Movie Fields
            getMovieDetails(res);
          }
          
        }
        done()
      }
    })

    mainCrawler.queue('http://www.imdb.com/title/' + this.imdb_id)

    
    const getMovieDetails = (res) => {
      try {
        let $ = res.$
        try {
          var pageObj = JSON.parse($('script[type="application/ld+json"]').text())
        } catch (err) {
          return console.log('Some information is missing on page.')
        }
        
        /* Movie Title */
        this.title = pageObj.name.trim();
        /* Movie Audience */
        this.audience = $('.title_block .title_wrapper .subtext').text().split('|')[0].trim();
        /* Movie IMDB Rate */
        this.imdb_rate = $("span[itemprop='ratingValue']").text().trim();
        /* Movie IMDB Rate */
        this.meta_score = $('.metacriticScore').length > 0 ? $('.metacriticScore').text().trim() : "";
        /* Movie Image */
        this.image = $("meta[property='og:image']").attr('content').indexOf('imdb_fb_logo') < 0 ? $("meta[property='og:image']").attr('content') : '';
        /* Movie Trailer */
        this.trailer_link = pageObj.trailer ? 'https://www.imdb.com'+pageObj.trailer.embedUrl : '';
        /* Movie Description */
        this.description = $('.plot_summary_wrapper .summary_text').text().trim().length > 15 ? $('.plot_summary_wrapper .summary_text').text().trim() : '';
        /* Movie Long Description */
        this.long_description = $('#titleStoryLine .inline.canwrap p span').text().trim();
        /* Movie Run Time */
        this.runtime = $('.title_block .title_wrapper .subtext time').text().trim();
        /* Movie Release Date */
        this.release_date = pageObj.datePublished.trim();
        /* Movie Original Language */
        this.original_language = $('#titleDetails .txt-block:contains(Language:) a').eq(0).text().trim();
        
        /* Movie Keywords [Array] */
        this.keywords = pageObj.keywords ? pageObj.keywords.split(',') : [];

        /* Movie Directors */
        $('.plot_summary_wrapper .credit_summary_item:contains(Directors:) a,.plot_summary_wrapper .credit_summary_item:contains(Director:) a').each((index, element) => {
          if ($(element).text().indexOf('more credit') < 0) {
            this.directors.push($(element).text().trim());
          }
        })

        /* Movie Categories */
        $('#titleStoryLine div:contains(Genres:) a').each((index, element) => {
          this.categories.push($(element).text().trim());
        })

        /* Movie Companies */
        $('#titleDetails .txt-block:contains(Production Co:) a').each((index, element) => {
          if ($(element).text() !== "See more" && $(element).text() !== "see more" && $(element).text() !== "See More") {
            this.companies.push($(element).text().trim());
          }
        })

        /* Movie Countries */
        $('#titleDetails .txt-block:contains(Country:) a').each((index, element) => {
          this.countries.push($(element).text().trim());
        })

        /* Movie Languages */
        $('#titleDetails .txt-block:contains(Language:) a').each((index, element) => {
          this.languages.push($(element).text().trim());
        })

        /* Movie Writers */
        $('.plot_summary_wrapper .credit_summary_item:contains(Writers:) a').each((index, element) => {
          if ($(element).text().indexOf('more credit') < 0) {
            this.writers.push($(element).text().trim());
          }
        })

        /* Movie Actors */
        $('#titleCast .character').each((index, element) => {
          var thisItem = $(element).parent()
          var thisObj = {
            'id': thisItem.find('a').attr('href').split('name/')[1].split('/')[0],
            'name': thisItem.find('.primary_photo img').attr('title'),
            'character': thisItem.find('.character a.toggle-episodes').length > 0 && thisItem.find('.character a:not(.toggle-episodes)').length > 0 ? thisItem.find('.character a:not(.toggle-episodes)').text().trim().replace(/\  /g, '').replace(/[\r\n]+/g, '').replace(' /', '/').replace('/ ', '/').replace(' / ', '/').replace('/',' / ') : thisItem.find('.character').text().trim().replace(/\  /g, '').replace(/[\r\n]+/g, '').replace(' /', '/').replace('/ ', '/').replace(' / ', '/').replace('/',' / '),
          }
          this.actors.push(thisObj);
        })

        // Crawl the details page of Movie for the additional titles
        const moreDetails = new Crawler ({
          maxConnections: 10,
          callback: (error, res, done) => {
            if (error) {
              console.log(error)
            } else {
              var $ = res.$
              
              /* Movie Additional Titles */
              $('.aka-item .aka-item__title').each((index, element) => {
                var thisTitle = $(element).text().trim();
                if (this.additional_titles.indexOf(thisTitle) < 0) {
                  this.additional_titles.push(thisTitle);
                }
              })
              
            }
            done()
          }
        })
        moreDetails.queue('https://www.imdb.com/title/' + this.imdb_id + '/releaseinfo')

        moreDetails.on('drain', () => {
          finishDetails()
        })
      }catch (err) {
        console.log(err.toString())
      }
    }
    
    // when all requests are completed
    mainCrawler.on('drain', () => {
      finishBasics()
    })
  }

}

module.exports = CrawlerImdb
