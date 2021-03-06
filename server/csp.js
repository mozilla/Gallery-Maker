var hood = require('hood');

module.exports = function(options) {
  var policy = {
    headers: [
      'Content-Security-Policy'
    ],
    policy: {
      'connect-src': ["'self'", process.env.MAKEAPI_URL],
      'default-src': ["'self'"],
      'img-src': ["*"],
      'frame-src': ["https://login.persona.org"],
      'script-src': ["'self'", "'unsafe-eval'", "https://login.persona.org", "https://ssl.google-analytics.com"],
      'style-src': ["'self'", "https://fonts.googleapis.com", "https://netdna.bootstrapcdn.com", "'unsafe-inline'"],
      'font-src': ["'self'", "https://themes.googleusercontent.com", "https://netdna.bootstrapcdn.com"]
    }
  };

  if (options.reportToHost) {
    policy.policy['report-uri'] = [options.reportToHost];
  }

  return hood.csp(policy);
};
