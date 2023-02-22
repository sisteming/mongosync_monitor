exports = async function(partition,i){
  // This default function will get a value and find a document in MongoDB
  // To see plenty more examples of what you can do with functions see: 
  // https://www.mongodb.com/docs/atlas/app-services/functions/

  // Find the name of the MongoDB service you want to use (see "Linked Data Sources" tab)
  

  let jsonData = {};
  const now = new Date();
  const time = now.toLocaleString();
  // Get a collection from the context
  
  const coll_msync_monitor = context.services.get("msRS").db("msync_monitor").collection("partitions");
  
  try {
        
        jsonData.id = i;
        jsonData.partitionPhase = partition.partitionPhase;
        jsonData.db = partition.namespace.db;
        jsonData.coll = partition.namespace.coll;
        let insert;
        //console.log(`Successfully found document: ${partition}.`);
        //console.log(`TEST`);
        
        
        jsonData.ts = time;
        //console.log(`jsonData is: ${jsonData}.`);
        insert = coll_msync_monitor.insertOne(jsonData);
  } catch(err) {
    console.log("Error occurred while executing insert:", err.message);

    return { error: err.message };
  }

  // To call other named functions:
  // var result = context.functions.execute("function_name", arg1, arg2);

  return { result: findResult };
};