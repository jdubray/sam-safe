// 

var express = require('express');
var bodyParser = require('body-parser') ;
var morgan = require('morgan') ;

// Business Logic - SAM Pattern
var actions = null ; // not implemented on the server
var model = require('./model') ;
var view = require('./view') ;
var state = require('./state') ;

var safe = require('./safe') ;

safe.init(actions,model,state,view) ;

var config = {} ;
config.port = 5425 ;
config.loginKey = 'abcdef0123456789' ;
config.adminDirectory = './console/bower_components'
config.username = 'sam' ;
config.password = 'nomvc' ;

var serverResponses = {
    tooBusy: function(req,res) {
        res.writeHead(429, { 'Content-Type': 'text/plain' });
        res.end("Server is too busy, please try again later") ;
    },
    
    unauthorized: function(req,res) {
        res.header('Content-Type', 'text/html') ;
        res.status(401).send('<htnl><body>Unauthorized access</body></html>') ;  
    },
    
    serverError: function(req,res) {
        res.header('Content-Type', 'text/html') ;
        res.status(500).send('<htnl><body>Server Error</body></html>') ;  
    }
} ;

var authnz = {

    authorized: function (cookies) {
        if (cookies.authorized > 0) {
            return true ;
        }
        return false ;
    },
    
    del: function(req, res, cookie) { 
        if (cookie !== undefined) {
            res.clearCookie(cookie);  
        }
    },
    
    set: function(req, res, cookie) { 
        if (cookie !== undefined) {
             res.cookie(cookie, +new Date(), { maxAge: 3600000, path: '/' }); 
        }
    },
    
    isSet: function(req, res, cookie) { 
        if (cookie !== undefined) {
             return res.cookies[cookie]; 
        }
    },
    
    validateCredentials: function(username,password) {
        return ((username === config.username) && (password === config.password)) ;
    }

} ;

var app = express();
app.use(morgan('combined')) ;
app.use(bodyParser.raw()) ;
app.use(bodyParser.urlencoded({ extended: true }));

var cookieParser = require('cookie-parser') ;
app.use(cookieParser()) ;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/html', express.static(config.adminDirectory));


var v = '/v1' ;
var r = 'app' ;
var a = 'api' ;
var apis = {
    login: '/'+r+v+'/login',
    logout: '/'+r+v+'/logout',
    present: '/'+r+v+'/present',
    init: '/'+r+v+'/init'
} ;


// var postman = require('./postman') ;

// postman.addAPI(r, 'login', config.loginKey) ;
app.post(apis.login,function(req,res) { 
    var username = req.body.username,
        password = req.body.password ;
    
    if (authnz.validateCredentials(username,password)) {
            console.log('Authorized') ;
            authnz.set(req,res,'authorized') ;
            res.status(200).send({authorized:true, user: {firstName:'Paul', lastName:'Smith', tel:'+1-425-555-1212'}}) ;
    } else {
        console.log('Unauthorized access') ;
        res.status(200).send({authorized:false}) ;
    }
}) ;

// postman.addAPI(r, 'logout', config.loginKey) ;
app.get(apis.logout,function(req,res) { 
    authnz.del(req,res,'authorized') ;
    res.status(200).send({authorized:false}) ;
}) ;





//postman.addAPI(r, 'present', config.loginKey) ;

app.post(apis.present,function(req,res) { 
    var data = req.body ;
    model.present(data, function(representation) {
        res.status(200).send(representation) ;
    }) ;
}) ;


//postman.addAPI(r, 'init', config.loginKey) ;

app.get(apis.init,function(req,res) { 
    console.log(view) ;
    res.status(200).send(view.init(model)) ;
}) ;



app.listen(config.port, function() {
    console.log("registering app on port: "+config.port) ;
    //setTimeout(register(),2000) ; 
});