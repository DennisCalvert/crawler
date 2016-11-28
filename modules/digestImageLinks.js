const redis = require('./Redis');

// domNode :
function digestImageLinks(ImgHtmlDomElms){

  // string :
  function digestImageLink(url){
    console.log('caching: ', url);
    // If we can determine that the image has been scaled down,
    // let's try to recover the original resolution
    // we are testing for the pressence of wordpress style
    // naming convention for resized images. 
    // The regex could be expanded to look for more in the future
    const isCropped = /-\d+x\d+/.test(url);
    if(isCropped){
      var rangeStart = url.lastIndexOf('-');
      var rangeEnd = url.lastIndexOf('.');
      var fullResImageURL = url.substring(0, rangeStart) + url.substring(rangeEnd);
      digestImageLink(fullResImageURL);
    }

    let r = new redis();
    r.addImgLink(url);
  }

  ImgHtmlDomElms
  // If we don't filter on image host, we can collect all
  // and then make an educated guess as to what the image
  // host is by looking for the host which is most often used
  .filter(img => img.attribs && img.attribs.src && img.attribs.src.includes('205photo'))
  //.filter(img => img.attribs && img.attribs.src)
  .map(img => img.attribs.src)
  .forEach(digestImageLink);
}

module.exports = digestImageLinks;