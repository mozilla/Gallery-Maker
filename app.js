var path = require('path');
var express = require('express');
var nunjucks = require('nunjucks');
var helmet = require("helmet");
var WebmakerAuth = require('webmaker-auth');
var MakeapiClient = require('makeapi-client');

var app = express();
var csrf = express.csrf();

var nunjucksEnv = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(__dirname + '/views')), { autoescape: true });
var makeClient = new MakeapiClient({
  apiURL: process.env.MAKEAPI_URL,
  hawk: {
    id: process.env.MAKEAPI_ID,
    key: process.env.MAKEAPI_KEY
  }
});

var webmakerAuth = new WebmakerAuth({
  loginURL: process.env.LOGIN_URL,
  secretKey: process.env.SECRET_KEY,
  domain: process.env.DOMAIN,
  forceSSL: process.env.FORCE_SSL
});

nunjucksEnv.express( app );

app.disable('x-powered-by');

if (process.env.ENABLE_GELF_LOGS) {
  messina = require('messina');
  logger = messina('gallerymaker-' + process.env.NODE_ENV || 'development');
  logger.init();
  app.use(logger.middleware());
} else {
  app.use(express.logger('dev'));
}

app.use(helmet.iexss());
app.use(helmet.contentTypeOptions());
app.use(helmet.xframe());

if ( !!process.env.FORCE_SSL ) {
  app.use(helmet.hsts());
  app.enable("trust proxy");
}

app.use(express.compress());
app.use(express.static(path.join( __dirname + '/public')));

app.use(express.json());
app.use(express.urlencoded());
app.use(webmakerAuth.cookieParser());
app.use(webmakerAuth.cookieSession());

app.locals({
  makeapi: process.env.MAKEAPI_URL
});

app.use(app.router);

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
  res.json(403, 'unauthorised');
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

app.get('/list/:id', function(req, res, next) {
  makeClient.getList(req.params.id, function(err, data) {
    if ( err ) {
      return res.json(500, err);
    }
    res.json(data);
  }, true );
});

app.get('/lists/:user', function(req, res, next) {
  makeClient.getListsByUser(req.params.user, function(err, data) {
    if ( err ) {
      return res.json(500, err);
    }
    res.json(data);
  });
});

app.post('/verify', webmakerAuth.handlers.verify);
app.post('/authenticate', webmakerAuth.handlers.authenticate);
app.post('/logout', webmakerAuth.handlers.logout);

app.listen(process.env.PORT, function() {
  console.log('App listening on ' + process.env.PORT);
});
