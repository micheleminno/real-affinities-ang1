#!/bin/bash
docker build -t micheleminno/app-node .
docker push micheleminno/app-node

ssh -i "MyServer.pem" deploy@ec2-18-220-103-149.us-east-2.compute.amazonaws.com << EOF
docker pull micheleminno/app-node:latest
docker stop web || true
docker rm web || true
docker rmi micheleminno/app-node:current || true
docker tag micheleminno/app-node:latest micheleminno/app-node:current
docker run -d --net app --restart always --name web -p 3000:3000 micheleminno/app-node:current
EOF
