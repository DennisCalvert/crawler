const redis = require('./Redis');
const azure = require('azure-storage');
const http = require('http');
const https = require('https');
const config = require('../config');

const storageAccountName = config.azureStorage.accountName;
const storageAccountKey = config.azureStorage.accountKey;
const containerName = config.azureStorage.containerName;
const conatinerConfig = {
  publicAccessLevel: 'blob'
};

const blobSvc = azure.createBlobService(storageAccountName, storageAccountKey);

const domain = config.target.domain;

function getFileName(url){
  var range = 'http://'+domain+'/';
  if(url.includes('www.' + domain)){
    range.length += 4;
  }
  return url.substring(range.length);
}

function getContentType(fileName){
  return 'image/jpeg';
  //return 'image/' + fileName.substring(fileName.lastIndexOf('.') + 1);
}

function saveImg(url){

  const fileName = url;
  const contentType = getContentType(fileName);
  const blobOptions = {
    contentSettings: {
      contentType: contentType
    }
  };

  function handleHTTPError(statusCode){
    console.log('upload failed for: ', statusCode, url);
    let r = new redis();
    r.addFailed(url);
  }

  function blobWriteCallback(error, result, response){
    if(error){
      console.log("Couldn't upload file %s from %s", fileName, domain);
      console.error(error);
    } else {
      console.log('SAVED: ', fileName);
    }
  }

  let httpMethod = url.startsWith('https') ? https : http;
  httpMethod.get(url, function (httpResponse) {
    if (200 !== httpResponse.statusCode) {
      handleHTTPError(httpResponse.statusCode);
      return;
    }
    //let blobSvc = azure.createBlobService(storageAccountName, storageAccountKey);
    let writeStream = blobSvc.createWriteStreamToBlockBlob(containerName, fileName, blobOptions, blobWriteCallback)
      .on("data", function (chunk){
        //console.log("get data : "+chunk);
      });
    httpResponse.pipe(writeStream);
    httpResponse.on('error', function(e){
      console.log('error piping httpResponse to storage');
      console.log(url,filename)
    })
  }).on('error', function(e) {
      console.log("Got error: " + e.message);
  });
}

function main(){

  //var blobService = azure.createBlobService(storageAccountName, storageAccountKey);
  blobSvc.createContainerIfNotExists(containerName, conatinerConfig, function(error, result, response) {
    if (!error) {
      // if result = true, container was created.
      // if result = false, container already existed.
      var r = new redis();
      r.get()
      //make sure links ending with {/} don't get cached
      .then(list => list.filter(i => !/.*\/$/.test(i)))
      .tap(console.log)
      .then(data => data.forEach(saveImg))
      .catch(e => console.log('[imgCopySave], [cahcing failed]: ',e));
    }
  });
}

console.log('starting');
main();
