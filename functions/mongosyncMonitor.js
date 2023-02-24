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
    //console.log(`coll is: ${collResumeData}.`);
  
    
    
    const now = new Date();
    const time = now.toLocaleString();
    
    
    //Go through resumeData (should be 1 doc)
    return collResumeData.findOne({}).then(result => {
    if(result) {
      let docs = [];
      //console.log(`Successfully found document: ${result.state}.`);
      
      //Now that we got the resumeData document, we capture the collectionStats values (state, syncPhase and copied/total bytes)

      collStatistics.find({ "_id.fieldName": "collectionStats" }).toArray().then(result2 => {
        result2.forEach(doc => {
            let jsonData = {};
            //console.log(`coll is: ${coll_msync_monitor}.`);
            jsonData.ts = time;
            //state and syncphase of mongosync
            jsonData.state = result.state;
            jsonData.syncPhase = result.syncPhase;
            //console.log(JSON.stringify(doc));
            jsonData.copiedBytes = doc.estimatedCopiedBytes;
            jsonData.totalBytes = doc.estimatedTotalBytes;
            //jsonData.uuid = uuidStringify(doc.uuid);
            console.log(JSON.stringify(doc));
            //jsonData.db = collUuidMap.findOne({ "_id": doc.uuid }).dbName;
            //jsonData.coll = collUuidMap.findOne({ "_id": doc.uuid }).srcCollName;
            
            //Capture remaining bytes
            jsonData.remaining = jsonData.totalBytes - jsonData.copiedBytes;
            
            //calculate GB from bytes
            jsonData.copiedGB = (jsonData.copiedBytes/1000/1000/1000).toFixed(2);
            jsonData.totalGB = (jsonData.totalBytes/1000/1000/1000).toFixed(2);
            jsonData.remainingGB = (jsonData.remaining/1000/1000/1000).toFixed(2);
            

            ///console.log(`jsonData is: ${jsonData}.`);
            //add document to docs
            docs.push(jsonData);
        });
        //Collection we will use to write mongosync monitor results
        const coll_msync_monitor = context.services.get(serviceName).db("msync_monitor").collection("monitoring");
        //insert multiple docs 
        console.log(JSON.stringify(docs));            
        insert = coll_msync_monitor.insertMany(docs);
        return docs;
      });
      return docs;
  }}).catch(err => console.error(`Failed to find document: ${err}`));
  

    
};
