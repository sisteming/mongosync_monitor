exports = function() {
  /*
    A Scheduled Trigger will always call a function without arguments.
    Documentation on Triggers: https://www.mongodb.com/docs/atlas/app-services/triggers/overview/

  */
    var serviceName = "mongodb-atlas";
    
    console.log(`Running mongosyncMonitor`);
    const collStatistics = context.services.get(serviceName).db("mongosync_reserved_for_internal_use").collection("statistics");
    console.log(`coll is: ${collStatistics}.`);
    const statsDoc = collStatistics.findOne({ "_id.fieldName": "collectionStats" });
    /*const ts = statsDoc._id.fieldName.getTimestamp();
    */
    var collResumeData = context.services.get(serviceName).db("mongosync_reserved_for_internal_use").collection("resumeData");
    console.log(`coll is: ${collResumeData}.`);
    //return collResumeData.findOne({});
    let jsonData = {};
    return collResumeData.findOne({}).then(result => {
    if(result) {
      let insert;
      console.log(`Successfully found document: ${result.state}.`);
      const statsDoc = collStatistics.findOne({ "_id.fieldName": "collectionStats" }).then(result2 => {
        if(result2) {
            console.log(`Successfully found document: ${result2.estimatedCopiedBytes}.`);
            const now = new Date();
            const time = now.toLocaleString();
            const coll_msync_monitor = context.services.get(serviceName).db("msync_monitor").collection("monitoring");
            console.log(`coll is: ${coll_msync_monitor}.`);
            jsonData.ts = time;
            jsonData.state = result.state;
            jsonData.syncPhase = result.syncPhase;
            jsonData.copiedBytes = result2.estimatedCopiedBytes;
            jsonData.totalBytes = result2.estimatedTotalBytes;
            jsonData.remaining = jsonData.totalBytes - jsonData.copiedBytes;
            console.log(`jsonData is: ${jsonData}.`);
             insert = coll_msync_monitor.insertOne(jsonData);
        }
        return 0;
      });
      return jsonData;
  }}).catch(err => console.error(`Failed to find document: ${err}`));
  

    
};
