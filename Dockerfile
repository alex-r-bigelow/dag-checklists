FROM apache/couchdb:latest

# Set up couchdb
USER root
WORKDIR /home
RUN mkdir couchdb
RUN chown couchdb couchdb
RUN chgrp couchdb couchdb
EXPOSE 5984

# Install nodejs
RUN curl -sL https://deb.nodesource.com/setup_13.x | bash
RUN apt-get update
RUN apt-get install -y gnupg nodejs sudo

# Set up the express app
RUN useradd -ms /bin/bash express
USER express
WORKDIR /home/express
COPY server.js ./server.js
COPY package.json ./package.json
COPY static ./static
RUN npm install

USER root
COPY setup_couchdb setup_couchdb
COPY setup_serve.sh setup_serve.sh
CMD ["/bin/bash", "setup_serve.sh"]
