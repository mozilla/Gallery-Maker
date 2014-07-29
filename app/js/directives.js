// Directives

angular.module('GalleryMaker.directives', [])
  .directive('ngClick', function () {
    // Prevent default on all elements that have ngClick defined
    return {
      restrict: 'A',
      link: function (scope, el, attrs) {
        if (attrs.href === '#') {
          el.on('click', function (e) {
            e.preventDefault();
          });
        }
      }
    };
  })
  .directive('ngFlash', function() {
    return {
      restrict: 'A',
      link: function(scope, el, attrs) {
        scope.$watch(attrs.ngFlash, function(value) {
          if ( value ) {
            el.fadeIn();
          } else {
            el.fadeOut();
          }
        });
      }
    };
  });
