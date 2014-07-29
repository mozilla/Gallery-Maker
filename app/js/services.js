// Services

angular.module('GalleryMaker.services', [])
  .constant('config', window.galleryConfig)
  .constant('analytics', window.analytics)
  .constant('Make', window.Make)
  .factory('makeService', ['Make', 'config',
    function(Make, config) {
      var client = new Make({
        apiURL: config.makeapiURL
      });

      return {
        search: function (type, value, cb) {
          client[type](value).then(cb);
        }
      };
    }
  ])
  .factory('authService', ['$rootScope', 'config',
    function authService($rootScope, config) {
      // This is needed to apply scope changes for events that happen in
      // async callbacks.
      function apply() {
        if (!$rootScope.$$phase) {
          $rootScope.$apply();
        }
      }

      var auth = new WebmakerAuthClient({
        handleNewUserUI: false,
        csrfToken: config.csrfToken
      });

      // Set up login/logout functions
      $rootScope.login = auth.login;
      $rootScope.logout = auth.logout;

      // Set up user data
      $rootScope._user = {};

      // Set locale information
      if (config.supported_languages.indexOf(config.lang) > 0) {
        $rootScope.lang = config.lang;
      } else {
        $rootScope.lang = config.defaultLang;
      }
      $rootScope.direction = config.direction;
      $rootScope.arrowDir = config.direction === 'rtl' ? 'left' : 'right';

      $rootScope.ga_account = config.ga_account;
      $rootScope.ga_domain = config.ga_domain;

      auth.on('login', function (user) {
        $rootScope._user = user;
        apply();
      });

      auth.on('logout', function (why) {
        $rootScope._user = {};
        apply();
      });

      auth.on('error', function (message, xhr) {
        console.log('error', message, xhr);
      });

      return auth;
    }
  ])
  .factory('listService', ['$resource', '$http', 'config',
    function ($resource, $http, config) {
      $http.defaults.headers.common['X-CSRF-Token'] = config.csrfToken;

      return $resource('/list/:id', {
        id: '@_id'
      }, {
        get: {
          method: 'GET',
          withCredentials: true
        },
        save: {
          method: 'POST',
          withCredentials: true
        },
        'delete': {
          method: 'DELETE',
          withCredentials: true
        },
        update: {
          method: 'PUT',
          withCredentials: true
        }
      });
    }
  ])
  .factory('userListsService', ['$resource',
    function ($resource) {
      return $resource('/lists/:user', {
        getLists: {
          method: "GET",
          withCredentials: true
        }
      });
    }
  ])
  .factory('makeSearchService', ['Make', 'config',
    function (Make, config){
      var client = new Make({
        apiURL: config.makeapiURL
      });
      return function (query, cb) {
        client.find(query).then(cb);
      };
    }
  ]);
