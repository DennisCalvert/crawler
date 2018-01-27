const redis = require('../Redis');
const $Q = require('Q');
const cheerio = require('cheerio');
const config = require('../../config');

// domNode :
function digestImageLinks(rawHTML){

  let r = new redis(); 

  function extractImgLinks(html){
    const $ = new cheerio.load(html);
    const imgLinks = $('img').toArray();
    return imgLinks;
  }

  function imageLinkArrayReducer(urlList, url){
    // console.log('caching: ', url);
    

    if(url.startsWith('/')){
      url = config.target.domain + url;  
    }

    // If we can determine that the image has been scaled down,
    // let's try to recover the original resolution
    // we are testing for the pressence of wordpress style
    // naming convention for resized images. 
    // The regex could be expanded to look for more in the future
    const isCropped = /-\d+x\d+/.test(url);
    if(isCropped){
      const rangeStart = url.lastIndexOf('-');
      const rangeEnd = url.lastIndexOf('.');
      const fullResImageURL = url.substring(0, rangeStart) + url.substring(rangeEnd);
      urlList.push(r.addImgLink(fullResImageURL))
    }
    return urlList.concat(r.addImgLink(url))
  }

  // Resolves an array of promises
  return $Q.all(extractImgLinks(rawHTML)
    // If we don't filter on image host, we can collect all
    // and later make an educated guess as to what the image
    // host is by looking for the host which is most often used
    //.filter(img => img.attribs && img.attribs.src && img.attribs.src.includes(config.taget.imageHost))
    .filter(img => img.attribs && img.attribs.src)
    .map(img => img.attribs.src)
    .filter(src => src.includes('.jpg'))
    .reduce(imageLinkArrayReducer, [])
  );
}

module.exports = digestImageLinks;