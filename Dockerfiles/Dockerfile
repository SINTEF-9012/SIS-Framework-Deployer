FROM ubuntu:17.04
RUN apt-get update
RUN apt-get install -y curl git nodejs npm
RUN ln -s /usr/bin/nodejs /usr/bin/node

RUN npm install npm@latest -g

RUN git clone https://github.com/SINTEF-9012/SIS-Framework-Deployer.git
WORKDIR "/SIS-Framework-Deployer"
RUN npm install
ENTRYPOINT npm start