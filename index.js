var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');

var bodyParser = require('body-parser');

var logger = require('morgan');

var errorHandler = require('errorhandler');

var methodOverride = require('method-override');
var request = require('request');
var Epub = require('epub-gen');
var EpubGenerator = require('epub-generator');
var path = require('path');
var http = require('http');
var html2epub = require('html2epub');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var fs = require('fs');


var app = express();

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 80);
app.set('views', '.');
app.set('view engine', 'jade');
app.use(compress());
// app.use(sass({
//     src: path.join(__dirname, 'public'),
//     dest: path.join(__dirname, 'public'),
//     debug: true,
//     outputStyle: 'expanded'
// }));
app.use(logger('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(methodOverride());
app.use(cookieParser());
// app.use(session({
//     resave: true,
//     saveUninitialized: true,
//     secret: secrets.sessionSecret,
//     store: new MongoStore({ url: secrets.db, autoReconnect: true })
// }));
// app.use(passport.initialize());
// app.use(passport.session());
// app.use(flash());
app.all('*', function(req, res, next) {


    /**
     * Response settings
     * @type {Object}
     */
    var responseSettings = {
        "AccessControlAllowOrigin": req.headers.origin,
        "AccessControlAllowHeaders": "Content-Type,X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5,    Date, X-Api-Version, X-File-Name",
        "AccessControlAllowMethods": "POST, GET, PUT, DELETE, OPTIONS",
        "AccessControlAllowCredentials": true
    };

    /**
     * Headers
     */
    res.header("Access-Control-Allow-Credentials", responseSettings.AccessControlAllowCredentials);
    res.header("Access-Control-Allow-Origin", responseSettings.AccessControlAllowOrigin);
    res.header("Access-Control-Allow-Headers", (req.headers['access-control-request-headers']) ? req.headers['access-control-request-headers'] : "x-requested-with");
    res.header("Access-Control-Allow-Methods", (req.headers['access-control-request-method']) ? req.headers['access-control-request-method'] : responseSettings.AccessControlAllowMethods);

    if ('OPTIONS' == req.method) {
        res.send(200);
    }
    else {
        next();
    }


});
//  app.use(lusca({
//      csrf: true,
//      xframe: '*',
//      xssProtection: true
//  }));


app.use(function(req, res, next) {
    res.locals.user = req.user;
    next();
});
app.use('/reader',express.static(__dirname));
app.get('/reader/:file', function(req, res, next){
    // var ePub = require('epub.js');
    
    // new ePub(path.resolve(__dirname, req.params.file));
    res.render('index');

});
// app.get('*', function(req, res, next){
//     var ocf = require('epub-ocf');
// var container = ocf('output.epub'); 

// container.readEntry('META-INF/container.xml', function(err, content) {
//   console.log(content);
//   res.write(content);
// });

// container.rootfiles(function(err, files) {
//   console.log(files); // [ 'EPUB/package.opf' ] 
  
// });
 
 
// });
// app.get('/download', function(req, res, next){
//     res.download(path.join(__dirname, 'output.epub'));
// });
app.get('/download/:id', function(req, res, next){
//  if(req.hostname == ('localhost'||'micoff.local'||'lexlab.io')){
            var FIREBASE_URL = process.env.FIREBASE_URL;
            var FIREBASE_SECRET = process.env.FIREBASE_SECRET;
    // }else{
        
    
    
    //          var FIREBASE_URL = process.env.FIREBASE_URL;
    //         var FIREBASE_SECRET = process.env.FIREBASE_SECRET;
    
    // }
var output = path.join(__dirname,'..','output.epub');
var reportdata = req.params.id;
console.log(reportdata);
var Firebase = require('firebase');
console.log(FIREBASE_URL);
var ref = new Firebase(FIREBASE_URL).child('content').child(reportdata);
var contentarray = [];
ref.authAnonymously(function(error,authData){
    if (error) {
    console.log("Authentication Failed!", error);
  } else {
    console.log("Authenticated successfully with payload:", authData);
  }
});
ref.once('value', function(dataSnapshot){
    var root = dataSnapshot.exportVal();
    // for (var key in root.roarlist){
        // if(root.roarlist.hasOwnProperty(key)){
            // var newdata = dataSnapshot.child(key).val();
            // contentarray.push(newdata);
        // }
    // }
    callback(root);
});
var REF = function(id){
    var ref = new Firebase(FIREBASE_URL).child('content').child(id);
    return ref;
};

// var reportdata = new html2epub({
  
//   "spine": [
//     "http://localhost:8000/lexpress/mylionlaw/michael/index.html"
//   ]
// }
// );
// request('http://localhost:8000/lexpress/mylionlaw/michael/index.html',{timeout:10000}, function(err,response, html){
    
//   reportdata = html;
//   callback();      
//       //  reportdata = data;
        
  
// });

//res.send(reportdata);


var callback = function(rdata){
var postcss = require("postcss")
var epubcss = require("postcss-epub-clean")
 
// css to be processed 
//var css = fs.readFileSync(path.join(process.cwd(),'..','llp_core','dist','app.full.min.css'), "utf8");
 
// process css 
/*var outputcss = postcss()
  .use(epubcss)
  .process(css)
  .css;
 */


    
var options = function(rdata){
    var opt = this;
   opt={ uuid: rdata.$id,
    title: rdata.title,
    language: 'en',
    date: new Date(),
    author: rdata.inventor,
    description: rdata.description,
    rights: 'MIT',
    cover: rdata.coverimage || rdata.media 
};
return opt;
};
var file = fs.createWriteStream('../book.epub');

var generator = new EpubGenerator(options(rdata));
generator.add('/content/index.html', rdata.content, {mimetype: 'text/html',toc: true, title: rdata.patent.title});    
//generator.add('/content/style.css', outputcss);

var myfunc = function(rdata){
for (var key in rdata.roarlist){
    if(rdata.roarlist.hasOwnProperty(key)){
        var datasrc = new REF(key);
        datasrc.once('value', function(snapshot){
            var data = snapshot.exportVal();
           generator.add('/content/'+data.id+'.html', data.content,{mimetype: 'text/html', toc: true, title: data.title}).end().pipe(file);
           console.log(data.id);
            myfunc(data);      
        });
              
    }
}
};
myfunc(rdata);
//generator.end().pipe(file);

// generator.pipe(file);
/*var css = fs.readFileSync(path.join(process.cwd(),'..','llp_core','dist','app.full.min.css'));

var option = {

    title: rdata.title || 'title',
    author: rdata.author || rdata.inventor || 'author',
    publisher: 'Lion Legal Products Inc',
    cover: rdata.cover || 'http://localhost:8000/patents/US'+(rdata.id || '7888888')+'/preview',
    css: css,
    content: [{
        title: rdata.title || 'Patent Grant',
        author: rdata.author || rdata.inventor || 'USPTO',
        data: rdata.content || 'mico'
    }]

};*/
/*
new Epub(option , 'book.epub').promise.then(function(){

        console.log("Ebook Generated Successfully!")
            res.download('book.epub');
       }, function(err){
        console.error("Failed to generate Ebook because of ", err)
    });


};
*/
// callback();
var epubstream = require('epubstream'),
    fs = require('fs');

// Create epub and provide the minimum possible metadata
var epubs = epubstream.createEpub({
    title: 'Sample',
    nav: [{ label: 'foo', content: 'foo.html' }]
});

// Start piping the epub to a file
epubs.pipe(fs.createWriteStream('sample.epub'));

// Add the file foo.xhtml to the archive
epubs.addFile(rdata, 'foo.xhtml', function() {
    // Write the XML files required for epub (ncx/opf/ocf)
    epubs.finalize(function(b) { console.log('%d bytes', b); });
});
};
});

app.post('*',function(req,res,next){
   var rdata = req.body.data || req.body;
    
    console.log(rdata);
    
    var d = new Date();
    var now = d.getTime();
    var output =    now + '.epub';
    var option = {

    title: rdata.title,
    author: rdata.author || rdata.inventor,
    publisher: rdata.publisher || 'Lion Legal Products Inc',
    cover: rdata.cover || 'http://localhost:8000/patents/US'+rdata.number+'/preview',
    content: rdata.content

};
var gen = new Epub(option , output).promise.then(function(){

        console.log("Ebook Generated Successfully!")
            res.download(output);
       }, function(err){
        console.error("Failed to generate Ebook because of ", err)
    });

gen();

});

app.listen(9009, function(){console.log('epub on port9000');});
