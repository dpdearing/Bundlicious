/**
 * @author Andrii Yasynetskyy (yasinecky@gmail.com)
 */
/**
 * @author David Dearing (dpdearing.com)
 */

//const CHROMICIOUS_VERSION = '2.5.2';
const CHROMICIOUS_VERSION = '2.5.2.1';
const BUNDLICIOUS_VERSION = '0.0.0.1';

// cosntants
const BOOKMARKS_BAR 			= 'Bookmarks Bar';

const TAG_DELIMETER				= ' ';
const TAG_JOIN					= '+';

// URLs
var SAVE_URL = 'http://www.delicious.com/save?v=5&noui=1&jump=close&url=';

const MY_BOOKMARKS_URL 			= 'http://delicious.com';
const BACKGROUND_URL 			= '/background.html';
const SEARCH_BOOKMARKS_URL 		= '/bookmarks.html';
const PREFERENCES_WINDOW_URL 	= '/preferences.html';

// API URLs
const DELICIOUS_ALL_URL 	= 'https://api.del.icio.us/v1/posts/all';
const DELICIOUS_ALL_TAG_URL = 'https://api.del.icio.us/v1/posts/all?tag=';
const DELICIOUS_TAGS_URL 	= 'https://api.del.icio.us/v1/tags/get'
const DELICIOUS_BUNDLES_URL = 'https://api.del.icio.us/v1/tags/bundles/all';

// Windows params
const SAVE_WINDOW_HEIGHT 	= 550;//440;
const SAVE_WINDOW_WIDTH 	= 550;//700;

// RegExp for catch pages title
var RE_TITLE = new RegExp('<title>[\n\r\s]*(.*)[\n\r\s]*</title>', 'gmi');

const CHECK_UPDATES_INTERVAL = 5000;

// Bookmarks params
const RECENT_BOOKMARKS_TOTAL 	= 20;
const POPULAR_TAGS_NUMBER 		= 25;
const SYNC_INTERVAL 			= 600000; // 1 hour

// Common used keycodes
var tabKeyCode 			= 9;
var enterKeyCode 		= 13;
var backSpaceKeyCode 	= 8;
var deleteKeyCode 		= 46;
var rightArrowKeyCode 	= 39;
var leftArrowKeyCode 	= 37;
var homeKeyCode 		= 36;
var endKeyCode 			= 35;

var syncOptions = new Array();
//syncOptions['300000'] = 'Every 5 minutes';
syncOptions['750000'] = 'Every 15 minutes';
syncOptions['1800000'] = 'Every 30 minutes';
syncOptions['3600000'] = 'Every hour';

// Database params
const DATABASE_NAME = 'chromicious_bookmarks';
const DATABASE_SIZE = 5 * 1024 * 1024;

function openMyBookmarks() {
	chrome.windows.getCurrent(function createTab(chromewindow){
		var mybookmarkstab = new Object();
		mybookmarkstab.windowId = chromewindow.id;
		mybookmarkstab.url = MY_BOOKMARKS_URL;
		mybookmarkstab.selected = true;
		
		// creates new tab with specified URL
		chrome.tabs.create(mybookmarkstab, null);
	});
}

function searchMyBookmarks() {
	chrome.windows.getCurrent(function (chromewindow) {
        var searchWindow = window.open(
			SEARCH_BOOKMARKS_URL, "searchBookmarkWindow_" + SEARCH_BOOKMARKS_URL,
            "toolbar=no, height=700," +
            "width=450"
		);

		searchWindow.focus();
	});
}

function preferencesWindow() {
        var preferencesWindow = window.open(
                        PREFERENCES_WINDOW_URL+'?tab=0', "preferencesWindow_" + PREFERENCES_WINDOW_URL,
            "toolbar=no, height=430," +
            "width=470"
                );
        preferencesWindow.focus();
}

function saveBookmark() {
    // Listen for notifications from the content script.
    chrome.windows.getCurrent(function selectCurrentTab(chromewindow) {
		chrome.tabs.getSelected(chromewindow.id, function tabHandler(chrometab) {
		// try to determine page info while tab is loading
		
		chrome.tabs.sendRequest(chrometab.id, {id: 'getPageDetails'}, function(response) {
			var url = SAVE_URL + encodeURIComponent(response.url) +
                    "&title=" + encodeURIComponent(response.title) +
                    "&notes=" + encodeURIComponent(response.notes);
			console.log("saving Bookmark url="+url)
			// construct delicious window
			var saveWindow = window.open(
				url, "chromicious_save"+url,
                    "links=no, scrollbars=no, toolbar=no, height=" + SAVE_WINDOW_HEIGHT + "," +
                    "width=" +  SAVE_WINDOW_WIDTH + "");
			
			saveWindow.focus();
			});
		});
	});
}