'use strict';

var flangulrServices = angular.module('flangulrServices', []);

// FlashService emulates server side flash messaging
flangulrServices.factory('FlashService', ['$rootScope',
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

// AuthService handles login/logout by calling SessionService
flangulrServices.factory('AuthService', ['SessionService', '$http', 'FlashService', 'CacheService',
	function(SessionService, $http, FlashService, CacheService){

		// private methods; set and unset sessions
		var cacheSession = function(user){
			SessionService.set('user', user);
		}

		var uncacheSession = function(){
			SessionService.unset('user');
		}

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
				})
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

// DataService provides methods for CRUD operations
flangulrServices.factory('DataService', ['$http', 'CacheService', '$q', 'AuthService', 'FlashService',
	function($http, CacheService, $q, AuthService, FlashService){

		// private properties/methods
		var user = AuthService.getCurrentUser()
		// cache entries
		var cacheEntries = function(entries){
			CacheService.put('entries', entries);
		}
		// updates cache to reflect newly added entry without calling db again for fresh data
		var addToCachedEntries = function(newEntry){
			var cachedEntries = CacheService.get('entries');
			cachedEntries.unshift(newEntry);
			CacheService.put('entries', cachedEntries);
		}
		// updates cache to reflect newly updated entry without calling db again for fresh data
		var updateCachedEntries = function(id, entry){
			var cachedEntries = CacheService.get('entries');
			for (var i = 0, j = cachedEntries.length; i < j; i++) {
				if(cachedEntries[i]['id'] == id){
					cachedEntries[i] = entry;
				}
			}
			CacheService.put('entries', cachedEntries);
		}
		// updates cache to reflect newly removed entry
		var removeFromCachedEntries = function(id){
			var cachedEntries = CacheService.get('entries');
			for (var i = 0, j = cachedEntries.length; i < j; i++) {
				if(cachedEntries[i].id == id){
					cachedEntries.splice(i, 1);
				}
			}
			CacheService.put('entries', cachedEntries);
		}
		
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

// CacheService is the custom cache where contacts will be stored
flangulrServices.factory('CacheService', ['$cacheFactory',
	function($cacheFactory){
		return $cacheFactory('customData');
	}
]);

// RegisterService posts to create user
flangulrServices.factory('RegisterService', ['$http', 'FlashService',
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

// SessionService stores sessions in localStorage
flangulrServices.factory('SessionService', [
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