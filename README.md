# dag-checklists
WIP app for guided / visualized checklists

# Setup
Base prerequisite: you'll need to have docker installed.

Additionally, if you happen to have nodejs installed (and struggle to remember docker commands) this is the easiest way to run/build:

```
# Build the docker image
npm run build

# Run the docker image
npm run serve

# Launch the docker image, with its db and server started, as well as give you a `bash` shell inside the container
npm run debug
```

If you're a hard core docker pro and/or don't happen to have npm installed, see `package.json` for the relevant docker commands.
