const cheerio = require('cheerio');
const bluebird = require('bluebird');

function extractPageContent(html){  
  const $ = new cheerio.load(html);
  return $('#content').html();
}


function copyPageContnet(redisSvc){
  return redisSvc.pageLinks.get().then(pageLinkArray => {
    const promiseArray = pageLinkArray.map(url => {
      return httpGet(url)
    })
    return bluebird.all(promiseArray)
  })
  // get content of page
  .then(contentArray => contentArray.map(htmlPage => digestRawHTML(htmlPage)))
  // .then(console.log)
  // .then(console.log)
}


module.exports = copyPageContnet;