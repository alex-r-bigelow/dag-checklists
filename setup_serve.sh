#!/bin/bash

sudo -u express node server.js >/dev/null 2>/dev/null &

sudo -u couchdb /opt/couchdb/bin/couchdb >/dev/null 2>/dev/null &
sleep 5
cd setup_couchdb
bash setup.sh
sleep infinity
