exports = function getCopiedGBperNamespace(uuid){
  var serviceName = "mongodb-atlas";
  const collStatistics = context.services.get(serviceName).db("mongosync_reserved_for_internal_use").collection("statistics");
  //const nsArray = await coll_msync_monitor.distinct('namespace');
  var copiedGBPerNS = 0;
  var copiedBytesPerNS = 0;
  return collStatistics.find({ "_id.fieldName": "collectionStats","_id.uuid":uuid}).toArray().then(docNs => {
    docNs.forEach( doc => {
      //now ns is in the form of ts,copiedBytes, remaining, copiedGB, namespace
      //this is going through same namespace across different shards
      copiedBytesPerNS = copiedBytesPerNS + parseInt(doc.estimatedCopiedBytes);
      //console.log(JSON.stringify(time),JSON.stringify(doc));
  });
  copiedGBPerNS = (copiedBytesPerNS/1000/1000/1000).toFixed(2);
  //console.log(copiedGBPerNS);
  return copiedGBPerNS;
  
 });

  
}