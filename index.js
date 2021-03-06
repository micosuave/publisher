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
var shell = require('shelljs');
var FIREBASE_URL = process.env.FIREBASE_URL || 'https://lexlab.firebaseio.com';
    var FIREBASE_SECRET = process.env.FIREBASE_SECRET;
//var q = require('q');
//var async = require('async');
var app = express();

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 9000);
app.set('views', '.');
app.set('view engine', 'jade');
app.use(compress());

app.use(logger('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(methodOverride());
app.use(cookieParser());

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


app.use(function(req, res, next) {
    res.locals.user = req.user;
    next();
});
app.use('', express.static(__dirname));
app.use('/reader', express.static(__dirname));

app.get('/reader/:id', function(req, res, next) {
    // var ePub = require('epub.js');
    var cb = function(){
        //shell.exec('rm -r ./dist/'+req.params.id );
        
        var ocf = require('epub-ocf');
var container = ocf('./dist/'+req.params.id.replace('-','')+'.epub'); // ocf is an alias for ocf.zip

// ocf.open('path/to/book.epub', function(err, container) {}); 

//var container = ocf.openSync('your container uri');
// container.readEntry('META-INF/container.xml', function(err, content) {
//   console.log(content);
// });
//var stream = container.createEntryStream('EPUB/images/cover.jpg');
//stream.pipe(process.stdout);
container.rootfiles(function(err, files) {
  console.log(files); // [ 'EPUB/package.opf' ]
});
        
        
         res.render('index', {PATHTOEPUB: './dist/'+req.params.id.replace('-','')+'/'});




            
        
    };
    
    prepBook(req,res,next, cb);
    // new ePub(path.resolve(__dirname, req.params.file));

});

app.get('/download/:id', function(req, res, next) {
   var cb =  res.download('./dist/'+req.params.id.replace('-','')+'.epub');
  prepBook(req, res, next, cb);
  
});

var prepBook = function(req, res, next, cb){
      var file, generator;
    var d = new Date();
    var date = req.params.id;
    var output = path.join(__dirname, 'dist', date + '.epub');
    shell.exec('mkdir -p '+'./tmp/' + date+'/OEBPS/');
    /*var dest = './dist/'+date+'/OEBPS';
    var src = path.resolve(__dirname,'..','llp_core','dist');
    fs.createReadStream(src).pipe(fs.createWriteStream(dest));*/
    var reportdata = req.params.id;
    console.log(reportdata);
    var Firebase = require('firebase');
    console.log(FIREBASE_URL);
    var REF = function(id) {
        var ref = new Firebase(FIREBASE_URL).child('content').child(id);
        return ref;
    };

    var que = [];
    var ref = new REF(reportdata);
var options = function(rdata) {
        var opt = this;
        opt = {};
        opt.title = rdata.title;
        opt.language = 'en';
        opt.author = rdata.author || 'LE.O. ';
        opt.description = rdata.description || 'generated by Lion Legal Products Inc';
        opt.cover = cover(rdata);

        return opt;
    };

    var cover = function(rdata) {
        var data;
        if (rdata.cover){
            return rdata.cover;
        }
        else{
            try{
                if(rdata.mimetype.includes('image')){
                    data = fs.createReadStream(rdata.media); 
                }    
            }
            catch(ex){
                data = fs.createReadStream('../llp_core/img/GoldLion.png');
            }
            finally{
                return data.toString();
            }
        }
    };
      ref.authAnonymously(function(error, authData) {
        if (error) {
            console.log("Authentication Failed!", error);
        } else {
            console.log("Authenticated successfully with payload:", authData);
        }
    });

    ref.once('value', function(dataSnapshot) {
        var data = dataSnapshot.exportVal();
       file = fs.createWriteStream(output);

         generator = new EpubGenerator(options(data));
       
       
        if (data.content) {
            fs.writeFileSync('./tmp/' + date + '/OEBPS/' + data.id.replace('-','') + '.html', data.content.replace('app.full.min.css', 'style.css'), callback(data));
            que.push([]);
        } else {
            fs.writeFileSync('./tmp/' + date + '/OEBPS/' + data.id.replace('-','') + '.html', '<p>&nbsp;</p>', callback(data));
            que.push([]);
        }
         
    });


 var callback = function(rdata) {


    
    var myfunc = function(rdata) {
            for (var key in rdata.roarlist) {
                if (rdata.roarlist.hasOwnProperty(key)) {
                    var datasrc = new REF(key);
                    que.push(key);
                    datasrc.once('value', snap);
                } 
            }   
        };
        var snap = function(snapshot) {
            var data = snapshot.exportVal();
                if (data.content) { 
                    fs.writeFileSync('./tmp/'+date+'/OEBPS/' + data.id.replace('-','') + '.html', data.content.replace('app.full.min.css', 'style.css'), add(data)); }
                else { que.shift(); }


                console.log(data.id);
                if(data.roarlist){
                    myfunc(data);
                }

            };
            
       
 var add = function(data) {
            que.shift();
            console.log(que.length);
            if (que.length === 1) {
                return generator.add( data.id.replace('-','') + '.html', fs.createReadStream('./tmp/'+date+'/OEBPS/' + data.id.replace('-','') + '.html'), { toc: true, title: data.title }).end(cb);
            }else{
            return generator.add( data.id.replace('-','') + '.html', fs.createReadStream('./tmp/'+date+'/OEBPS/' + data.id.replace('-','') + '.html'), { toc: true, title: data.title });
            }
        };
   myfunc(rdata);
       
        generator.add('./llp_core/dist/style.css', fs.createReadStream('../llp_core/dist/style.css'));
        generator.add('./llp_core/dist/app.bower.js', fs.createReadStream('../llp_core/dist/app.bower.js'));
        generator.add('./llp_core/dist/app.ck.js', fs.createReadStream('../llp_core/dist/app.ck.js'));
        generator.add('./llp_core/dist/minicache.js', fs.createReadStream('../llp_core/dist/minicache.js'));
        
        generator.add('index.html', fs.createReadStream('./tmp/'+date+'/OEBPS/' + rdata.id.replace('-','') + '.html'), { toc: true, title: rdata.title });
        
        
        generator.pipe(file);   
    };
};

app.listen(app.get('port'), function(){ console.log('epub on port ', app.get('port')); });
