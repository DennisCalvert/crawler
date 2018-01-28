var redis = require('./modules/Redis');

var r = new redis();

//  console.log('Flushing Redis');
// r.del();
//r.client.keys();

// r.getPageLinks().then(console.log);

r.pageLinks.get().then(linkList => {

    let trump = linkList.filter(link => link.includes('trump'));
    console.log(linkList.length);
    console.log(trump.length);
});

// r.get().then(function(data){
//   console.log(data);
// });
