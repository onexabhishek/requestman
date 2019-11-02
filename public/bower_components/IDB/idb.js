;(function (root, factory) {

	if (typeof define === 'function' && define.amd) {
		define(['backbone'], function () {
			return (root.IDB = factory(root));
		});
	}
	else if (typeof exports !== 'undefined') {
		module.exports = factory(root);
	}
	else {
		root.IDB = factory(root);
	}

}(this, function (root) {

	var getRequestFromStoreAndConditions = function(store, conditions, method) {
		var request;

		method = method || 'openCursor';

		if (typeof conditions === 'object' && conditions) {
			var index;
			if ('index' in conditions && conditions.index)
				index = store.index(conditions.index);
			else
				index = store;

			if ('keyRange' in conditions && conditions.keyRange)
				request = index[method](conditions.keyRange);
			else
				request = index[method]();
		}
		else {
			request = store[method]();
		}

		return request;
	};

	var _indexedDB      = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
	var _IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
	var _IDBKeyRange    = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

	var IDB = function IDB(options) {
		var self = this;

		self.indexedDB      = _indexedDB;
		self.IDBTransaction = _IDBTransaction;
		self.IDBKeyRange    = _IDBKeyRange;

		if (!options)
			options = {};

		self.name = options.name || 'testdb';
		self.version = options.version || 1;

		var request = self.indexedDB.open(self.name, self.version);
		request.onupgradeneeded = function (e) {
			var db = e.target.result;

			db.onerror = self.onError;

			var newVersion = e.newVersion;
			var oldVersion = e.oldVersion;

			// Fix Safari 8 version error
			if (oldVersion > 99999999999)
				oldVersion = 0;

			self.onUpgrade(db, oldVersion, newVersion);
		};
		request.onsuccess = function (e) {
			self.db = e.target.result;
			self.onConnect();
		};
		request.onerror = self.onError;
		request.onblocked = self.onError;
	};

	// Static
	IDB.dropDatabase = function(name, done) {
		// I don't know why but sometimes deletedatabase is not able to delete the database.
		// Probably a transaction not closed. 100ms of timeout looks enought to let the browser 
		// to end what it was doing before drop the database.
		setTimeout(function() {
			var request = _indexedDB.deleteDatabase(name);
			request.onerror = function(e) {
				done(e);
			};
			request.onsuccess = function(e) {
				done();
			};
			request.onblocked = function(e) {
				done(new Error('Database ' + name + ' is blocked, close all connections before retry!'));
			};
		}, 100);
	};

	// Methods
	IDB.prototype.onConnect = function() {};
	IDB.prototype.onError   = function(err) { console.error(err); };
	IDB.prototype.onUpgrade = function(db, oldVersion, newVersion) {};

	IDB.prototype.add = function(storeName, data, done) {
		var self = this;
		var db = self.db;
		var trans = db.transaction([storeName], 'readwrite');
		var store = trans.objectStore(storeName);
		var request = store.put(data);

		var result;
		request.onsuccess = function(e) {
			result = e.target.result;
		};
		request.onerror = function(e) {
			done(err);
		};
		trans.oncomplete = function(e) {
			done(null, result);
		};
	};
	IDB.prototype.edit = IDB.prototype.add;
	IDB.prototype.findOne = function(storeName, key, done) {
		var self = this;
		var db = self.db;
		var IDBKeyRange = self.IDBKeyRange;
		var trans = db.transaction([storeName], 'readwrite');
		var store = trans.objectStore(storeName);
		var keyRange = IDBKeyRange.only(key);
		var request = store.openCursor(keyRange);

		var result;
		request.onsuccess = function(e) {
			result = e.target.result; // I need only the first entry!
			return;
		};
		request.onerror = function(err) {
			done(err);
		};
		trans.oncomplete = function() {
			if(!!result == false)
				return done(null, null);
			done(null, result.value);
		};
	};
	IDB.prototype.find = function(storeName, conditions, done) {
		if (typeof conditions === 'function') {
			done = conditions;
			conditions = null;
		}
		var self = this;
		var db = self.db;
		var IDBKeyRange = self.IDBKeyRange;
		var trans = db.transaction([storeName], 'readwrite');
		var store = trans.objectStore(storeName);
		var request = getRequestFromStoreAndConditions(store, conditions);
		var result = [];

		request.onsuccess = function(e) {
			var entry = e.target.result;
			if (entry) {
				result.push(entry.value);
				entry.continue();
			}
		};
		request.onerror = function(err) {
			done(err);
		};
		trans.oncomplete = function() {
			done(null, result);
		};
	};
	IDB.prototype.count = function(storeName, conditions, done) {
		if (typeof conditions === 'function') {
			done = conditions;
			conditions = null;
		}
		var self = this;
		var db = self.db;
		var IDBKeyRange = self.IDBKeyRange;
		var trans = db.transaction([storeName], 'readwrite');
		var store = trans.objectStore(storeName);
		var request = getRequestFromStoreAndConditions(store, conditions, 'count');
		var result = 0;

		request.onsuccess = function(e) {
			var count = e.target.result;
			result = count;
		};
		request.onerror = function(err) {
			done(err);
		};
		trans.oncomplete = function() {
			done(null, result);
		};
	};
	IDB.prototype.delete = function(storeName, key, done) {
		var self = this;
		var db = self.db;
		var trans = db.transaction([storeName], 'readwrite');
		var store = trans.objectStore(storeName);
		var request = store.delete(key);

		request.onerror = function (err) {
			done(err);
		};
		trans.oncomplete = function (e) {
			done();
		};
	};
	IDB.prototype.deleteAll = function(storeName, conditions, done) {
		var self = this;
		var db = self.db;
		var trans = db.transaction([storeName], 'readwrite');
		var store = trans.objectStore(storeName);
		var request = getRequestFromStoreAndConditions(store, conditions);

		request.onsuccess = function(e) {
			var cursor = e.target.result;
			if (cursor) {
				store.delete(cursor.primaryKey);
				cursor.continue();
			}
		};
		request.onerror = function (err) {
			done(err);
		};
		trans.oncomplete = function (err) {
			done();
		};
	};
	IDB.prototype.clear = function(storeName, done) {
		var self = this;
		var db = self.db;
		var trans = db.transaction([storeName], 'readwrite');
		var store = trans.objectStore(storeName);
		var request = store.clear();

		request.onerror = function (err) {
			done(err);
		};
		trans.oncomplete = function (e) {
			done();
		};
	};
	IDB.prototype.close = function() {
		this.db.close();
	};
	// Thanks to https://github.com/jensarps/IDBWrapper
	IDB.prototype.makeKeyRange = function(options) {
		var keyRange;
		var hasLower = typeof options.lower != 'undefined';
		var hasUpper = typeof options.upper != 'undefined';
		var isOnly = typeof options.only != 'undefined';

		switch (true) {
			case isOnly:
				keyRange = this.IDBKeyRange.only(options.only);
				break;
			case hasLower && hasUpper:
				keyRange = this.IDBKeyRange.bound(options.lower, options.upper, options.excludeLower, options.excludeUpper);
				break;
			case hasLower:
				keyRange = this.IDBKeyRange.lowerBound(options.lower, options.excludeLower);
				break;
			case hasUpper:
				keyRange = this.IDBKeyRange.upperBound(options.upper, options.excludeUpper);
				break;
			default:
				throw new Error('Cannot create KeyRange. Provide one or both of "lower" or "upper" value, or an "only" value.');
		}

		return keyRange;
	}

	return IDB;
}));