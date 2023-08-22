exports = async function mongosyncIsUp(){
  // Find the name of the MongoDB service you want to use (see "Linked Data Sources" tab)
  var serviceName = "mongodb-atlas";
  var collResumeData = context.services.get(serviceName).db("mongosync_reserved_for_internal_use").collection("resumeData");
  
  return collResumeData.findOne({}).then(r => {
                //console.log(r)
                if ( r == null) {
                  console.log("==================================")
                  console.log("   mongosync not started yet. ")
                  console.log("==================================")
                  console.log("Once mongosync is started and the mongosync_reserved_for_internal_use database exists, the mongosync monitor functions will start capturing the current progress.")
                  console.log("==================================")
                  return -1
                }
                else {
                  return 0;
                }
                
            }).catch(err => console.error(`Failed to find documents: ${err}`));
}
