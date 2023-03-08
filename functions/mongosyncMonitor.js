function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports = function() {
  /*
    A Scheduled Trigger will always call a function without arguments.
    Documentation on Triggers: https://www.mongodb.com/docs/atlas/app-services/triggers/overview/

  */
    
    //Service name for the datasource in use (mongodb-atlas by default)
    var serviceName = "mongodb-atlas";

    //console.log(`Running mongosyncMonitor`);

    //Get the statistics collection in the mongosync_reserved_for_internal_use DB
    const collStatistics = context.services.get(serviceName).db("mongosync_reserved_for_internal_use").collection("statistics");
    //console.log(`coll is: ${collStatistics}.`);
    const collUuidMap = context.services.get(serviceName).db("mongosync_reserved_for_internal_use").collection("uuidMap");
    
    //Identify document with stats
    const statsDoc = collStatistics.findOne({ "_id.fieldName": "collectionStats" });
    
    //Get the resumeData collection in the mongosync_reserved_for_internal_use DB
    var collResumeData = context.services.get(serviceName).db("mongosync_reserved_for_internal_use").collection("resumeData");
    var collStateData = context.services.get(serviceName).db("msync_monitor").collection("state");
    const coll_msync_monitor = context.services.get(serviceName).db("msync_monitor").collection("monitoring");
    //Now that we got the resumeData document, we capture the collectionStats values (state, syncPhase and copied/total bytes)
    var globalCopiedGB = 0;
    var globalTotalGB = 0;
    //Verify state of mongosync before doing anything else
    collResumeData.findOne({}).then(result => {
      //console.log(`Successfully found document: ${result.state}.`);
      if (result.state != 'COMMITTED') {
        const now = new Date();
        const time = now.toLocaleString();
        //console.log(`Successfully found document: ${result.state}.`);
        
        let namespace = '';
        //map UUID to gather namespace
        
        var docs = [];
        //console.log(`Successfully found document: ${result.state}.`);
        
        
        
        //Querying 1 document for each collection
        collStatistics.find({ "_id.fieldName": "collectionStats" }).toArray().then(result2 => {
          //doc is a document for each collection with stats
          var i = 0;
          var gbData = {};
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
                  //console.log('yes====',i,JSON.stringify(s.dstCollName));
                  jsonData.namespace = s.dbName+"."+s.dstCollName;
                  insert = coll_msync_monitor.insertOne(jsonData); 
              });
              
            });
            gbData.ts = time;
            gbData.copiedGB = globalCopiedGB;
            gbData.totalGB = globalTotalGB;
            try {
               insert = collStateData.insertOne(gbData);
            } catch (e) {
               print (e);
            }


              
              console.log("INSERTED",JSON.stringify(gbData));
            let stateData = {};
            stateData.ts = time;
            stateData.state = result.state;
            stateData.syncPhase = result.syncPhase;
            
            // stateData.copiedGB = globalCopiedGB;
            // stateData.totalGB = globalTotalGB;
            console.log("written globalCopiedGB - globalTotalGB",JSON.stringify(globalCopiedGB),JSON.stringify(globalTotalGB) );
            collStateData.updateOne({'ts':time}, {$set:{'state':stateData.state,'syncPhase':stateData.syncPhase}});
        
              
              
              
          });
          
          
          
      }
    }).catch(info => console.info(`Mongosync not running ${info}`));
      return 0;

  };
