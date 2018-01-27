const config = require('../config');
const hostName = 'http://' + config.target.domain;
const cheerio = require('cheerio');

function isValidPageLink(href){
  const omitList = [
    'mailto',
    '.jpg',
    '.pdf',
    '.rss',
    '.php'
  ];

  return href.length && 
        (href.startsWith('/') || href.includes(hostName)) && 
        !omitList.some(o => href.includes(o));
}


function ensureFullPath(href){
    if(href.startsWith('/')){
        return hostName + href;
    }
    return href;
}


function extractPageLinks(html){  
  const $ = new cheerio.load(html);
  const pageLinks = $('a').toArray();
  return pageLinks;
}

function digestRawHTML(html){
  let pageLinks = extractPageLinks(html);
  return pageLinks
    .filter(e => e.attribs && e.attribs.href)
    .map(e => e.attribs.href)
    .filter(isValidPageLink)
    // .map(ensureFullPath)
}

module.exports = digestRawHTML;