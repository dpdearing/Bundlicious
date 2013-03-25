			$(document).ready(function() {
				restorePreferences();
				
				// Enable form validation				
				var isFormValid = false;
			
			    $("#options_form").validationEngine({
			        inlineValidation: true,
			        success: function () {
						isFormValid = true;
					},
			        failure: function() {}
			    });
			
				// submission event
				$('#options_form').bind('submit', function(event) {
					if (isFormValid) {
						isFormValid = false;
						$('#save_button').attr('disabled', 'disabled');
						savePreferences();
					}
				});
				
				// enable save button if any changes
				$('input, select').bind('change keypress', function(event) {
					enableSave();
				});
				
				// restrict chars entering
				$('#number_of_recent').bind('keydown keypress', function(event) {
					var numeric = /\d/;
					if (!numeric.test(String.fromCharCode(event.which)) 
						&& (event.keyCode != backSpaceKeyCode && event.keyCode != deleteKeyCode
						&& event.keyCode != rightArrowKeyCode && event.keyCode != leftArrowKeyCode
						&& event.keyCode != homeKeyCode && event.keyCode != endKeyCode
						&& event.keyCode != tabKeyCode && event.keyCode != enterKeyCode)) {
						return false;
					}
				});
			});
			
			function enableSave() {
				$('#save_button').attr('disabled', false);
			}
			
			function savePreferences() {
				var chromicious = Chromicious.getInstance();
				
				if ($('#sync_interval').val() != chromicious.storage.getBookmarksSyncInterval()) {
					chromicious.restartSynchronization();
				}
				
				chromicious.storage.setBookmarksSyncInterval($('#sync_interval').val());
				chromicious.storage.setNumberOfRecentBookmarks($('#number_of_recent').val());

				displayNotification('Preferences have been saved.', 3000);
			}
			
			function restorePreferences() {
				var chromicious = Chromicious.getInstance();

				if (chromicious.isUserAuthorized()) {
					var loggedUsername = chromicious.storage.getUsername();

					$('#yahooid_lbl').html('You are logged in as <a target="_blank" href="http://delicious.com/' + loggedUsername + '">' + loggedUsername + '</a>');
					$('#yahooid_login_lbl').html('<a href="http://delicious.com/logout" target="_blank">Sign Out</a>');
					
					$('#sync_interval').attr('disabled', false);
				} else {
					$('#yahooid_lbl').html('Do you have a Yahoo! or Delicious Account?<br/>');
					$('#yahooid_login_lbl').html('<a href="http://delicious.com/login" target="_blank">Sign In</a>');
				}

				var syncInterval = (chromicious.storage.getBookmarksSyncInterval() != null) ? 
					chromicious.storage.getBookmarksSyncInterval(): SYNC_INTERVAL;

				$('#sync_interval').html('');
				for (option in syncOptions) {
				 	var selected = (option == syncInterval) ? 'selected' : '';
					$('<option value="'+option+'" '+selected+'>'+syncOptions[option]+'</option>').appendTo('#sync_interval');
				}

				var numberOfRecent = (chromicious.storage.getNumberOfRecentBookmarks() != null) ?
					chromicious.storage.getNumberOfRecentBookmarks() : RECENT_BOOKMARKS_TOTAL;
				$('#number_of_recent').val(numberOfRecent);
			}