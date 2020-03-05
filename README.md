# dag-checklists
WIP app for guided / visualized checklists

![example screenshot](https://github.com/alex-r-bigelow/dag-checklists/raw/master/docs/2020-03-05-screenshot.png)

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

# Same as the last one, but uses a different path for those of us using WSL; you'll probably need to tweak the absolute path in package.json for this to work
npm run debug-wsl
```

If you're a hard core docker pro and/or don't happen to have npm installed, see `package.json` for the relevant docker commands.
