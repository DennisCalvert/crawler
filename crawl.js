const redis = require('./modules/Redis');
const fetchData = require('./modules/httpFetch');
const cheerio = require('cheerio');
const config = require('./config');

const hostName = config.hostName; 
const imageLinkRepository = [];
const linkRepository = ['/'];
let linkRepositoryIndex = 0;

function store(data){
	var r = new redis();
  return r.cache(data);
}

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

function main(){
  let path = (linkRepository.length === 1) ? linkRepository[linkRepositoryIndex] : linkRepository[linkRepositoryIndex].substring(hostName.length);
  fetchData(path).
  then(function(rawData){
    linkRepositoryIndex++;
    return rawData;
  })
  .then(analyze)
  .then(function(){
    let keepGoing = linkRepository.length > linkRepositoryIndex;
    if(keepGoing){
      main();
      console.log('task: ', linkRepositoryIndex, 'of', linkRepository.length);
    } else {
      store(imageLinkRepository);
      console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      console.log('task complete');
      console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    }
  })
  .catch(function(e){
    console.log(e);
  });
}

console.log('starting');
main();
