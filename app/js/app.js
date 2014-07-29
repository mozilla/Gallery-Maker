angular.module('GalleryMaker', [
  'ngRoute',
  'ngResource',
  'ngSanitize',
  'ui.bootstrap',
  'ui.sortable',
  'localization',
  'GalleryMaker.filters',
  'GalleryMaker.services',
  'GalleryMaker.directives',
  'GalleryMaker.controllers',
]).
config(['$routeProvider', '$locationProvider',
  function ($routeProvider, $locationProvider) {
    if (window.location.href !== decodeURI(window.location.href)) {
      window.location.href = decodeURI(window.location.href);
    }

    $locationProvider.hashPrefix('!');

    $routeProvider.when('/', {
      templateUrl: '/views/editor.html',
      controller: 'editorController'
    })
      .when('/:id', {
        templateUrl: 'views/list.html',
        controller: 'listController'
      })
      .otherwise({
        redirectTo: '/'
      });
  }
]).
run(['$http', '$rootScope',
  function ($http, $rootScope) {
    // Jump to top of viewport when new views load
    $rootScope.$on('$locationChangeSuccess', function (event) {
      window.scrollTo(0, 0);
    });

    // Forward old non-hash-bang URLS to hash-bang equivalents
    // eg:
    //  #/events -> #!/events
    //  #events -> #!/events
    if (window.location.hash.match(/^#[\/a-zA-Z]/)) {
      window.location.hash = window.location.hash.replace('#', '#!');
    }
  }
]);
