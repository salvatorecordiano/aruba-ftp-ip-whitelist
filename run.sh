#!/bin/bash
docker run -it --rm -v $(pwd)/source:/home/node-user node-puppeteer node index.js $1 $2
