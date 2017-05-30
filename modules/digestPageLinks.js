const redis = require('./Redis');
const config = require('../config');
const hostName = 'http://' + config.target.domain;

let linkList = [];

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

function cacheLink(href){
    const r = new redis();
    return r.addPageLink(href);
}

function deDupe(link){
    if(linkList.includes(link)){
        return false;
    } else {
        linkList.push(link);
        return true;
    }
}

function digestPageLinks(pageLinks){
  return pageLinks
    .filter(e => e.attribs && e.attribs.href)
    .map(e => e.attribs.href)
    .filter(isValidPageLink)
    // .map(ensureFullPath)
    .filter(deDupe);
}

module.exports = digestPageLinks;