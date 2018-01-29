// import { request } from 'https';

const express = require('express')
const app = express()
const path = require('path');
const bodyParser = require('body-parser')
const siteCrawler = require('./lib/crawl')
const crawlImages = require('./lib/crawlImages')
const redis = require('./lib/Redis')
const config = require('./config')

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
    const r = new redis(req.body.targetUrl);
    siteCrawler(req.body.targetUrl, r)
    .then(r.pageLinks.get)
    .then(data => {
        res.json({data:data})    
    })
    
})

app.post('/crawl/imgLinks/', jsonParser, function (req, res) {
    if(!req.body.targetUrl){
        res.status(500);
    }
    const r = new redis(req.body.targetUrl);
    crawlImages( req.body.targetUrl, r)
    .then(r.imgLinks.get)
    .then(data => {
        res.json({data:data})    
    })
    
})

app.listen(config.port)