
// FlashService emulates server side flash messaging
flashModule.factory('FlashService', ['$rootScope',
	function($rootScope){

		// set message queue and current message; when route
		// changes complete, current message gets first message
		// in queue or nothing if there is nothing left
		var messageQueue = [],
			errorQueue = [],
			currentMessage = '',
			currentError = '';

		$rootScope.$on('$stateChangeSuccess', function(){
			currentMessage = messageQueue.shift() || '';
			errorMessage = errorQueue.shift() || '';
		});

		// public methods
		// Note: two methods each for setting error/success messages:
		// set methods expect route to change and should be used with
		// $state.go()
		// show methods will show message immediately and should be
		// used when route will not change
		// Typically a route will change on success and remain the
		// same on error, but all four methods are provided as this 
		// is not lways the case.
		return {
			setMessage: function(message){
				messageQueue.push(message);
			},
			showMessage: function(message){
				currentMessage = message;
			},
			getMessage: function(){
				return currentMessage;
			},
			setError: function(error){
				errorQueue.push(error);
			},
			showError: function(error){
				currentError = error;
			},
			getError: function(){
				return currentError;
			}
		};
	}
]);