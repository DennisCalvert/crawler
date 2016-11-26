var redis = require('./modules/Redis');
var azure = require('azure-storage');
var http = require('http');
var config = require('./config');

const storageAccountName = config.storageAccountName;
const storageAccountKey = config.storageAccountKey;
const containerName = config.storageContainerName;
const domain = config.domain;

function getFileName(url){
  var range = 'http://'+domain+'/';
  return url.substring(range.length);
}

function getContentType(fileName){
  return 'image/' + fileName.substring(fileName.lastIndexOf('.') + 1);
}

function saveImg(url){
  // const re = /^-d+xd+/.exec(url);
  // if(re){
  //   var rangeStart = url.lastIndexOf('-');
  //   var rangeEnd = url.lastIndexOf('.');
  //   var fullResImageURL = url.substring(0, rangeStart) + url.substring(rangeEnd);
  //   saveImg(fullResImageURL);
  // }
  var fileName = getFileName(url);
  var contentType = getContentType(fileName);
  var requestOptions = {
      host: domain,
      port: 80,
      path: '/' + fileName
  };

  var blobOptions = {
    contentSettings: {
      contentType: contentType
    }
  };

  // console.log(fileName,contentType);
  // return;

  function handleHTTPError(statusCode){
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.log('upload failed for: ', url);
    console.log('Unexpected status code: %d', statusCode);
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!');
    //saveImg(url);
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

  http.get(requestOptions, function (httpResponse) {
    if (200 !== httpResponse.statusCode) {
      handleHTTPError(httpResponse.statusCode);
      return;
    }
    let blobSvc = azure.createBlobService(storageAccountName, storageAccountKey);
    let writeStream = blobSvc.createWriteStreamToBlockBlob(containerName, fileName, blobOptions, blobWriteCallback)
      .on("data", function (chunk){
        //console.log("get data : "+chunk);
      });
    httpResponse.pipe(writeStream);
    httpResponse.on('error', function(e){
      console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!');
      console.log('error piping httpResponse to storage');
      console.log(url,filename)
    })
  }).on('error', function(e) {
      //console.log("Got error: " + e.message);
  });
}

function main(){
  var r = new redis();
  r.get()
    .then(data => data.forEach(saveImg))
    .catch(e => console.log(e));
}

console.log('starting');
main();
