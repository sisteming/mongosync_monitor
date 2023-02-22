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
    
    //const coll_msync_monitor = context.services.get("msRS").db("msync_monitor").collection("partitions");
        
    return collPartitions.find({}).toArray().then(result => {
    let  i = 0;
      result.forEach(partition => {
        console.log(`Running reviewPartition`);
        context.functions.execute("reviewPartition", partition, i);
        
        i++;
        });
    }).catch(err => console.error(`Failed to find document: ${err}`));
      //return jsonData;
  

    
};
