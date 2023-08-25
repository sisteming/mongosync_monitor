exports = async function(partition,i){
  // This default function will get a value and find a document in MongoDB
  // To see plenty more examples of what you can do with functions see: 
  // https://www.mongodb.com/docs/atlas/app-services/functions/

  // Find the name of the MongoDB service you want to use (see "Linked Data Sources" tab)
  var serviceName = "mongodb-atlas";
  
  let jsonData = {};
  //capture timestamp
  const now = new Date();
  const time = now.toLocaleString('en-US', { timeZone: 'UTC' });
  // Get the partitions collection where we'll write (within the mongosync_monitor DB)
  const coll_msync_monitor = context.services.get(serviceName).db("mongosync_monitor").collection("partitions");
  
  try {
        //identifier for the partition
        jsonData.id = i;
        //current phase for the partion (not started or done)
        jsonData.partitionPhase = partition.partitionPhase;
        //namespace - DB
        jsonData.db = partition.namespace.db;
        //namespace - coll
        jsonData.coll = partition.namespace.coll;
        let insert;
        //console.log(`Successfully found document: ${partition}.`);
        //console.log(`TEST`);
        jsonData.ts = time;
        //console.log(`jsonData is: ${jsonData}.`);
        //write document with timestamp and partition details
        insert = coll_msync_monitor.insertOne(jsonData);
  } catch(err) {
    console.log("Error occurred while executing insert:", err.message);

    return { error: err.message };
  }

  return { result: 0 };
};