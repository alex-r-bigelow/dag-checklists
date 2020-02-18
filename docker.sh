#!/bin/bash

sudo -u express ./server.js &
sudo -u couchdb /opt/couchdb/bin/couchdb &
sleep 5
curl -X PUT http://127.0.0.1:5984/_users
curl -X PUT http://127.0.0.1:5984/_replicator
curl -X PUT http://127.0.0.1:5984/tasks
curl -s -X PUT http://localhost:5984/_node/nonode@nohost/_config/admins/$COUCHDB_USER -d '"'$COUCHDB_PASSWORD'"'
curl -s -X POST -H "Content-Type: application/json" "http://$COUCHDB_USER:$COUCHDB_PASSWORD@localhost:5984/_cluster_setup" -d '{"action": "enable_single_node", "bind_address":"0.0.0.0", "username": "'$COUCHDB_USER'", "password":"'$COUCHDB_PASSWORD'"}'
# curl -X PUT http://localhost:5984/_node/nonode@nohost/_config/httpd/enable_cors
