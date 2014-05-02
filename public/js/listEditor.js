document.addEventListener("DOMContentLoaded", function() {

  var $loginEl = $('.login'),
      $logoutEl = $('.logout'),
      $saveListBtn = $('#save-list-btn'),
      $viewListBtn = $('#view-list-btn'),
      $newListBtn = $('#new-list-btn');

  var userId,
      username;

  var $liTemplate = $('<li class="thumbnail"></li>');
  var $tableTemplate = $('<tr><td></td></tr>');
  var $deleteBtn = $('<span class="fa fa-trash-o delete-btn"></span>');
  var $loadedList = $('#loaded-list');

  var csrfToken = $('meta[name=\'csrf-token\']').attr('content');

  $.ajaxSetup({
    contentType: "application/json",
    headers: {
      "X-CSRF-Token": csrfToken
    },
    dataType: "json"
  });

  var makeClient = new Make({
    apiURL: $('meta[name=\'makeapi-url\']').attr('content')
  });

  // set up the WebmakerAuthClient
  // for a list of all options visit https://github.com/mozilla/webmaker-auth-client#configure
  var auth = new WebmakerAuthClient({
    handleNewUserUI: false,
    csrfToken: csrfToken
  });

  $saveListBtn.hide();
  $viewListBtn.hide();

  // Specify a callback function for when the auth client successfully authenticates
  auth.on('login', function(data, message) {
    $loginEl.parent().addClass('hidden');
    $logoutEl.parent().removeClass('hidden');
  });

  // Specify a callback function for when the auth client successfully logs out
  auth.on('logout', function() {
    $loginEl.parent().removeClass('hidden');
    $logoutEl.parent().addClass('hidden');
  });

  // If there's an error logging in, run the specified callback
  auth.on('error', function(err) {
    alert(err);
  });

  function loadList(id) {
    var $loadedList = $('#loaded-list');
    $loadedList.empty();
    $.getJSON('list/' + id, function(data) {
      data.forEach(function(make) {
        addToList(make._id, make.title, make.thumbnail, make.url, make.author);
      });
      $loadedList.attr('data-list-id', id);
      $loadedList.sortable({ containment: "parent" });
      $saveListBtn.show();
      $viewListBtn.show();
    });
  }

  function getLists(userId) {
    $.getJSON('lists/' + userId, function(data) {
      var $userLists = $('#user-lists');
      $userLists.empty();
      data.lists.forEach(function(list) {
        $userLists.append(
          $tableTemplate
          .clone()
          .find("td")
          .attr('data-list-id', list._id)
          .text(list.title)
          .append(
            $deleteBtn
            .clone()
            .click(function( e ) {
              e.stopPropagation();
              e.preventDefault();
              var $this = $(this);
              $.ajax({
                url: 'list/' + $this.parent().attr('data-list-id'),
                type: 'delete',
                success: function() {
                  alert('list Deleted!');
                  getLists(userId);
                  $this.parent().remove();
                  $loadedList.empty();
                  $saveListBtn.hide();
                  $viewListBtn.hide();
                },
                error: function() {
                  alert('error Deleting');
                }
              });
            })
          )
          .click(function() {
            loadList($(this).attr('data-list-id'));
          })
          .parent()
        );
      });
    });
  }

  auth.on('login', function(data) {
    getLists(data.id);
    userId = data.id;
    username = data.username;
  });

  $saveListBtn.click(function() {
    var $list = $('#loaded-list');

    listData = [].map.call($list.children('li'), function(el) {
      return $(el).attr('data-make-id');
    });

    $.ajax({
      url: 'list/' + $list.attr('data-list-id'),
      type: 'put',
      data: JSON.stringify({
        makes: listData
      }),
      success: function() {
        alert('list saved!');
      },
      error: function() {
        alert('error saving');
      }
    });
  });

  function addToList(id, title, thumbnail, url, author) {
    $loadedList.append(
      $liTemplate
      .clone()
      .attr('data-make-id', id)
      .append('<image class="make-thumb" src="' + thumbnail + '"/>')
      .append('Title: <a href="'+ url + '">' + title + '</a>')
      .append('<span> By: ' + author + '</span>')
      .append(
        $deleteBtn
        .clone()
        .click(function() {
          $(this).parent().remove();
        })
      )
    );
  }

  function search() {
    makeClient.tags( $('#search').val()).then(function( err, makes ) {
      if ( err ) {
        return alert( err );
      }
      var $list = $('#make-search-list');
      $list.empty();
      makes.forEach(function(make) {
        $list.append(
          $liTemplate.clone()
          .attr('data-make-id', make.id)
          .attr('data-make-thumbnail', make.thumbnail)
          .attr('data-make-url', make.url)
          .attr('data-make-author', make.author)
          .append('<image class="make-thumb" src="' + make.thumbnail + '"/>')
          .append('Title: <a href="'+ make.url + '">' + make.title + '</a>')
          .append('<span> By: ' + make.author + '</span>')
          .click(function() {
            var that = $(this),
                title = that.text(),
                id = that.attr('data-make-id'),
                url = that.attr('data-make-url'),
                thumbnail = that.attr('data-make-thumbnail'),
                author = that.attr('data-make-author');

            addToList(id, title, thumbnail, url, author);
          })
        );
      });
    });
  }

  $('#search')
  .blur(search)
  .keypress(function(e) {
    if ( e.keyCode === 13 ) {
      e.preventDefault();
      search();
    }
  });

  $viewListBtn.click(function() {
    window.open('/view/' + $loadedList.attr('data-list-id'), '_blank');
  });

  $newListBtn.click(function() {
    var title = prompt("Enter a title!");

    $.ajax({
      url: 'list',
      type: 'post',
      data: JSON.stringify({
        title: title,
        makes: [],
        userId: userId,
        username: username
      }),
      success: function() {
        alert('list Created!');
        getLists(userId);
      },
      error: function() {
        alert('error Creating');
      }
    });
  });

  // Verify confirms with the app server that the current session cookie is valid
  // verify can trigger a login or logout event based on the server's response.
  auth.verify();

  // Assign the login and logout actions on the webmaker auth client API to the log-in and log-out buttons
  $loginEl.click(auth.login);
  $logoutEl.click(auth.logout);

});
