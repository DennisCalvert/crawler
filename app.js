// import { request } from 'https';

const express = require('express')
const app = express()
const path = require('path');
const bodyParser = require('body-parser')
const siteCrawler = require('./lib/crawl')
const crawlImages = require('./lib/crawlImages')
const redis = require('./lib/Redis')
const config = require('./config')
const log = require('./lib/log');

const jsonParser = bodyParser.json()

app.use(express.static('public'))

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    next()
});

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/views/index.html'))
})

app.post('*', jsonParser, function(req, res, next){
    if(req.body.secret !== process.env.SECRET){
        res.status(401)
    } else {
        next()
    }
})

app.post('/crawl/url/', jsonParser, function (req, res) {
    const domain = req.body.targetUrl;
    const r = new redis(req.body.targetUrl);
    siteCrawler(domain, r)
    .then(r.pageLinks.get)
    .then(data => {
        log.info('Closing redis client for ', domain)
        r.client.quit()
        log.info(`Finished indexing ${data.length} URLs for ${domain}`)
        res.json({data:data})    
    })
    
})

app.post('/crawl/imgLinks/', jsonParser, function (req, res) {
    const domain = req.body.targetUrl
    log.info(`Starting image indexing for ${domain}`)
    if(!domain){
        res.status(500)
    }
    const r = new redis(domain)
    crawlImages(domain, r)
    .then(r.imgLinks.get)
    .then(data => {
        log.info('Closing redis client for ', domain)
        r.client.quit()
        log.info(`Finished indexing ${data.length} images for ${domain}`)
        res.json({data:data})    
    })
})

app.listen(config.port)