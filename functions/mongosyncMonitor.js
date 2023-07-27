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
    const nShards = await  context.functions.execute("getNumShards");
    const startTime = await  context.functions.execute("getChangeStreamStartTime");
    
    
    
    
    
    //Verify state of mongosync before doing anything else
    await collResumeData.findOne({}).then(result => {
      //console.log(`Successfully found document: ${result.state}.`);
        
        const now = new Date();
        const time = now.toLocaleString();
        //console.log(`Successfully found document: ${result.state}.`);
        
        let namespace = '';
        //map UUID to gather namespace
        
        
          
        collStatistics.find({ "_id.fieldName": "collectionStats"}).toArray().then(result2 => {
          //doc is a document for each collection with stats
          var i = 0;
          var stateData = {};
          //console.log('result2',JSON.stringify(result2));
          result2.forEach(doc => {
              var jsonData = {};
              console.log('doc=',i,JSON.stringify(doc));
              jsonData.ts = time;
              jsonData.shard = doc._id.id;
              
              
              
              //console.log(JSON.stringify(doc));
              jsonData.copiedBytes = doc.estimatedCopiedBytes;
              jsonData.totalBytes = doc.estimatedTotalBytes;
              //jsonData.remaining = jsonData.totalBytes - (jsonData.copiedBytes * nShards);
              
              
              //calculate GB from bytes
              jsonData.copiedGBPerMongosync = parseFloat((jsonData.copiedBytes/1000/1000/1000).toFixed(3));
              jsonData.totalGB = parseFloat((jsonData.totalBytes/1000/1000/1000).toFixed(3));
              
              
              
              var delayInMilliseconds = 30000; //1 second

              
                
   
                //Keep global numbers  
                globalCopiedGB = globalCopiedGB + parseFloat(jsonData.copiedGBPerMongosync,3);
                globalTotalGB = globalTotalGB + parseFloat(jsonData.totalGB,3);
                console.log("globalCopiedGB, globalTotalGB",JSON.stringify(globalCopiedGB),JSON.stringify(globalTotalGB) );
                
                //console.log("globalCopiedGB, globalTotalGB, copiedGBCluster",JSON.stringify(globalCopiedGB),JSON.stringify(globalTotalGB),JSON.stringify(copiedGBCluster) );
                
              // }, delayInMilliseconds);
              
              //This is for 1 document of # collection
              //Now we query the uuid for the current document which should return a single document
              namespaceFromMap = collUuidMap.findOne({"_id":doc._id.uuid}).then(s => {
                  //console.log('yes====',i,JSON.stringify(s));
                  if (s) {
                    jsonData.namespace = s.dbName+"."+s.dstCollName;
                    
                    // console.log("#####",JSON.stringify(jsonData));
                    
                    
                    // console.log("=====",JSON.stringify(jsonData.shard),JSON.stringify(time1));
                    
                    //Calculate how much has been copied so far at a NS level
                    context.functions.execute("getCopiedGBperNamespace",doc._id.uuid).then(cGB => {
                      
                      //console.log(JSON.stringify(jsonData));
                      jsonData.copiedGBPerNS = parseFloat(cGB);
                      jsonData.remainingGB = jsonData.totalGB - jsonData.copiedGBPerNS;
                      if (jsonData.remainingGB < 0)
                        jsonData.remainingGB = 0;
                      
                      // console.log("+++++",JSON.stringify(jsonData.shard),JSON.stringify(time2));
                      // console.log("______",JSON.stringify(jsonData));
                      coll_msync_monitor.insertOne(jsonData);
                      return cGB;
                    });
                    
                    
                  }
              
              });
              
              
              
              
            });
            console.log("globalCopiedGB, globalTotalGB",JSON.stringify(globalCopiedGB),JSON.stringify(globalTotalGB) );
            console.log("startTime",JSON.stringify(startTime.toLocaleString()));
            stateData.ts = time;
            stateData.startTime = startTime.toLocaleString();
            stateData.state = result.state;
            stateData.syncPhase = result.syncPhase;
            stateData.nShards = nShards;
            stateData.copiedGB = parseFloat(globalCopiedGB,3);
            //Split totalGB by num Shards
            stateData.totalGB = parseFloat(globalTotalGB / nShards,3);  
            
            
            //console.log("written globalCopiedGB - globalTotalGB",JSON.stringify(stateData.copiedGB),JSON.stringify(stateData.totalGB) );
            collStateData.insertOne(stateData);
            return stateData;
            });
            
    }).catch(log => console.log(`Mongosync not running ${log}`));
      return 0;

  };
