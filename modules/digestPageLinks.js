const config = require('../config');
const domainName = config.target.domain;
const cheerio = require('cheerio');
const log = require('./log');

function isValidPageLink(href){
  const omitList = [
    'mailto',
    '.jpg',
    '.pdf',
    '.rss',
    '.php'
  ];

  return href.length && href !== '/' &&
        (href.startsWith('/') || href.startsWith(domainName)) && 
        !omitList.some(o => href.includes(o));
}


function ensureFullPath(href){
    if(href.startsWith('/')){
        return domainName + href;
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
  log.debug('[[digestPageLinks]]::digestRawHTML::', pageLinks);
  return pageLinks
    .filter(e => e.attribs && e.attribs.href && e.attribs.href.length > 0)
    .map(e => e.attribs.href)
    .filter(isValidPageLink)
    .map(ensureFullPath)
}

module.exports = digestRawHTML;