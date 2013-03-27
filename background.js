
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
	
	
	if (chromiciousInstance.storage.isFirstLoad()) {
		chromiciousInstance.storage.setFirstLoad(0);
		preferencesWindow();
	}

	// clean legacy data from storage
	chromiciousInstance.storage.cleanLegacy();
}

////////////////////////////////////////////////////////////////////////////////

/**
 * Adapted from Chromicious bgprocess.html by Andrey Yasinetskiy (yasinecky@gmail.com)
 */
function loadAuthorizationTriggers(chromiciousInstance) {
	try {
		chrome.extension.onConnect.addListener(function(port) {
			console.debug('background got onConnect');
			try {
				port.onMessage.addListener(function(msgObj) {
					console.debug('background got a message: ' + msgObj.msg);
					
					if (msgObj && msgObj.msg && msgObj.msg == 'updateCookies') {
						var storedCookie = chromiciousInstance.storage.getAuthInfo();
						
						var username=chromiciousInstance.getUsernameFromCookie(msgObj.cookie);
		                if (!storedCookie && msgObj.cookie) {
							console.log('User '+username+' logs in.');
			
							chromiciousInstance.storage.setAuthInfo(msgObj.cookie);
							chromiciousInstance.storage.setUsername(chromiciousInstance.getUsernameFromCookie(msgObj.cookie));
							chromiciousInstance.synchronize();
							chromiciousInstance.sendEvent('updateOptionsWindow');
		                } else if (storedCookie && msgObj.cookie && storedCookie != msgObj.cookie) {
							console.log('User '+username+' changes login details.');

							chromiciousInstance.storage.setAuthInfo(msgObj.cookie);
							chromiciousInstance.storage.setUsername(chromiciousInstance.getUsernameFromCookie(msgObj.cookie));
							chromiciousInstance.storage.removeAll();
							chromiciousInstance.synchronize();
							chromiciousInstance.sendEvent('updateOptionsWindow');
		                } else if (storedCookie && !msgObj.cookie) {
							console.log('User '+username+' logs out.');
			
							chromiciousInstance.storage.setAuthInfo('');
							chromiciousInstance.storage.setUsername('');
							chromiciousInstance.storage.removeAll();
							chromiciousInstance.stopSynchronization();
							chromiciousInstance.sendEvent('updateOptionsWindow');
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

