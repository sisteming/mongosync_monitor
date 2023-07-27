function GetLastAppliedTs(doc) {
  
  const lastAppliedCrudTs = doc.crudChangeStreamResumeInfo.lastEventTs;
  const lastAppliedDDLTs = doc.ddlChangeStreamResumeInfo.lastEventTs;
  
  if (lastAppliedDDLTs!=null) {
    //we receive a document from resumedata collection
    const ddlts = lastAppliedDDLTs.toJSON()["$timestamp"]
    //console.log(JSON.stringify(ddlts))
  }
  if (lastAppliedCrudTs!=null) {
  
    const crudts = lastAppliedCrudTs.toJSON()["$timestamp"];
   // console.log(JSON.stringify(crudts))

  }
   if (lastAppliedCrudTs == null) {
 		return lastAppliedDDLTs
 	} else if (lastAppliedDDLTs == null) {
 		return lastAppliedCrudTs
 	} else if (lastAppliedCrudTs.t < lastAppliedDDLTs.t) {
 		return lastAppliedCrudTs
 	} else {
 		return lastAppliedDDLTs
 	}
}

function tt2Date(ts){
  
  const timestamp = ts.toJSON()["$timestamp"];
  
  return new Date(timestamp.t * 1000); 
  
}

function tt2Seconds(ts){
  
  const timestamp = ts.toJSON()["$timestamp"];
  
  return timestamp.t; 
  
}

exports = function() {
  /*
    A Scheduled Trigger will always call a function without arguments.
    Documentation on Triggers: https://www.mongodb.com/docs/atlas/app-services/triggers/overview/

  */
    //service name for the data source
    var serviceName = "mongodb-atlas";
    

    //access globalState collection on mongosync_reserved_for_internal_use database to get the changeStreamStartTime for mongosync
    const collGlobalState = context.services.get(serviceName).db("mongosync_reserved_for_internal_use").collection("globalState");
    
    //access statistics collection to read the last CRUD applied TS for each mongosync
    const collResumeData = context.services.get(serviceName).db("mongosync_reserved_for_internal_use").collection("resumeData");
    
    //access cea collection to write the progress
    const collCEA = context.services.get(serviceName).db("msync_monitor").collection("cea_progress");
    
    var dateState = '';
    //Verify state of mongosync before doing anything else
    collGlobalState.findOne({}).then(result => {
      //if phase is collection copy we inspect partitions
      
      let startTime = result.changeStreamStartTime
      var dateState = tt2Date(startTime)
      
      return dateState;
      });
      
    //Verify state of mongosync before doing anything else
    dateResumeData = collResumeData.find({}).toArray().then(result => {
      
      result.forEach(r => {
        console.log(JSON.stringify(r))
        const lastAppliedTS = GetLastAppliedTs(r);
        // console.log(JSON.stringify(lastAppliedTS))
        const now = new Date();
        const now_sec = parseInt(Date.now()/1000);
        // console.log(JSON.stringify(now_sec))
        // console.log(JSON.stringify(tt2Seconds(r.ts)))
        //LagTimeSeconds is the time between the current position of the mongosync process and the latest op
        // time of the source cluster.
        // GetLastAppliedTs returns the smaller Timestamp between lastAppliedCrudTs and lastAppliedDDLTs.
        doc = {'ts':now.toLocaleString(),'id':r._id,'lastEventTS':tt2Date(lastAppliedTS).toLocaleString(), 'now':now.toLocaleString(), 'lagTimeSeconds': now_sec - tt2Seconds(lastAppliedTS) }
        console.log(JSON.stringify(doc))
        
        
        collCEA.insertOne(doc);
      })
      
      return 0;
      });
      
      return 0;
      
      
    
        
  

    
};
