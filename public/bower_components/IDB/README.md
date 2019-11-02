
# IDB (1.0.x)

IDB is a basic cross-browser wrapper for the HTML5 IndexedDB API. 
It's inspired by [IDBWrapper](https://github.com/jensarps/IDBWrapper) but with a more basic and simple syntax.

## Install

Clone git repository or if you love Bower like me:

```
	$ bower install idb
```

## Usage

IDB support AMD, CommonJS and global.

```js
	var db = new IDB(options);
```

where options could be

```json
	{
		"name": "testdb", 
		"version": 1 
	}
```

the parameter `name` (*testdb* by default) is the name of the database. 
`version` (*1* by default) is, of course, the version requested by your app. 
If the current version is less than the current one an event *onupgrade* is invoked.

Now bind the three events exposed by IDB:

```js
	db.onUpgrade = function (db, oldVersion, newVersion) {
		// Version 1
		if (oldVersion < 1 && 1 <= newVersion) {
			var newStore = db.createObjectStore('dirty', { keyPath: 'id', autoIncrement: true });
			newStore.createIndex('modelIdAndStoreNameIndex', ['modelId', 'storeName'], { unique: true });
			newStore.createIndex('storeNameIndex', 'storeName', { unique: false });
		}
	};
```

**onUpgrade** lets you create your stores (store is equal to a collection of MongoDB or a table of MySQL).
Here is required some basic knowledge of IndexedDB API, refer to [Mozilla documentation](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase.createObjectStore)
for more informations.

- `db` is an instance of IDBDatabase that you can use to create new indexes or stores.

- `oldVersion` is the current version of the database

- `newVersion` is the requested version

```js
	db.onConnect = function() {
		// All gone well!
	};
```

**onConnect** is invoked when the connection is established and IDB is ready to receive your commands

```js
	db.onError = function(err) { 
		console.log(err);
	};
```
**onError** catch all IDB errors


### Methods


#### IDB.add(storeName, data, callback)

Add data to a particular `storeName`.

```js
	db.add('customers', customer, function (err, insertedId) {
		if (err) return ...
		...
	});
```


#### IDB.edit(storeName, data, callback)

Alias of add...literally!


#### IDB.findOne(storeName, key, callback)

Returns the object with the key `key`.

```js
	db.findOne('customers', 1, function (err, customer) {
		if (err) return ...
		console.log(customer);
		// {
		//    firstname: 'Foo',
		//    ...
		// }
	});
```


#### IDB.find(storeName, [conditions], callback)

Returns the object with the key `key`.

```js
	var conditions = {
		index: 'firstnameIndex',
		keyRange: db.makeKeyRange({ only: 'Foo' })
	};

	db.find('customers', conditions, function (err, customers) {
		if (err) return ...
		console.log(customers);
		// [ 
		//   { firstname: 'Foo', ... }, 
		//   { firstname: 'Foo', ... }, 
		//   ... 
		// ]
	});
```

you can use it with a multi-key index too:

```js
	var conditions = {
		index: 'firstnameAndLastnameIndex',
		keyRange: db.makeKeyRange({ only: ['Foo', 'Bar'] })
	};

	db.find('customers', conditions, function (err, customers) {
		// ...
	});
```

or use a key-range condition:

```js
	var conditions = {
		index: 'orderCountIndex',
		keyRange: db.makeKeyRange({ lower: 50, upper: 100 })
	};

	db.find('customers', conditions, function (err, customers) {
		// ...
	});
```

or without conditions:

```js
	db.find('customers', function (err, customers) {
		// All customers is returned
	});
```


#### IDB.count(storeName, [conditions], callback)

It works like find but returns the objects count.

```js
	var conditions = {
		index: 'orderCountIndex',
		keyRange: db.makeKeyRange({ lower: 50, upper: 100 })
	};

	db.count('customers', conditions, function (err, count) {
		// ...
	});
```

like find you can use it without conditions:

```js
	db.count('customers', function (err, count) {
		// ...
	});
```


#### IDB.delete(storeName, key, callback)

Delete a single object by key.

```js
	db.delete('customers', 1, function (err) {
		// ...
	});
```


#### IDB.deleteAll(storeName, [conditions], callback)

Delete all objects that match the conditions. 
`conditions` is optional and without it `deleteAll` deletes all objectes in the store
but use the method IDB.clear() to increase the performance!

```js
	var conditions = {
		index: 'firstnameIndex',
		keyRange: db.makeKeyRange({ only: 'Foo' })
	};

	db.deleteAll('customers', conditions, function (err) {
		// ...
	});
```


#### IDB.clear(storeName, callback)

Clear a store.

```js
	db.clear('customers', function (err) {
		// No more customers!
	});
```


#### IDB.close()

Close the connection to IndexedDB and yes, it is syncronous! Remember to call this method before delete a database.

```js
	db.close();
```


#### IDB.makeKeyRange(options)

Helper function that simplify the creation of a condition. It returns an instance of IDBKeyRange.

Available options:

- `{ lower: 10 }` = **x < 10**
- `{ lower: 10, excludeLower: false }` = **x <= 10**
- `{ upper: 10 }` = **x > 10**
- `{ upper: 10, excludeUpper: false }` = **x >= 10**
- `{ only: 10 }` = **x = 10**
- `{ only: [10, 'Foo'] }` = **x = 10; y = 'Foo'**


# Test

To test IDB

```
	$ bower install
```

then open the folder test and launch test.html. It works fine! If you prefer a more geek way install node-static

```
	$ npm install node-static -g
```

and then 

```
	$ static
	serving "." at http://127.0.0.1:8080
```

point your browser to http://127.0.0.1:8080/test/test.html and you can test IDB



# License

MIT








