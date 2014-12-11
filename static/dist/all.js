// use function form of 'use strict'

// define app dependencies
var flangulr = angular.module('flangulr', [
	'ui.router',
	'authModule',
	'flashModule',
	'homeModule',
	'loginModule',
	'registerModule'
]);

var authModule = angular.module('authModule', []),
	flashModule = angular.module('flashModule', []),
	homeModule = angular.module('homeModule', []),
	loginModule = angular.module('loginModule', []),
	registerModule = angular.module('registerModule', []);


// ui-router
flangulr.config(['$stateProvider', '$urlRouterProvider', '$locationProvider',
	function($stateProvider, $urlRouterProvider, $locationProvider){
		// use HTML5 history api to avoid hash
		$locationProvider.html5Mode(true);
		// define states with route, template, controller
		$stateProvider
			.state('home', {
				url: '/',
				templateUrl: 'home.html',
				controller: 'HomeCtrl'
			})
			.state('edit', {
				url: '/edit/:entryId',
				templateUrl: 'edit.html',
				controller: 'HomeCtrl'
			})
			.state('login', {
				url: '/login',
				templateUrl: 'login.html',
				controller: 'LoginCtrl'
			})
			.state('register', {
				url: '/register',
				templateUrl: 'register.html',
				controller: 'RegisterCtrl'
			});

		// for now redirect all requests to home
		$urlRouterProvider.otherwise('/');
	}
]);

// appwide concerns can be placed on $rootScope where
// they will be accessible to all child scopes
flangulr.run(['$rootScope', 'AuthService', '$location', 'FlashService', '$state',
	function($rootScope, AuthService, $location, FlashService, $state){

		// Add $state to $rootScope so it will be accessible everywhere
		$rootScope.$state = $state;

		// Add FlashService to $rootScope to avoid injecting it in every controller
		$rootScope.flash = FlashService;

		// UNPROTECTED_ROUTES is array of all routes not requiring authentication
		var UNPROTECTED_ROUTES = ['/', '/login', '/register'];

		// on form submit, call AuthService's logout function
		// on success redirect to login page
		$rootScope.logout = function(){
			AuthService.logout().success(function(){
				$location.path('/login');
			});
		};

		// $rootScope listens for $locationChangeStart, an event that is 
		// broadcast at begining of URL change
		$rootScope.$on('$locationChangeStart', function(event){

			// add current user to root scope and update when routes change
			$rootScope.user = AuthService.getCurrentUser();

			// if new $location.path() is protected and user is not logged in,
			// redirect user to login page
			if(UNPROTECTED_ROUTES.indexOf($location.path()) < 0 && !AuthService.getCurrentUser()){
				$location.path('/login');
			}
		});
	}
]);

// AuthService handles login/logout by calling SessionService
authModule.factory('AuthService', ['SessionService', '$http', 'FlashService', 'CacheService',
	function(SessionService, $http, FlashService, CacheService){

		// private methods; set and unset sessions
		var cacheSession = function(user){
			SessionService.set('user', user);
		};

		var uncacheSession = function(){
			SessionService.unset('user');
		};

		// public methods 
		// use xhr to authenticate against db and store
		// server side sessions, and return promises that 
		// can be used in controllers for redirects, etc
		// login stores contacts data with CacheService
		return {
			login: function(credentials){
				var login = $http.post('/auth/login', credentials);
				login.success(function(data){
					cacheSession(data.user);
					//CacheService.put('contacts', data.contacts);
					//CacheService.put('tags', data.tags);
				});
				login.error(function(data){
					FlashService.showMessage(data.message);
				});
				return login;
			},
			logout: function(){
				var logout = $http.get('/auth/logout');
				logout.success(function(data){
					uncacheSession();
					FlashService.setMessage(data.message);
				});
				return logout;
			},
			getCurrentUser: function(){
				return SessionService.get('user');
			}
		};
	}
]);

// SessionService stores sessions in localStorage
authModule.factory('SessionService', [
	function(){
		return {
			get: function(key){
				return localStorage.getItem(key);
			},
			set: function(key, value){
				return localStorage.setItem(key, value);
			},
			unset: function(key){
				return localStorage.removeItem(key);
			}
		};
	}
]);

// FlashService emulates server side flash messaging
flashModule.factory('FlashService', ['$rootScope',
	function($rootScope){

		// set message queue and current message; when route
		// changes complete, current message gets first message
		// in queue or nothing if there is nothing left
		var queue = [];
		var currentMessage = '';

		$rootScope.$on('$locationChangeSuccess', function(){
			currentMessage = queue.shift() || '';
		});

		// public methods
		// Note: because on success we expect route to change
		// whereas on error we expect route to stay the same,
		// setMessage will show after one route change and
		// showMessage will add message immediately
		return {
			setMessage: function(message){
				queue.push(message);
			},
			showMessage: function(message){
				currentMessage = message;
			},
			getMessage: function(){
				return currentMessage;
			}
		};
	}
]);

