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
    //console.log(`coll is: ${collResumeData}.`);
  
    
    
    const now = new Date();
    const time = now.toLocaleString();
  
    
    
    
    let docs = [];
    //console.log(`Successfully found document: ${result.state}.`);
    
    //Now that we got the resumeData document, we capture the collectionStats values (state, syncPhase and copied/total bytes)
    let globalCopiedGB = 0;
    let globalTotalGB = 0;
    collStatistics.find({ "_id.fieldName": "collectionStats" }).toArray().then(result2 => {
      result2.forEach(doc => {
          let jsonData = {};
          //console.log(`coll is: ${coll_msync_monitor}.`);
          jsonData.ts = time;
          //state and syncphase of mongosync
          //console.log(JSON.stringify(doc));
          jsonData.copiedBytes = doc.estimatedCopiedBytes;
          jsonData.totalBytes = doc.estimatedTotalBytes;
          
          
          
          //map UUID to gather namespace
          let namespace = collUuidMap.find({"_id":doc._id.uuid}).toArray().then(s => {
            let ns = '';
            s.forEach(map => {
                 
                  // console.log('yes');
                  // console.log(JSON.stringify(doc));
                  // console.log(JSON.stringify(map));
                  // console.log(JSON.stringify(map.dbName));
                  // console.log(JSON.stringify(map.srcCollName));
                  ns = map.dbName +'.'+ map.srcCollName;
                  
          });
          return ns;
              
         });
          
          //capture Namespace for statistics currently processed
          jsonData.ns = namespace;
          
          //Capture remaining bytes
          jsonData.remaining = jsonData.totalBytes - jsonData.copiedBytes;
          
          //calculate GB from bytes
          jsonData.copiedGB = (jsonData.copiedBytes/1000/1000/1000).toFixed(2);
          jsonData.totalGB = (jsonData.totalBytes/1000/1000/1000).toFixed(2);
          jsonData.remainingGB = (jsonData.remaining/1000/1000/1000).toFixed(2);
          
          //Keep global numbers
          globalCopiedGB = globalCopiedGB + parseInt(jsonData.copiedGB,10);
          globalTotalGB = globalTotalGB + parseInt(jsonData.totalGB,10);

          ///console.log(`jsonData is: ${jsonData}.`);
          //add document to docs
          docs.push(jsonData);
      });
      //Collection we will use to write mongosync monitor results
      const coll_msync_monitor = context.services.get(serviceName).db("msync_monitor").collection("monitoring");
      //insert multiple docs 
      //console.log(JSON.stringify(docs));            
      insert = coll_msync_monitor.insertMany(docs);
      
      //Go through resumeData (should be 1 doc)
      collResumeData.findOne({}).then(result => {
        if(result) {
          let stateData = {};
          stateData.ts = time;
          stateData.state = result.state;
          stateData.syncPhase = result.syncPhase;
          stateData.copiedGB = globalCopiedGB;
          stateData.totalGB = globalTotalGB;
          collStateData.insertOne(stateData); 
      }
      });
      return docs;
    }).catch(err => console.error(`Failed to find document: ${err}`));
    return docs;
  };
