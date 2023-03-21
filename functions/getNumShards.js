exports = async function getNumShards(){
  // Find the name of the MongoDB service you want to use (see "Linked Data Sources" tab)
  var serviceName = "mongodb-atlas";
  var collResumeData = context.services.get(serviceName).db("mongosync_reserved_for_internal_use").collection("resumeData");
  
  return collResumeData.find({}).toArray().then(items => {
                console.log(`Successfully found ${items.length} shards.`)
                return items.length;
            }).catch(err => console.error(`Failed to find documents: ${err}`));
}
