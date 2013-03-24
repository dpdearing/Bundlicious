document.addEventListener('DOMContentLoaded', function () {

  var save = document.getElementById("save_bookmark");
  save.children[0].addEventListener("click", saveBookmark, false);

  var search = document.getElementById("my_bookmarks");
  search.children[0].addEventListener("click", searchMyBookmarks, false);

  var home = document.getElementById("open_delicious");
  home.children[0].addEventListener("click", openMyBookmarks, false);
  
  var options = document.getElementById("chromicious_options");
  options.children[0].addEventListener("click", preferencesWindow, false);
  
});
