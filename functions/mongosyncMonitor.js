 async function getNumShards(){
  // Find the name of the MongoDB service you want to use (see "Linked Data Sources" tab)
  var serviceName = "mongodb-atlas";
  var collResumeData = context.services.get(serviceName).db("mongosync_reserved_for_internal_use").collection("resumeData");
  
  return collResumeData.find({}).toArray().then(items => {
                console.log(`Successfully found ${items.length} shards.`)
                return items.length;
              }).catch(err => console.error(`Failed to find documents: ${err}`));
}

exports = async function() {
  /*
    A Scheduled Trigger will always call a function without arguments.
    Documentation on Triggers: https://www.mongodb.com/docs/atlas/app-services/triggers/overview/

  */
  
 
    
    //Service name for the datasource in use (mongodb-atlas by default)
    var serviceName = "mongodb-atlas";

    //console.log(`Running mongosyncMonitor`);

    //Get the statistics collection in the mongosync_reserved_for_internal_use DB
    const collStatistics = context.services.get(serviceName).db("mongosync_reserved_for_internal_use").collection("statistics");
    const collUuidMap = context.services.get(serviceName).db("mongosync_reserved_for_internal_use").collection("uuidMap");
    
    //Get the resumeData collection in the mongosync_reserved_for_internal_use DB
    var collResumeData = context.services.get(serviceName).db("mongosync_reserved_for_internal_use").collection("resumeData");
    var collStateData = context.services.get(serviceName).db("msync_monitor").collection("state");
    const coll_msync_monitor = context.services.get(serviceName).db("msync_monitor").collection("monitoring");

    
    //Now that we got the resumeData document, we capture the collectionStats values (state, syncPhase and copied/total bytes)
    var globalCopiedGB = 0;
    var globalTotalGB = 0;
    
    //Get number of shards / mongosync processes
    const nShards = await getNumShards();
    
    //Verify state of mongosync before doing anything else
    await collResumeData.findOne({}).then(result => {
      //console.log(`Successfully found document: ${result.state}.`);
      
        const now = new Date();
        const time = now.toLocaleString();
        //console.log(`Successfully found document: ${result.state}.`);
        
        let namespace = '';
        //map UUID to gather namespace
        
        //Querying 1 document for each collection
        collStatistics.find({ "_id.fieldName": "collectionStats" }).toArray().then(result2 => {
          //doc is a document for each collection with stats
          var i = 0;
          var stateData = {};
          
          result2.forEach(doc => {
              var jsonData = {};
              
              jsonData.ts = time;
              
              //console.log(JSON.stringify(doc));
              jsonData.copiedBytes = doc.estimatedCopiedBytes;
              jsonData.totalBytes = doc.estimatedTotalBytes;
              jsonData.remaining = jsonData.totalBytes - jsonData.copiedBytes;
                        
              //calculate GB from bytes
              jsonData.copiedGB = (jsonData.copiedBytes/1000/1000/1000).toFixed(2);
              jsonData.totalGB = (jsonData.totalBytes/1000/1000/1000).toFixed(2);
              jsonData.remainingGB = (jsonData.remaining/1000/1000/1000).toFixed(2);
              
              //Keep global numbers  
              globalCopiedGB = globalCopiedGB + parseInt(jsonData.copiedGB,10);
              globalTotalGB = globalTotalGB + parseInt(jsonData.totalGB,10);
              //console.log("globalCopiedGB - globalTotalGB",JSON.stringify(globalCopiedGB),JSON.stringify(globalTotalGB) );
              
              
              //This is for 1 document of # collection
              //Now we query the uuid for the current document which should return a single document
              namespaceFromMap = collUuidMap.findOne({"_id":doc._id.uuid}).then(s => {
                  //console.log('yes====',i,JSON.stringify(s));
                  if (s) {
                    jsonData.namespace = s.dbName+"."+s.dstCollName;
                    insert = coll_msync_monitor.insertOne(jsonData); 
                  }
              });
              
              stateData.ts = time;
              stateData.state = result.state;
              stateData.syncPhase = result.syncPhase;
              stateData.nShards = nShards;
              stateData.copiedGB = globalCopiedGB;
              //Split totalGB by num Shards
              stateData.totalGB = globalTotalGB / nShards;
              
              
            });
            
            
          
          
          console.log("written globalCopiedGB - globalTotalGB",JSON.stringify(stateData.copiedGB),JSON.stringify(stateData.totalGB) );
          collStateData.insertOne(stateData);
        
          });
    }).catch(info => console.info(`Mongosync not running ${info}`));
      return 0;

  };
