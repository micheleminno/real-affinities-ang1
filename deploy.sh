#!/bin/bash
docker build -t micheleminno/real-affinities .
docker push micheleminno/real-affinities

ssh -i "~/.ssh/MyServer.pem" deploy@ec2-18-220-103-149.us-east-2.compute.amazonaws.com << EOF
docker pull micheleminno/real-affinities:latest
docker stop web || true
docker rm web || true
docker rmi micheleminno/real-affinities:current || true
docker tag micheleminno/real-affinities:latest micheleminno/real-affinities:current
docker run -d --net app --restart always --name web -p 3000:3000 micheleminno/real-affinities:current
EOF
