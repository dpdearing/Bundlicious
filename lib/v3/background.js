
var chromiciousInstance = null;

initialize();

//FIN

////////////////////////////////////////////////////////////////////////////////

function getChromiciousInstance() {
	return chromiciousInstance;
}

////////////////////////////////////////////////////////////////////////////////

function initialize() {
	if (chromiciousInstance == null) {
		console.log('Starting new Chromicious instance');
		chromiciousInstance = new Chromicious();
		
		chrome.contextMenus.create({"title": "Bookmark This Page", "contexts":["page"],
                                    "onclick": saveBookmark});

	}
	
	loadAuthorizationTriggers(chromiciousInstance);
	
	/* if user is authorized with delicious then start synchronization interval */
	console.log('background restarting synchronization');
	chromiciousInstance.restartSynchronization();
	
	
	console.log('TODO [dpd] handle first use');
	// if (chromiciousInstance.storage.isFirstLoad()) {
		// chromiciousInstance.storage.setFirstLoad(0);
	// 
		// preferencesWindow();
	// }

//	chrome.extension.onConnect.addListener(function(port) {
//		port.onMessage.addListener(function(msgObj) {
//			if (msgObj.msg == 'saveBookmark') {
//				saveBookmark();
//			}
//		});
//	});
				
	// clean legacy data from storage
	chromiciousInstance.storage.cleanLegacy();
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Adapted from Chromicious bgprocess.html by Andrey Yasinetskiy (yasinecky@gmail.com)
 */
function loadAuthorizationTriggers(bundliciousInstance) {
	try {
		console.log('background trying to add onConnect listener');
		chrome.extension.onConnect.addListener(function(port) {
			console.log('background onConnect:"'+port.name+'"');
			try {
				console.log('background now trying to add an onMessage listener ');
				port.onMessage.addListener(function(msgObj) {
					console.log('background message received: ' + msgObj.msg);
					
					if (msgObj && msgObj.msg && msgObj.msg == 'updateCookies') {
						var storedCookie = bundliciousInstance.storage.getAuthInfo();
						
						var username=bundliciousInstance.getUsernameFromCookie(msgObj.cookie);
		                if (!storedCookie && msgObj.cookie) {
							console.log('User '+username+' logs in.');
			
							bundliciousInstance.storage.setAuthInfo(msgObj.cookie);
							bundliciousInstance.storage.setUsername(bundliciousInstance.getUsernameFromCookie(msgObj.cookie));
		                  	bundliciousInstance.synchronize();
							bundliciousInstance.sendEvent('updateOptionsWindow');
		                } else if (storedCookie && msgObj.cookie && storedCookie != msgObj.cookie) {
							console.log('User '+username+' changes login details.');

		                  	bundliciousInstance.storage.setAuthInfo(msgObj.cookie);
							bundliciousInstance.storage.setUsername(bundliciousInstance.getUsernameFromCookie(msgObj.cookie));
							bundliciousInstance.storage.removeAll();
							bundliciousInstance.synchronize();
							bundliciousInstance.sendEvent('updateOptionsWindow');
		                } else if (storedCookie && !msgObj.cookie) {
							console.log('User '+username+' logs out.');
			
							bundliciousInstance.storage.setAuthInfo('');
							bundliciousInstance.storage.setUsername('');
		                  	bundliciousInstance.storage.removeAll();
							bundliciousInstance.stopSynchronization();
							bundliciousInstance.sendEvent('updateOptionsWindow');
		                } // else storedCookie == msgObj.cookie
					}
				});
			} catch (e) {
				console.log('Unable to add listeners in background.');
			}
		});
	} catch (e) {
		console.log('Unable to open extension port in background.');
	}
}

////////////////////////////////////////////////////////////////////////////////


if (window.location && isDeliciousHost(window.location.hostname)) {
	if (document.cookie) {
		var cookie = getCookie('_user');
		port = chrome.extension.connect();
		port.postMessage({msg: 'updateCookies', cookie: cookie});
	} else {
    	console.log('Unable to retrive delicious cookies.');
		port = chrome.extension.connect();
    	port.postMessage({msg: 'updateCookies', cookie: null});
  }
}

chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {
		if (request.id == 'getPageDetails') {
            sendResponse(composeBookmarkObject());
		}
	}
);

function composeBookmarkObject() {
	var url = window.location.href;
	var title = document.title;
	if (!url) {
		return null;
	}

	var notes = '';
	var selection = window.getSelection();
	if (selection && selection.toString().length) {
		notes = selection.toString();
	}

	return {
		url: url,
		title: title,
		notes: notes
	};
}

function getCookie(cookieName) {
    var dCookie = document.cookie;
    var cookieLen = dCookie.length;
	if (cookieLen) {
		var beg = dCookie.indexOf(cookieName + '=');
		if (beg != -1) {
			var delim = dCookie.indexOf(";", beg);
			if (delim == -1) delim = cookieLen;
			return dCookie.substring(beg, delim);
		}
	}

	return '';
}

$(document).keydown(function(e) {
	if (e.ctrlKey) {		
		if (e.which == 68) {
			port = chrome.extension.connect();
			port.postMessage({msg: 'saveBookmark'});
		}
	}
});