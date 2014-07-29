// Controllers

angular.module('GalleryMaker.controllers', [])
  .controller('editorController', [
    '$rootScope',
    '$scope',
    '$timeout',
    'userListsService',
    'listService',
    'makeService',
    function ($rootScope, $scope, $timeout, userListsService, listService, makeService) {

      // User's lists
      var lastEmail;

      function refreshLists(done) {
        done = done || function () {};
        userListsService.get({
          user: $scope._user.id
        }, function (data) {
          $scope.usersLists = data.lists;
          done();
        }, function (err) {
          console.error(err);
        });
      }

      function getLists() {
        var email = $rootScope._user ? $rootScope._user.email : '';
        if (email && email !== lastEmail) {
          lastEmail = email;
          refreshLists();
        } else {
          lastEmail = '';
          $scope.usersLists = [];
        }
      }

      $rootScope.$watch('_user', getLists);

      $scope.deleteList = function (listId, event) {
        event.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this list?')) {
          return;
        }

        if ($scope.listLoaded && $scope.loadedListId === listId) {
          $scope.loadedList = $scope.loadedListId = $scope.listLoaded = null;
        }

        listService.delete({
          id: listId
        }, function () {
          refreshLists();
        }, function (err) {
          console.error(err);
        });
      };

      var escapeMap = {
        '&': '&amp;',
        '"': '&quot;',
        '\'': '&#39;',
        '<': '&lt;',
        '>': '&gt;'
      };

      function lookupEscape(ch) {
        return escapeMap[ch];
      }

      function sanitize(val) {
        return val.replace(/[&"'<>]/g, lookupEscape);
      }

      $scope.createList = function () {
        var title = sanitize(window.prompt('Enter a title!'));
        var description = sanitize(window.prompt('Enter a description!'));

        listService.save({}, {
          title: title,
          description: description,
          makes: [],
          userId: $rootScope._user.id,
          username: $rootScope._user.username
        }, function (data) {
          refreshLists(function () {
            $scope.loadList(data._id);
          });
        }, function (err) {
          console.error(err);
        });
      };

      getLists();

      // List editing
      $scope.listSaveInProgress = false;
      $scope.listSaveError = false;
      $scope.listSaveSuccess = false;

      $scope.sortableOptions = {
        containment: 'parent',
        tolerance: 'pointer',
        stop: function () {
          saveList($scope.loadedList.map(function (make) {
            return make._id;
          }));
        }
      };

      $scope.loadList = function (id) {
        listService.get({
          id: id
        }, function (data) {
          $scope.listLoaded = true;
          $scope.loadedList = data.makes;
          $scope.loadedListId = id;
        }, function (err) {
          console.error(err);
        });
      };

      function saveList(list) {
        listService.update({
          id: $scope.loadedListId
        }, {
          makes: list
        }, function () {
          $scope.listSaveInProgress = false;
          $scope.listSaveSuccess = true;
          $timeout(function () {
            $scope.listSaveSuccess = false;
          }, 2500);
        }, function () {
          $scope.listSaveInProgress = false;
          $scope.listSaveError = true;
          $timeout(function () {
            $scope.listSaveError = false;
          }, 2500);
        });
      }

      $scope.addMake = function (newMake) {

        var isInList = $scope.loadedList.some(function (make) {
          return make._id === newMake._id;
        });

        if (isInList) {
          return;
        }

        $scope.listSaveInProgress = true;

        $scope.loadedList.push(newMake);

        saveList($scope.loadedList.map(function (make) {
          return make._id;
        }));
      };

      $scope.removeMake = function (id) {
        $scope.listSaveInProgress = true;

        $scope.loadedList = $scope.loadedList.filter(function (make) {
          return make._id !== id;
        });

        saveList($scope.loadedList.map(function (m) {
          return m._id;
        }));
      };

      $scope.showPreview = function () {
        window.location.pathname = '/#!/' + $scope.loadedListId;
      };

      // Make Searching
      $scope.search = {};
      $scope.search.type = 'tags';
      $scope.doSearch = function () {
        makeService.search($scope.search.type, $scope.search.value, function (e, makes) {
          $scope.searchResults = makes;
          if (!$rootScope.$$phase) {
            $rootScope.$apply();
          }
        });
      };
    }
  ])
  .controller('listController', ['$rootScope', '$scope', '$routeParams', 'listService',
    function ($rootScope, $scope, $routeParams, listService) {
      listService.get({
        id: $routeParams.id
      }, function (data) {
        $scope.list = data;
      }, function (err) {
        console.error(err);
      });
    }
  ])
  .controller('verifyController', ['$scope', 'authService',
    function ($scope, authService) {
      authService.verify();
    }
  ]);
