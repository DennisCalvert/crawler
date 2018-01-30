const cheerio = require('cheerio');
const log = require('../log');

function isValidPageLink(href){
  const omitList = [
    'mailto',
    '.jpg',
    '.png',
    '.pdf',
    '.rss',
    '.php',
    '?share=',
    '/#',
    '#',
    '.docx',
    '.doc'
  ];

  return href.length && href !== '/' &&
        (href.startsWith('/') || href.startsWith('http')) && 
        href.split('http').length > 2 === false &&
        !omitList.some(o => href.includes(o));
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
    .filter(isValidPageLink);
}

module.exports = digestRawHTML;