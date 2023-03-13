function nShards () {
  return context.functions.execute("getNumShards");
}

function updateTotalGB (totalGB) {
   return new Promise(resolve => totalGB / 2);
}

exports = function() {
  /*
    A Scheduled Trigger will always call a function without arguments.
    Documentation on Triggers: https://www.mongodb.com/docs/atlas/app-services/triggers/overview/

  */
    //service name for the data source
    var serviceName = "mongodb-atlas";

    //access partitions collection on mongosync_reserved_for_internal_use database
    const collState = context.services.get(serviceName).db("msync_monitor").collection("state");
    const collResumeData = context.services.get(serviceName).db("mongosync_reserved_for_internal_use").collection("resumeData");
    
    //Verify state of mongosync before doing anything else
    collState.find({}).sort({ts:-1}).limit(1).toArray().then(result => {
      result.forEach(stateDoc => {
        console.log(JSON.stringify(stateDoc))
        stateDoc.nShards = nShards();
        stateDoc.totalGB = updateTotalGB(stateDoc.totalGB); 
      console.log(JSON.stringify(stateDoc))
        return stateDoc;
        //}
      });
      return 0;
      });
      return -1;
        
  

    
};
