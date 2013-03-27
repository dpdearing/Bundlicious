/**
 * @author Andrey Yasinetskiy (yasinecky@gmail.com)
 * 
 * Adapted from Chromicious by @author David Dearing (dpdearing@gmail.com)
 */

function deliciousRequest(endpoint, completeCallback) {
	console.log("deliciousRequest:"+endpoint);
	setTimeout(function() {
		$.ajax( {
			type : "POST",
			url : endpoint,
			dataType : "xml",
			contentType: "application/x-www-form-urlencoded",
			beforeSend : function(req) {
				req.setRequestHeader('Authorization', 'Basic ' + btoa("cookie:cookie"));
				req.setRequestHeader('X-Chromicious-Delicious-Client', '1');
				req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
			},
			processData : false,
			data: Chromicious.getInstance().storage.getAuthInfo(),
			error : function(xml, textStatus, errorThrown) {
				triggerSyncError('Request failed: ' + textStatus + '. Response was: ' + xml.responseText);
			},
			complete : completeCallback
		});
	}, 5000);
}

////////////////////////////////////////////////////////////////////////////////

function startSynchronizationProcess() {
	var chromicious = Chromicious.getInstance();

	chromicious.storage.setSyncProcessStarted(1);

	//TODO sendEvent syncProcessStarted to update the View
	//chromicious.sendEvent('syncProcessStarted', null);
	
	syncBookmarksAsync();
	syncBundlesAsync();
}

////////////////////////////////////////////////////////////////////////////////

function syncBookmarksAsync() {
	deliciousRequest(DELICIOUS_ALL_URL,		
		/* A function to be called when the request finishes (after success and error callbacks are executed). */
		function(response, status) {
			if (status == 'error') {
				triggerSyncError('Request finished with: ' + status + '. Response was: ' + response.responseText);
				return;
			}

			parseAndSaveBookmarksResponse(response.responseText, function() {
				
				deliciousRequest(DELICIOUS_TAGS_URL,
					function(response, status) {
						if (status == 'error') {
							triggerSyncError('Request finished with: ' + status + '. Response was: ' + response.responseText);
							return;
						}

						parseAndSaveTagsResponse(response.responseText, function() {
							
							triggerSyncSuccess();
							
						}, function() { console.log('Error saving tags to database.'); });
					}
				);

			}, function() { console.log('Error saving bookmarks to database.'); });
		});	
}

////////////////////////////////////////////////////////////////////////////////

function syncBundlesAsync() {
	deliciousRequest(DELICIOUS_BUNDLES_URL,		
		/* A function to be called when the request finishes (after success and error callbacks are executed). */
		function(response, status) {
			if (status == 'error') {
				triggerSyncError('Request finished with: ' + status + '. Response was: ' + response.responseText);
				return;
			}

			if (status == 'success' && response)
				parseAndSaveBundlesResponse(response.responseText);
		});
}

////////////////////////////////////////////////////////////////////////////////

function triggerSyncSuccess() {
	var chromicious = Chromicious.getInstance();
	
	var currentDatetime = new Date();
	
	//TODO sendEvent onSyncSuccess to update the View
	//chromicious.sendEvent('onSyncSuccess', null);
	chromicious.storage.setLastStatus('success');
	chromicious.storage.setSyncProcessStarted(0);
	chromicious.storage.setLastFinishTime(currentDatetime.getTime());
	
	console.log('Bookmarks have been synchronized.');
}

////////////////////////////////////////////////////////////////////////////////

function triggerSyncError(logMessage) {
	var chromicious = Chromicious.getInstance();
	
	var currentDatetime = new Date();
	
	chromicious.sendEvent('onSyncFailure', null);
	chromicious.storage.setLastStatus('error');
	chromicious.storage.setSyncProcessStarted(0);
	chromicious.storage.setLastFinishTime(currentDatetime.getTime());
	
	console.log(logMessage);
}

////////////////////////////////////////////////////////////////////////////////

function parseAndSaveBookmarksResponse(xmlResponse, successCallback, errorCallback) {
	if (xmlResponse != '' && xmlResponse != null) {
		Chromicious.getInstance().storage.saveBookmarksFromXML(xmlResponse, errorCallback, successCallback);
	}
}

////////////////////////////////////////////////////////////////////////////////

