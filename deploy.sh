#!/bin/bash

ssh -i "~/.ssh/MyServer.pem" deploy@ec2-18-220-103-149.us-east-2.compute.amazonaws.com << EOF
sudo -i
curl -L https://github.com/docker/compose/releases/download/1.16.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
docker-compose -f docker-compose.yml -p ci up --build
EOF
