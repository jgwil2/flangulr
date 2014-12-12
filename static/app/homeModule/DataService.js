
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
					var entries = $http.get('/api/posts').then(
						function(response){
							cacheEntries(response.data.entries);
							return response.data.entries;
						},
						function(response){
							FlashService.showError(response.data.message);
							return response.data.message;
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
					FlashService.showError(data.message);
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
					FlashService.showError(data.message);
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
					FlashService.showError(data.message);
				});
				return entry;
			}
		};
	}
]);