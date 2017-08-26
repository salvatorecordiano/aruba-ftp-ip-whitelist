#!/bin/bash
docker run -it --rm -v $(pwd)/source:/home/node-user node-puppeteer npm install
