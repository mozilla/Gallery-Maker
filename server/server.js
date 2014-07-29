if (process.env.NEW_RELIC_ENABLED) {
  require('newrelic');
}

// App
var app = require('./config')(),
    port = process.env.PORT || 10000;

// Run server
app.listen(port, function () {
  console.log('Now listening on %d', port );
});
