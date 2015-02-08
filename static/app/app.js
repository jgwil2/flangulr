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
flangulr.run(['$rootScope', 'AuthService', 'FlashService', '$state',
	function($rootScope, AuthService, FlashService, $state){

		// UNPROTECTED_ROUTES is array of all routes not requiring authentication
		var UNPROTECTED_ROUTES = ['home', 'login', 'register'];

		var redirectIfNotAuthorized = function(toState){
			// add current user to root scope and update when routes change
			$rootScope.user = AuthService.getCurrentUser();
			// if new $state.current is protected and user is not logged in,
			// redirect user to login page
			if(UNPROTECTED_ROUTES.indexOf(toState.name) < 0 && !AuthService.getCurrentUser()){
				$state.go('login');
			}
		};

		// Add $state to $rootScope so it will be accessible everywhere
		$rootScope.$state = $state;

		// Add FlashService to $rootScope to avoid injecting it in every controller
		$rootScope.flash = FlashService;

		// on form submit, call AuthService's logout function
		// on success redirect to login page
		$rootScope.logout = function(){
			AuthService.logout().success(function(){
				$state.go('login');
			});
		};

		// $rootScope listens for $stateChangeSuccess, an event that is
		// broadcast at the end of state change
		// its callback takes parameter toState, which will be compared to whitelist
		// $stateChangeSuccess is used rather than $stateChangeStart because when the app
		// is initially loaded, there may be no state against which to compare the whitelist
		$rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
			redirectIfNotAuthorized(toState);
		});
	}
]);