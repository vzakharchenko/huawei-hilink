FROM debian:stable
MAINTAINER Vasyl Zakharchenko <vaszakharchenko@gmail.com>
LABEL author="Vasyl Zakharchenko"
LABEL email="vaszakharchenko@gmail.com"
LABEL name="huawei-hilink"
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && apt-get install -y nodejs npm
# Bundle APP files
RUN npm i huawei-hilink@1.1.5 -g
# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
ENTRYPOINT ["/usr/local/bin/huawei-hilink"]
CMD []
