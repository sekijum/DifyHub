#!/bin/bash

echo "後片付け"

docker compose down --rmi all --volumes --remove-orphans