// CacheService is the custom cache where contacts will be stored
homeModule.factory('CacheService', ['$cacheFactory',
	function($cacheFactory){
		return $cacheFactory('customData');
	}
]);

// DataService provides methods for CRUD operations
homeModule.factory('DataService', ['$http', 'CacheService', '$q', 'AuthService', 'FlashService',
	function($http, CacheService, $q, AuthService, FlashService){

		// private properties/methods
		var user = AuthService.getCurrentUser();
		// cache entries
		var cacheEntries = function(entries){
			CacheService.put('entries', entries);
		};
		// updates cache to reflect newly added entry without calling db again for fresh data
		var addToCachedEntries = function(newEntry){
			var cachedEntries = CacheService.get('entries');
			cachedEntries.unshift(newEntry);
			CacheService.put('entries', cachedEntries);
		};
		// updates cache to reflect newly updated entry without calling db again for fresh data
		var updateCachedEntries = function(id, entry){
			var cachedEntries = CacheService.get('entries');
			for (var i = 0, j = cachedEntries.length; i < j; i++) {
				if(cachedEntries[i].id == id){
					cachedEntries[i] = entry;
				}
			}
			CacheService.put('entries', cachedEntries);
		};
		// updates cache to reflect newly removed entry
		var removeFromCachedEntries = function(id){
			var cachedEntries = CacheService.get('entries');
			for (var i = 0, j = cachedEntries.length; i < j; i++) {
				if(cachedEntries[i].id == id){
					cachedEntries.splice(i, 1);
				}
			}
			CacheService.put('entries', cachedEntries);
		};
		
		// public methods
		// getEntries will first check cache to see if there is
		// entries data; if there is it returns promise with q
		// otherwise (as in page refresh) it calls server with 
		// username from AuthService, cleans up response so 
		// entries is already an array and hands promise back
		return {
			getEntries: function(){
				if(CacheService.get('entries')){
					return $q.when(CacheService.get('entries'));
				}
				else{
					var entries = $http.get('/api/posts')
						.then(function(response){
							cacheEntries(response.data.entries);
							return response.data.entries;
						});
					return entries;
				}
			},
			addEntry: function(newEntry){
				var entry = $http.post('/api/posts', newEntry);
				entry.success(function(data){
					addToCachedEntries(data.entry);
					FlashService.showMessage(data.message);
				});
				entry.error(function(data){
					FlashService.showMessage(data.message);
				});
				return entry;
			},
			updateEntry: function(id, updatedEntry){
				var entry = $http.put('/api/posts/' + id, updatedEntry);
				entry.success(function(data){
					updateCachedEntries(id, updatedEntry);
					FlashService.setMessage(data.message);
				});
				entry.error(function(data){
					FlashService.showMessage(data.message);
				});
				return entry;
			},
			deleteEntry: function(id){
				var entry = $http.delete('/api/posts/' + id);
				entry.success(function(data){
					removeFromCachedEntries(id);
					FlashService.setMessage(data.message);
				});
				entry.error(function(data){
					FlashService.showMessage(data.message);
				});
				return entry;
			}
		};
	}
]);

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

registerModule.controller('RegisterCtrl', ['$scope', 'RegisterService', '$location',
	function($scope, RegisterService, $location){

		// initialize credentials object
		$scope.credentials = {};

		$scope.register = function(){
			RegisterService.registerUser($scope.credentials).success(function(){
				$location.path('/login');
			});
		};
	}
]);

// RegisterService posts to create user
registerModule.factory('RegisterService', ['$http', 'FlashService',
	function($http, FlashService){
		return {
			registerUser: function(credentials){
				var register = $http.post('/api/users', credentials);
				register.success(function(data){
					FlashService.setMessage(data.message);
				});
				register.error(function(data){
					FlashService.showMessage(data.message);
				});
				return register;
			}
		};
	}
]);

loginModule.controller('LoginCtrl', ['$scope', 'AuthService', '$location',
	function($scope, AuthService, $location){

		// initialize credentials object
		$scope.credentials = {};

		// on form submit call AuthService's login function with user's credentials
		// on success, redirect to home page
		$scope.login = function(){
			AuthService.login($scope.credentials).success(function(){
				$location.path('/');
			});
		};
	}
]);