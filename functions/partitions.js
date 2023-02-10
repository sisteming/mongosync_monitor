exports = function() {
  /*
    A Scheduled Trigger will always call a function without arguments.
    Documentation on Triggers: https://www.mongodb.com/docs/atlas/app-services/triggers/overview/

  */
    const collPartitions = context.services.get("msRS").db("mongosync_reserved_for_internal_use").collection("partitions");
    
    //const statsDoc = collStatistics.findOne({ "_id.fieldName": "collectionStats" });
    /*const ts = statsDoc._id.fieldName.getTimestamp();
    */
    //var collResumeData = context.services.get("msRS").db("mongosync_reserved_for_internal_use").collection("resumeData");
    //return collResumeData.findOne({});
    let jsonData = {};
    
    return collPartitions.find({}).toArray().then(result => {
    let  i = 0;
      result.forEach(partition => {
        jsonData.id = i;
        jsonData.partitionPhase = partition.partitionPhase;
        jsonData.db = partition.namespace.db;
        jsonData.coll = partition.namespace.coll;
        let insert;
        console.log(`Successfully found document: ${partition}.`);
        
        const now = new Date();
        const time = now.toLocaleString();
        const coll_msync_monitor = context.services.get("msRS").db("msync_monitor").collection("partitions");
        
        jsonData.ts = time;
        console.log(`jsonData is: ${jsonData}.`);
        insert = coll_msync_monitor.insertOne(jsonData);
        i++;
        });
    }).catch(err => console.error(`Failed to find document: ${err}`));
      //return jsonData;
  

    
};
