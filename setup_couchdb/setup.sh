#!/bin/bash

curl -s -X PUT http://127.0.0.1:5984/_users >/dev/null
curl -s -X PUT http://127.0.0.1:5984/_replicator >/dev/null
curl -s -X PUT http://127.0.0.1:5984/tasks >/dev/null
curl -s -X PUT http://localhost:5984/_node/nonode@nohost/_config/admins/$COUCHDB_USER -d '"'$COUCHDB_PASSWORD'"' >/dev/null
curl -s -X POST -H "Content-Type: application/json" "http://$COUCHDB_USER:$COUCHDB_PASSWORD@localhost:5984/_cluster_setup" -d '{"action": "enable_single_node", "bind_address":"0.0.0.0", "username": "'$COUCHDB_USER'", "password":"'$COUCHDB_PASSWORD'"}' >/dev/null
curl -s -X PUT -H "Content-Type: application/json" "http://$COUCHDB_USER:$COUCHDB_PASSWORD@localhost:5984/tasks/_security" -d '{"admins": { "names": ["'$COUCHDB_USER'"], "roles": [] }, "members": { "names": [], "roles": [] } }' >/dev/null
../node_modules/.bin/add-cors-to-couchdb http://localhost:5984 -u $COUCHDB_USER -p $COUCHDB_PASSWORD >/dev/null
node finish.js
