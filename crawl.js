var http = require('http');
var redis = require('./modules/Redis');
var Q = require('q');
var cheerio = require('cheerio')

var linkRepository = ['/'];
var linkRepositoryIndex = 0;
var imageLinkRepository = [];

var hostName = 'http://205photography.com';

// function redis(cmd, data){
// 	var r = new redis();
// 	return r[cmd](data);
// }

function store(data){
	var r = new redis();
  return r.cache(data);
}

function digestImageLinks(imageLinks){
	//console.log(imageLinks);
  imageLinks.forEach(function(img){
    const includeFile = img.attribs && 
                        img.attribs.src && 
                        img.attribs.src.includes(hostName);

    if(includeFile){
      let r = new redis();
      r.addImgLink(img.attribs.src);
    }

    // if(img.attribs && img.attribs.src){
    //   let src = img.attribs.src;
    //   //var include = src.includes(hostName) && !imageLinkRepository.includes(src);
    //   var include = src.includes(hostName);
    //   if(include){
		// 		//console.log('image link cached: ', src);
    //     let r = new redis();
    //     r.addImgLink(src);
    //     //imageLinkRepository.push(img.attribs.src);
    //   }
    // }
  });
}

function isValidPageLink(href){
  return href.includes(hostName)
    && !href.includes('mailto')
    && !href.includes('.jpg')
    && !href.includes('.pdf')
    && !href.includes('.rss')
    && !href.includes('.php');
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
  let $ = new cheerio.load(rawData);

  let imageLinks = $('img').toArray();
  digestImageLinks(imageLinks);
	//$('img').toArray().map(digestImageLinks);

  let pageLinks = $('a').toArray(); //jquery get all hyperlinks
  digestPageLinks(pageLinks);
  return;
}

function fetchData(){

  let deferred = Q.defer();
  let path = (linkRepository.length === 1) ? linkRepository[linkRepositoryIndex] : linkRepository[linkRepositoryIndex].substring(hostName.length);

  console.log('path:', path);
  http.get({
    hostname: '205photography.com',
    port: 80,
    path: path,
    agent: false
  }, function(res){
    var body = '';
    res.on("data", function(chunk){
	    body += chunk;
    });
    res.on("end", function(){
	  deferred.resolve(body);
    });
  });
  return deferred.promise;
}

function main(){
  fetchData().
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
