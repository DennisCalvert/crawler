const redis = require('../lib/Redis');

const r = new redis();

r.pageLinks.delete().then(console.log);