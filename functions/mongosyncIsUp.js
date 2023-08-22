exports = async function mongosyncIsUp(){
  // Find the name of the MongoDB service you want to use (see "Linked Data Sources" tab)
  var serviceName = "mongodb-atlas";
  var collResumeData = context.services.get(serviceName).db("mongosync_reserved_for_internal_use").collection("resumeData");
  
  return collResumeData.findOne({}).then(r => {
                //console.log(r)
                if ( r == null) {
                  console.log("mongosync is not running")
                  return -1
                }
                else {
                  return 0;
                }
                
            }).catch(err => console.error(`Failed to find documents: ${err}`));
}
