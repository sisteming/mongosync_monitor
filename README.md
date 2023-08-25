# Mongosync monitor using Charts

This repository includes a MongoDB App Service application that monitors the progress of mongosync on the destination cluster and creates a timeline of its progress which is displayed in a Charts dashboard

<img alt="Example Mongosync monitor" src="img/msync1.png">
<img alt="Example Mongosync monitor" src="img/msync2.png">
<img alt="Example Mongosync monitor" src="img/msync3.png">
<img alt="Example Mongosync monitor" src="img/msync4.png">

NOTE: If you encounter any issue, ping me (@marco) on #mongosync_monitor so we can look into it.

# Description

The first section covers 4 important details:

1. _mongosync phase_: Timeline of the current phase that mongosync is in (namespaces created, collection copy, change event application, committed)
2. _CopiedGB vs TotalGB_: This shows the timeline (every minute) of the GB copied by mongosync at each stage VS the total GB to be copied.
3. _Current Phase_: Current Phase mongosync is in (i.e. collection copy, change event application, committed)
4. _State_: mongosync's state, generally Running in most cases.
5. _Mongosync start time_: Timestamp at when mongosync was started. Useful to track the oplog on the source cluster.
6. _Partition Phase distribution_: Partitions have 3 phases, *not started*, *in progress* or *done*. This shows the current progress.
7. _Shards / mongosync_: number of shards / number of mongosync processes running in parallel (1 per shard on source cluster)

<img alt="Example Mongosync monitor" src="img/msync1.png">

This next section covers mongosync's progress in more detail:

5. _Copy Rate by minute (or hour)_: as it says, GB copied by mongosync aggregated by either minutes or hours.
6. _CopiedGB vs TotalGB_: Timeline of the progress and copied GB compared to the total GB to be copied


<img alt="Example Mongosync monitor" src="img/msync2.png">

This sections is similar to the previous one:

7. _Progress by namespace_: it is useful to see how many GB were copied for each namespace. 
8. _Remaining data by namespace (GB)_: as it says, GB remaining to be copied for each namespace (across all shards) over time.
9. _Partitions per collection_: This is just another indicator to see progress of partitions and which collection is being processed (in the collection copy phase) based on the partitions phase for that collection.


<img alt="Example Mongosync monitor" src="img/msync3.png">

This sections shows:

9. _Progress by namespace and shard distribution_: on a sharded cluster migration, it is useful to see how many GB were copied per shard for each namespace. Useful to see the overall data distribution on the target cluster.
10. _Shard Copy Distribution_: Just raw GB copied per mongosync progress. 

<img alt="Example Mongosync monitor" src="img/msync4.png">





# Setup

Setting up this solution involves a number of steps in the Atlas web portal, followed by some command line scripts to be run locally. Finally you will
open MongoDB Charts to import the dashboard.

## 1. Atlas

1. Sign into [MongoDB Atlas](https://cloud.mongodb.com)
2. This assumes that you **already have an Atlas cluster that will be the destination for the mongosync migration**. We will use the Atlas project of that cluster to deploy the App Services functions & triggers as well as the Charts dashboard
3. Create an API Key for the project. This will be used to programmatically
   deploy the App Services app:
   _ Ensure that `Org Overview` is your active project
   _ Click **Access Manager** on the top bar, and then **Project Access**
   _ Click **Create API Key**
   _ Enter an appropriate name for the key, e.g. `Report App Deployment`
   _ Select the `Project Owner` role.
   _ Click **Next**
   _ Record the Public and Private Key details and store them securely.
   _ Add your IP address to the API Access List. \* Click **Done** when you're ready to save the new key to your Project


## 2. Command Line 

1. Install the following prerequisites on your computer if they aren't already
   present:
   * [Git](https://git-scm.com/downloads)
   * [Node.js](https://nodejs.org/en/download/) 
   * [MongoDB Realm CLI](https://www.mongodb.com/docs/atlas/app-services/cli/)
2. Clone this repo to an appropriate directory on your computer:
   ```
   git clone https://github.com/10gen/mongosync_monitor
   ```
3. Change directory to the cloned project:
   ```
   cd mongosync_monitor
   ```
4. Run the setup script
   ```
   ./setupMongosyncMonitor.sh
   ```
5. When prompted, enter the public and private API keys for your Project
   as well as the name of your cluster.
6. Wait for the script to complete, and then verify that the App Services app is present
   Note that the app contains 2 triggers enabled by default which will trigger every minute. The associated functions will only run and do stuff when the internal mongosync database is present and has data on it.
7. Once this is done, please review thats your Atlas cluster is configured as the data source for the App Services app ('Linked Data Sources' - selecting the cluster from the dropdown, but keeping the service name to mongodb-atlas).

## 3. Charts

**NOTE: Follow these steps only once mongosync has started**. *While the App Services functions will be running without any action, the dashboard needs the _mongosync_reserved_for_internal_use_ database as well as the one for this tool which will be present only after mongosync is started.*

1. Sign into [MongoDB Atlas](https://cloud.mongodb.com) and select your desired project
2. Click the **Charts** tab on the top nav, and activate Charts if you haven't done so already
3. Find the **Add Dashboard** button and click the down arrow, and then select
   **Import Dashboard**
4. Choose the `Mongosync Monitor Dashboard-s.charts` file from this repo, click **Next**.
5. If the **"Data source at destination"** says **"Connect later"**, click on the edit button next to your data source.
   1. Select **Connect now**
   2. Choose the current deployment (destination cluster for _mongosync_) and select the database and collections as follows:
      - partitions: _mongosync_reserved_for_internal_use_ as DB and _partitions_ as collection
      - monitoring: _mongosync_monitor_ as DB and _monitoring_ as collection
      - state: _mongosync_monitor_ as DB and _state_ as collection
   3. Click **Save** underneath the dropdown
6. Click the green **Save** button
7. Open the imported dashboard and get ready to see how mongosync migrates data to your destination cluster.



# Details

The App Services app in this repo contains three functions and two trigger. You
can view and update the deployed app by clicking the **App Services** tab on the top Atlas nav.

### Functions

`mongosyncMonitor`: Inspects the _mongosync_reserved_for_internal_use_ database, in particular the statistics and resumeData collections to gather current state, syncPhase, estimatedCopiedBytes and estimatedTotalBytes. A new document is added into the mongosync_monitor.monitoring collection with these metrics plus calculated values based on copied and total bytes.

`partitions`: Inspects the partitions collection (from the _mongosync_reserved_for_internal_use_ database) and go through all partitions, calling the reviewPartition function for each of them.

`reviewPartition`: For the partition received as an argument, it will collect the namespace details (db and collection), the current partitionPhase (done or not started) and will write into the partitions collection (on the _mongosync_monitor_ database) with the current timestamp (every minute as called by the trigger

`getCopiedGBperNamespace`: Receives the uuid for a collection and calculates the amount of GB copied for that specific namespace across all shards.

`getNumShards`: Returns number of shards / multiple mongosync processes based on the internal mongosync metadata.


### Triggers

`mongosyncMonitorTrigger`: Runs every minute and triggers the _mongosyncMonitor_ function

`PartitionInfo`: Runs every minute and triggers the _partitions_ function (which calls _reviewPartition_)

# Enhancements (To-Do)

- Include lag seconds for CEA
- Incorporate data from verifier metadata

# Documentation Links

- [Realm CLI](https://docs.mongodb.com/realm/deploy/realm-cli-reference/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [MongoDB Charts](https://docs.mongodb.com/charts/master/)
