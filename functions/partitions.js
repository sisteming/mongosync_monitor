exports = function() {
  /*
    A Scheduled Trigger will always call a function without arguments.
    Documentation on Triggers: https://www.mongodb.com/docs/atlas/app-services/triggers/overview/

  */
    //service name for the data source
    var serviceName = "mongodb-atlas";

    //access partitions collection on mongosync_reserved_for_internal_use database
    const collPartitions = context.services.get(serviceName).db("mongosync_reserved_for_internal_use").collection("partitions");
    
    //go through each partition so we review its details
    return collPartitions.find({}).toArray().then(result => {
    let  i = 0;
      result.forEach(partition => {
        //console.log(`Running reviewPartition`);
        //call reviewPartition to get the partition details
        context.functions.execute("reviewPartition", partition, i);
        
        i++;
        });
    }).catch(err => console.error(`Failed to find document: ${err}`));
      //return jsonData;
  

    
};
