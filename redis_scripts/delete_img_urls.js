const redis = require('../modules/Redis');

const cache = new redis();

cache.imgLinks.delete().then(console.log);