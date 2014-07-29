module.exports = function() {
  var express = require('express');
  var i18n = require('webmaker-i18n');
  var path = require('path');
  var defaultLang = 'en-US';
  var csp = require('./csp');
  var messina = require('messina')('gallery-maker-' + process.env.NODE_ENV);
  var wts = require('webmaker-translation-stats');
  var WebmakerAuth = require('webmaker-auth');
  var nunjucks = require('nunjucks');
  var helmet = require("helmet");
  var MakeapiClient = require('makeapi-client');
  var app = express();
  var csrf = express.csrf();

  var webmakerAuth = new WebmakerAuth({
    loginURL: process.env.LOGIN_URL,
    secretKey: process.env.SECRET_KEY,
    domain: process.env.DOMAIN,
    forceSSL: process.env.FORCE_SSL
  });

  app.use(require('prerender-node'));

  if (process.env.ENABLE_GELF_LOGS) {
    messina.init();
    app.use(messina.middleware());
  } else {
    app.use(express.logger('dev'));
  }

  var nunjucksEnv = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(__dirname + '/views')), { autoescape: true });
  var makeClient = new MakeapiClient({
    apiURL: process.env.MAKEAPI_URL,
    hawk: {
      id: process.env.MAKEAPI_ID,
      key: process.env.MAKEAPI_KEY
    }
  });
  app.use(helmet.xssFilter());
  app.use(helmet.nosniff());
  app.use(helmet.xframe());
  app.use(express.compress());
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(webmakerAuth.cookieParser());
  app.use(webmakerAuth.cookieSession());
  app.use(csrf);
  app.disable('x-powered-by');

  // Setup locales with i18n
  app.use( i18n.middleware({
    supported_languages: JSON.parse(process.env.SUPPORTED_LANGS) || [defaultLang],
    default_lang: defaultLang,
    mappings: require('webmaker-locale-mapping'),
    translation_directory: path.resolve(__dirname, '../locale')
  }));

  nunjucksEnv.express( app );

  // CSP
  app.use(csp({
    reportToHost: process.env.CSP_LOGGER,
    eventsLocation: process.env.hostname
  }));

  if ( !!process.env.FORCE_SSL ) {
    app.use(helmet.hsts());
    app.enable("trust proxy");
  }

  app.use(express.static(path.join(__dirname, '../app')));

    // Health check
  var healthcheck = {
    version: require('../package').version,
    http: 'okay'
  };

  app.get('/healthcheck', function (req, res) {
    wts(i18n.getSupportLanguages(), path.join(__dirname, '../locale'), function(err, data) {
      if(err) {
        healthcheck.locales = err.toString();
      } else {
        healthcheck.locales = data;
      }
      res.json(healthcheck);
    });
  });

  // Localized Strings
  app.get('/strings/:lang?', i18n.stringsRoute('en-US'));

  // Serve up virtual configuration "file"
  var config = {
    version: require('../package').version,
    makeapiURL: process.env.MAKEAPI_URL,
    ga_account: process.env.GA_ACCOUNT || 'UA-XXXXX-X',
    ga_domain: process.env.GA_DOMAIN || 'example.com'
  };

  app.get('/config.js', function (req, res) {
    config.lang = req.localeInfo.lang;
    config.direction = req.localeInfo.direction;
    config.csrfToken = req.csrfToken();
    config.defaultLang = defaultLang;
    config.langmap = i18n.getAllLocaleCodes();
    config.supported_languages = i18n.getSupportLanguages();
    res.setHeader('Content-type', 'text/javascript');
    res.send('window.galleryConfig = ' + JSON.stringify(config));
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

  app.delete('/list/:id', csrf, auth, function(req, res, next) {
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

  return app;
};
