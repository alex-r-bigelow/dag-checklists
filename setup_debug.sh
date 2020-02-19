#!/bin/bash
mkdir logs
sudo -u express node server.js >logs/express.stdout 2>logs/express.stderr &

sudo -u couchdb /opt/couchdb/bin/couchdb >logs/couchdb.stdout 2>logs/couchdb.stderr &
sleep 5
bash ./setup_couchdb.sh
/bin/bash
