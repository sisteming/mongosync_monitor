#!/bin/bash

echo "=================================================================="
echo "                          mongosync_monitor                       "
echo "=================================================================="

echo "This script configures a MongoDB App Services app with the mongosync_monitor utility"

echo 
echo "Before you run this script, make sure you have:"
echo "1. Created a new MongoDB Atlas project for your mongosync target cluster"
echo "2. Created a new cluster inside that project where mongosync will copy the data to"
echo "3. Created an API Key inside that project, and recorded the public and private key details"
echo "4. Created an API Key for your Organization and recorded the public and private key details"
echo "5. Installed dependencies for this script: node, mongodb-realm-cli (https://www.mongodb.com/docs/atlas/app-services/cli/#realm-cli)"
echo "For more details on these steps, see the README.md file."
echo

# Prompt for API Keys
echo "Enter the PUBLIC Key for your PROJECT level API Key:"
read publicKeyProject
echo "Enter the PRIVATE Key for your PROJECT level API Key:"
read privateKeyProject
echo "Enter the name of the Atlas cluster:"
read clusterName

echo "Thanks....."

# Rewrite the App Service with the specified cluster name
config='{
    "name": "mongodb-atlas",
    "type": "mongodb-atlas",
    "config": {
        "clusterName": "'$clusterName'",
        "readPreference": "primary",
        "wireProtocolEnabled": false
    },
    "version": 1
}'
echo "$config" > ./data_sources/mongodb-atlas/config.json

# Import the App Services app
realm-cli login --api-key="$publicKeyProject" --private-api-key="$privateKeyProject"
realm-cli import --yes 

# Next Steps
echo "Setup Complete! Please log into Atlas and verify that the mongosync_monitor app is visible"
echo "To visualize the mongosync monitor charts:"
echo "1. Go to Charts in your Atlas project"
echo "2. Import the dashboard from the included file 'mongosync_monitor.charts'"