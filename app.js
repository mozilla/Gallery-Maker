var express = require('express');
var compress = require('compression')();
var bodyparser = require('body-parser');
var morgan = require('morgan');
var nunjucks = require('nunjucks');
var csrf = require('csurf')();
var MakeapiClient = require('makeapi-client');
var path = require('path');
var WebmakerLogin = require('webmaker-auth');

var app = express();

var nunjucksEnv = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(__dirname + '/views')), { autoescape: true });
var makeClient = new MakeapiClient({
  apiURL: process.env.MAKEAPI_URL,
  hawk: {
    id: process.env.MAKEAPI_ID,
    key: process.env.MAKEAPI_KEY
  }
});

var login = new WebmakerLogin({
  loginURL: process.env.LOGIN_URL,
  secretKey: process.env.SECRET_KEY,
  domain: process.env.DOMAIN,
  forceSSL: process.env.FORCE_SSL
});

nunjucksEnv.express( app );

app.disable('x-powered-by');
app.use(morgan('dev'));
app.use(compress);
app.use(express.static(path.join( __dirname + '/public')));

app.use(bodyparser.json());
app.use(bodyparser.urlencoded());
app.use(login.cookieParser());
app.use(login.cookieSession());

app.locals = {
  makeapi: process.env.MAKEAPI_URL
};

app.get('/', csrf, function(req, res) {
  res.render('index.html', {
    csrfToken: req.csrfToken()
  });
});

app.get('/view/:id', function(req, res) {
  makeClient.getList(req.params.id, function(err, data) {
    if ( err ) {
      return res.json(500, err);
    }
    res.render('view.html', {
      list: data
    });
  }, true );
});

function auth( req, res, next ) {
  if ( req.session && req.session.user ) {
    return next();
  }
  res.json(403, 'GTFO');
}

app.post('/list', csrf, auth, function(req, res, next) {
 makeClient.createList(req.body, function(err, data) {
    if ( err ) {
      return res.json(500, err);
    }
    res.json(data);
 });
});

app.put('/list/:id', csrf, auth, function(req, res, next) {
  makeClient.updateList(req.params.id, {
    userId: req.session.user.id,
    makes: req.body.makes,
    title: req.body.title
  }, function(err, data) {
    if ( err ) {
      return res.json(500, err);
    }
    res.json(data);
  });
});

app.del('/list/:id', csrf, auth, function(req, res, next) {
  makeClient.removeList(req.params.id, req.session.user.id, function(err, data) {
    if ( err ) {
      return res.json(500, err);
    }
    res.json(data);
  });
});

app.get('/list/:id', csrf, auth, function(req, res, next) {
  makeClient.getList(req.params.id, function(err, data) {
    if ( err ) {
      return res.json(500, err);
    }
    res.json(data);
  }, true );
});

app.get('/lists/:user', csrf, auth, function(req, res, next) {
  makeClient.getUsersLists(req.params.user, function(err, data) {
    if ( err ) {
      return res.json(500, err);
    }
    res.json(data);
  });
});

app.post('/verify', login.handlers.verify);
app.post('/authenticate', login.handlers.authenticate);
app.post('/logout', login.handlers.logout);

app.listen(process.env.PORT, function() {
  console.log('App listening on ' + process.env.PORT);
});
