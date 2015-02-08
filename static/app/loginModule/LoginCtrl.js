
loginModule.controller('LoginCtrl', ['$scope', 'AuthService', '$state',
	function($scope, AuthService, $state){

		// initialize credentials object
		$scope.credentials = {};

		// on form submit call AuthService's login function with user's credentials
		// on success, redirect to home page
		$scope.login = function(){
			AuthService.login($scope.credentials).success(function(){
				$state.go('home');
			});
		};
	}
]);