function parseAndSaveTagsResponse(xmlResponse, successCallback, errorCallback) {
	if (xmlResponse != '' && xmlResponse != null) {
		Chromicious.getInstance().storage.saveTagsFromXML(xmlResponse, errorCallback, successCallback)
	}
}

////////////////////////////////////////////////////////////////////////////////

function parseAndSaveBundlesResponse(xmlResponse) {
	if (xmlResponse != '' && xmlResponse != null) {
		findBookmarksBarAnd(syncBundlesTo, xmlResponse);
	}
}

////////////////////////////////////////////////////////////////////////////////

function syncTagsTo(folder, tags) {
	var chromicious = Chromicious.getInstance();

	console.debug('sync tags:'+tags);

	$(tags).each(
		function(i) {

	deliciousRequest(DELICIOUS_ALL_TAG_URL+this,		
		/* A function to be called when the request finishes (after success and error callbacks are executed). */
		function(response, status) {
			if (status == 'error') {
				triggerSyncError('Request finished with: ' + status + '. Response was: ' + response.responseText);
				return;
			}

			if (status == 'success' && response) {
				parseAndSaveBundleBookmarks(folder, response.responseText);
			}
		});
	});
}

////////////////////////////////////////////////////////////////////////////////

function parseAndSaveBundleBookmarks(folder, xmlResponse) {
	if (xmlResponse != '' && xmlResponse != null) {
		console.debug('sync bookmarks to bundle id='+folder.id+':'+folder.title);
		$(xmlResponse).find("post").each(
		 function(i) {
			var description = $(this).attr('description');
			var href = $(this).attr('href');

			chrome.bookmarks.create({'parentId': folder.id,
									 'title': description,
									 'url': href},
				function(bookmark) {
  					console.debug("created bookmark: " + bookmark.title);
					console.debug('\t'+bookmark.url);
				}
			);

		 }
		);

	}
}

////////////////////////////////////////////////////////////////////////////////

function findBookmarksBarAnd(sync, xml) {
	// start searching from the root.  One of these will be Bookmarks Bar 
	chrome.bookmarks.getChildren('0', function(children) {
  		children.forEach(function(bookmark) {
  			if (bookmark.title === BOOKMARKS_BAR) {
  				console.debug('found Bookmarks Bar @ '+bookmark.id);
  				sync(bookmark.id, xml);
  			}
		});
	});
}

////////////////////////////////////////////////////////////////////////////////

function syncBundlesTo(bookmarkBarId, xml) {
	console.debug('sync to bookmark parent id='+bookmarkBarId);
	
	$(xml).find("bundle").each(
		function(i) {
			var name = $(this).attr('name');
			var tags = $(this).attr('tags').split(TAG_DELIMETER);

			createFolder(bookmarkBarId, name,
				function(newFolder) { syncTagsTo(newFolder, tags); });
		}
	);
}

////////////////////////////////////////////////////////////////////////////////

function createFolder(parentId, folderName, callback) {
	chrome.bookmarks.getChildren(parentId, function(children) {
		// now now, no duplicates!
		if (!bookmarkExists(children, folderName)) {
			chrome.bookmarks.create({'parentId': parentId,
									 'title': folderName},
				function(newFolder) {
  					console.log("created folder: " + newFolder.title);
					callback(newFolder);
				}
			);
		}
		else {
			console.debug("skipping duplicate bundle for: "+folderName);
		}
		
	});
}

////////////////////////////////////////////////////////////////////////////////

function bookmarkExists(bookmarks, bundleName) {
	return bookmarks.some(function(bookmark, index, array) {
		return (bookmark.title === bundleName);
	});
}

////////////////////////////////////////////////////////////////////////////////

function performSearch(keyword, displayCallback) {
	Chromicious.getInstance().storage.searchBookmarks(keyword, function(tx, resultSet) {
		displayCallback(resultSet);
	}, function(error) {
		displayError('Database error while search bookmarks.', 3000);
	});
}

////////////////////////////////////////////////////////////////////////////////

function performSearchByTag(tag, displayCallback) {
	Chromicious.getInstance().storage.getBookmarksByTag(tag, null, function(tx, resultSet) {
		displayCallback(resultSet);
	}, function(error) {
		displayError('Database error while search by tag.', 3000);
	});
}

////////////////////////////////////////////////////////////////////////////////

