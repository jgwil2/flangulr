
homeModule.controller('HomeCtrl', ['$scope', '$location', 'DataService', '$stateParams',
	function($scope, $location, DataService, $stateParams){

		// init entries object
		$scope.entries = {};

		$scope.entry = {};

		// get entries
		DataService.getEntries().then(function(entries){
			
			$scope.entries = entries;

			if(entries){
				// find entry to edit
				for (var i = 0,  len = entries.length; i < len; i++) {
					if(entries[i].id === parseInt($stateParams.entryId)){
						$scope.entry = entries[i];
						break;
					}
				}
			}
		});

		// add entry
		$scope.addEntry = function(){
			DataService.addEntry($scope.entry).success(function(){
				// clear fields on submit
				$scope.entry = {};
			});
		};

		// update entry
		$scope.updateEntry = function(){
			DataService.updateEntry($scope.entry.id, $scope.entry).success(function(){
				$location.path('/');
			});
		};

		// delete entry
		$scope.deleteEntry = function(){
			DataService.deleteEntry($scope.entry.id).success(function(){
				$location.path('/');
			});
		};
	}
]);