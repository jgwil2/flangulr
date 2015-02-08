
registerModule.controller('RegisterCtrl', ['$scope', 'RegisterService', '$state',
	function($scope, RegisterService, $location){

		// initialize credentials object
		$scope.credentials = {};

		$scope.register = function(){
			RegisterService.registerUser($scope.credentials).success(function(){
				$state.go('login');
			});
		};
	}
]);