FROM node:16-alpine
LABEL maintainer="Vasyl Zakharchenko <vaszakharchenko@gmail.com>"
LABEL author="Vasyl Zakharchenko"
LABEL email="vaszakharchenko@gmail.com"
LABEL name="huawei-hilink"
# Bundle APP files
RUN npm i huawei-hilink@1.1.7 -g
ENV NPM_CONFIG_LOGLEVEL warn
ENTRYPOINT ["/usr/local/bin/huawei-hilink"]
CMD []
