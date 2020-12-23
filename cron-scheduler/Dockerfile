FROM node:lts

RUN apt update && apt-get -y install zip

WORKDIR /app
COPY src /app/
ARG ZIPFILE=lambda.zip
RUN zip -r /${ZIPFILE} .

