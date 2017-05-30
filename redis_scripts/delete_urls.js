const redis = require('../modules/Redis');

const r = new redis();

r.pageLinks.delete().then(console.log);