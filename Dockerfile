FROM apache/couchdb:latest

USER root

# Install nodejs
RUN curl -sL https://deb.nodesource.com/setup_13.x | bash
RUN apt-get update
RUN apt-get install -y gnupg nodejs

EXPOSE 3000

RUN useradd -ms /bin/bash express
USER express
WORKDIR /home/express
COPY server.js ./server.js
COPY package.json ./package.json
COPY static ./static
RUN npm install

CMD ["/usr/bin/env", "node", "server.js"]
