'use strict';

var flangulrControllers = angular.module('flangulrControllers', []);

flangulrControllers.controller('LoginCtrl', ['$scope', 'AuthService', '$location',
	function($scope, AuthService, $location){

		// initialize credentials object
		$scope.credentials = {};

		// on form submit call AuthService's login function with user's credentials
		// on success, redirect to home page
		$scope.login = function(){
			AuthService.login($scope.credentials).success(function(){
				$location.path('/');
			})
		}
	}
]);

flangulrControllers.controller('RegisterCtrl', ['$scope', 'RegisterService', '$location', 'AuthService',
	function($scope, RegisterService, $location, AuthService){

		// initialize credentials object
		$scope.credentials = {};

		$scope.register = function(){
			RegisterService.registerUser($scope.credentials).success(function(){
				$location.path('/login');
			});
		}
	}
]);

flangulrControllers.controller('HomeCtrl', ['$scope', 'AuthService', '$location', 'DataService', '$stateParams',
	function($scope, AuthService, $location, DataService, $stateParams){

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
		}

		// update entry
		$scope.updateEntry = function(){
			DataService.updateEntry($scope.entry.id, $scope.entry).success(function(){
				$location.path('/');
			});
		}

		// delete entry
		$scope.deleteEntry = function(){
			DataService.deleteEntry($scope.entry.id).success(function(){
				$location.path('/');
			})
		}
	}
]);