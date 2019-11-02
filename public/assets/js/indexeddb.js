//prefixes of implementation that we want to test
         window.indexedDB = window.indexedDB || window.mozIndexedDB || 
         window.webkitIndexedDB || window.msIndexedDB;
         
         //prefixes of window.IDB objects
         window.IDBTransaction = window.IDBTransaction || 
         window.webkitIDBTransaction || window.msIDBTransaction;
         window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || 
         window.msIDBKeyRange
         
         if (!window.indexedDB) {
            window.alert("Your browser doesn't support a stable version of IndexedDB.")
         }
         
         const employeeData = [
            { id: "00-01", name: "gopal", age: 35, email: "gopal@tutorialspoint.com" },
            { id: "00-02", name: "prasad", age: 32, email: "prasad@tutorialspoint.com" }
         ];
         var db;
         var request = window.indexedDB.open("newDatabase", 1);
         
         request.onerror = function(event) {
            console.log("error: ");
         };
         
         request.onsuccess = function(event) {
            db = request.result;
            console.log("success: "+ db);
         };
         
         request.onupgradeneeded = function(event) {
            var db = event.target.result;
            var objectStore = db.createObjectStore("employee", {keyPath: "id"});
            
            // for (var i in employeeData) {
            //    objectStore.add(employeeData[i]);
            // }
         }
         
         function read() {
            var transaction = db.transaction(["employee"]);
            var objectStore = transaction.objectStore("employee");
            var request = objectStore.get("00-03");
            
            request.onerror = function(event) {
               alert("Unable to retrieve daa from database!");
            };
            
            request.onsuccess = function(event) {
               // Do something with the request.result!
               if(request.result) {
                  alert("Name: " + request.result.name + ",Age: " + request.result.age + ", Email: " + request.result.email);
               } else {
                  alert("Kenny couldn't be found in your database!");
               }
            };
         }
         
         function readAll() {
            var objectStore = db.transaction("employee").objectStore("employee");
            
            objectStore.openCursor().onsuccess = function(event) {
               var cursor = event.target.result;
               
               if (cursor) {
                  alert("Name for id " + cursor.key + " is " + cursor.value.name + ", Age: " + cursor.value.age + ", Email: " + cursor.value.email);
                  cursor.continue();
               } else {
                  alert("No more entries!");
               }
            };
         }
         
         function add() {
            var request = db.transaction(["employee"], "readwrite")
            .objectStore("employee")
            .add({ id: "00-04", name: "Kenny", age: 19, email: "kenny@planet.org" });
            
            request.onsuccess = function(event) {
               alert("Kenny has been added to your database.");
            };
            
            request.onerror = function(event) {
               alert("Unable to add data\r\nKenny is aready exist in your database! ");
            }
         }
         
         function remove() {
            var request = db.transaction(["employee"], "readwrite")
            .objectStore("employee")
            .delete("00-03");
            
            request.onsuccess = function(event) {
               alert("Kenny's entry has been removed from your database.");
            };
         }

class indexedDB{
  constructor(database){
    this.database = database;
  }
  init(){
    let request = window.indexedDB.open(this.database,1),db;
      console.log(this.database);
    request.onupgradeneeded = (event)=>{
      console.log(event.target);
      db = request.result;
    }

  }
  createDb(collection,keypath,fields=false){
    let request = window.indexedDB.open(this.database,1),db;
    request.onupgradeneeded = ()=>{
      db = request.result;
      if(!db.objectStoreNames.contains(collection)){
        console.log(this.database+' '+collection);
        // keypaths.forEach(keypath=>{
          let objectStore = db.createObjectStore(collection,{keyPath:keypath});
          // db.createObjectStore(collection,{keyPath:keypath});
          if(fields){
            for(var i in fields){
              if (fields.hasOwnProperty(i)){
              objectStore.createIndex(i,i,{unique:fields[i]});
              }
            }
          }
          
        // })
        
      }
    }
    request.onerror = (err)=>{
      console.error('There is a Problem in Creating Database : '+err.target.statusCode);
    }
    request.onsuccess = ()=>{
      db = request.result;
    }
  }
  // reading collection

 readCollection(key,collection,storeIndex){
  let request = window.indexedDB.open(this.database,1);
    request.onerror = (err)=>{
      console.log(err);
    }
    request.onsuccess = event =>{
      db = event.target.result;
    let transaction = db.transaction([collection]);
    let data = transaction.objectStore(collection);
    let dataIndex = data.index(storeIndex);
    // let fetchedData = data.get(key);
    let fetchedData = dataIndex.getAll(key);
       // if(fetchedData.result != 'undefined'){
      fetchedData.onsuccess = ()=>{
        console.log(fetchedData.result);
      }
    }
  }
   readAll(collection){
    let request = window.indexedDB.open(this.database,1);
    let returnObj = [];
      request.onerror = (err)=>{
        console.log(err);
      }
      request.onsuccess = (event) =>{
        db = event.target.result;
          let objectStore = db.transaction([collection]).objectStore(collection);
          objectStore.openCursor().onsuccess = async (e)=>{
            let cursor = e.target.result;
            if(cursor){
            returnObj = await cursor.value;
            cursor.continue();
            return returnObj;
          }
        }
      
      }
    }
}


 // inserting Data

function insertCollection(database,collection,array){
   let request = window.indexedDB.open(database,1),db;

    request.onupgradeneeded = (event)=>{
      db = event.target.result;
      if(!db.objectStoreNames.contains(collection)){
        db.createObjectStore(collection,{keyPath:'id'});
      }
    }
    request.onsuccess = ()=>{
      console.log(array);
      db = request.result;
      let tranx = db.transaction([collection],'readwrite');
      let dbdata = tranx.objectStore(collection);
      dbdata.add(array);
      // tranx.abort();

      tranx.onsuccess = ()=>{
        console.log('Addedd');
      }
      tranx.onerror = (err)=>{
        console.error('There is a Problem in Adding Collection : '+err.target.error.code);
        console.error(err.target.error);
      }

    }

}
