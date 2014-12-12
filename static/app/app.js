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