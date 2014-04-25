var express = require('express');
var compress = require('compression')();
var morgan = require('morgan');
var nunjucks = require('nunjucks');
var MakeapiClient = require('makeapi-client');
var path = require('path');
var habitat = require("habitat");

habitat.load();

var env = new habitat();

var app = express();

var nunjucksEnv = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(__dirname + '/views')), { autoescape: true });
var makeClient = new MakeapiClient({
  apiURL: env.get('MAKEAPI_URL'),
  hawk: {
    id: env.get('MAKEAPI_ID'),
    key: env.get('MAKEAPI_KEY')
  }
});

nunjucksEnv.express( app );

app.disable( 'x-powered-by' );
app.use(morgan( 'dev' ));
app.use(express.static(path.join( __dirname + '/public')));
app.use(compress);

app.get('/', function(req, res) {
  res.render("index.html");
});

app.listen(env.get('PORT'));
