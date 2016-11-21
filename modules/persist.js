const redis = require('./modules/Redis');
const cheerio = require('cheerio');

function digestImageLinks(imageLinks){

  imageLinks.forEach(function(img){
    const includeFile = img.attribs && 
                        img.attribs.src && 
                        img.attribs.src.includes(hostName);

    if(includeFile){
      let r = new redis();
      r.addImgLink(img.attribs.src);
    }
  });
}

function isValidPageLink(href){
  const omitList = [
    'mailto',
    '.jpg',
    '.pdf',
    '.rss',
    '.php'
  ];

  return href.includes(hostName) && !omitList.some(o => href.includes(o));
}

function cacheLink(href){
  if(!linkRepository.includes(href)){
    linkRepository.push(href);
  }
	//let r = new redis();
	//return r.addPageLink(href);
}

function digestPageLinks(pageLinks){
  return pageLinks.filter(e => e.attribs && e.attribs.href)
    .map(e => e.attribs.href)
    .filter(isValidPageLink)
    .map(cacheLink);
}

function analyze(rawData){
  const $ = new cheerio.load(rawData);

  const imageLinks = $('img').toArray();
  digestImageLinks(imageLinks);

  const pageLinks = $('a').toArray(); //jquery get all hyperlinks
  digestPageLinks(pageLinks);
  return;
}

module.exports = analyze;