exports = async function getChangeStreamStartTime(){
  // Find the name of the MongoDB service you want to use (see "Linked Data Sources" tab)
  var serviceName = "mongodb-atlas";
  var collGlobalState = context.services.get(serviceName).db("mongosync_reserved_for_internal_use").collection("globalState");
  var collResumeData = context.services.get(serviceName).db("mongosync_reserved_for_internal_use").collection("resumeData");
  
  var result = collResumeData.findOne({}).then(rd => {
    
    if (rd.state == 'RUNNING') {
    
       return collGlobalState.findOne({}).then(r => {
                const ts = r.changeStreamStartTime.toJSON()["$timestamp"];
                return new Date(ts.t * 1000)
            }).catch(err => console.error(`Failed to find documents: ${err}`));
    }
    else {
      return -1;
    }
  
  
 
});
return result;
}
