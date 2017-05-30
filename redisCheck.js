var redis = require('./modules/Redis');

var r = new redis();

//  console.log('Flushing Redis');
// r.del();
//r.client.keys();

r.getPageLinks().then(console.log);

// r.get().then(function(data){
//   console.log(data);
// });
