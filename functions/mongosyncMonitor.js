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

    //Identify document with stats
    const statsDoc = collStatistics.findOne({ "_id.fieldName": "collectionStats" });
    
    //Get the resumeData collection in the mongosync_reserved_for_internal_use DB
    var collResumeData = context.services.get(serviceName).db("mongosync_reserved_for_internal_use").collection("resumeData");
    //console.log(`coll is: ${collResumeData}.`);
    
    let jsonData = {};

    //Go through resumeData (should be 1 doc)
    return collResumeData.findOne({}).then(result => {
    if(result) {
      let insert;
      //console.log(`Successfully found document: ${result.state}.`);
      
      //Now that we got the resumeData document, we capture the collectionStats values (state, syncPhase and copied/total bytes)

      const statsDoc = collStatistics.findOne({ "_id.fieldName": "collectionStats" }).then(result2 => {
        if(result2) {
            //console.log(`Successfully found document: ${result2.estimatedCopiedBytes}.`);
            const now = new Date();
            const time = now.toLocaleString();
            //Collection we will use to write mongosync monitor results
            const coll_msync_monitor = context.services.get(serviceName).db("msync_monitor").collection("monitoring");
            //console.log(`coll is: ${coll_msync_monitor}.`);
            jsonData.ts = time;
            //state and syncphase of mongosync
            jsonData.state = result.state;
            jsonData.syncPhase = result.syncPhase;
            jsonData.copiedBytes = result2.estimatedCopiedBytes;
            jsonData.totalBytes = result2.estimatedTotalBytes;
            //Capture remaining bytes
            jsonData.remaining = jsonData.totalBytes - jsonData.copiedBytes;
            
            //calculate GB from bytes
            jsonData.copiedGB = (jsonData.copiedBytes/1000/1000/1000).toFixed(2);
            jsonData.totalGB = (jsonData.totalBytes/1000/1000/1000).toFixed(2);
            jsonData.remainingGB = (jsonData.remaining/1000/1000/1000).toFixed(2);
            

            console.log(`jsonData is: ${jsonData}.`);
             insert = coll_msync_monitor.insertOne(jsonData);
        }
        return 0;
      });
      return jsonData;
  }}).catch(err => console.error(`Failed to find document: ${err}`));
  

    
};
