#!/bin/bash

set -eu

CUR_DIR=$(pwd)

TUNNEL_LOG_DIR_PATH=$CUR_DIR"/cmd/.logs/rds_tunnel"
TUNNEL_LOG_FILE_PATH=$TUNNEL_LOG_DIR_PATH"/$(date +%Y_%m%d_%H%M%S).log"

TASK_ID=`aws ecs list-tasks \
  --cluster hentai-salon-prd \
  --service-name server \
  --desired-status RUNNING \
  --profile hentai-salon \
  | jq '.taskArns[0]' \
  | sed 's/"//g' \
  | cut -f 3 -d '/'`

DESCRIBE_TASKS=`aws ecs describe-tasks \
  --cluster hentai-salon-prd \
  --task $TASK_ID \
  --profile hentai-salon`

for container in $(echo $DESCRIBE_TASKS | jq -c '.tasks[0].containers[]'); do
  CONTAINER_NAME=$(echo $container | jq -c ".name" | sed 's/"//g')
  if [ $CONTAINER_NAME = "app" ]; then
    RUNTIME_ID=$(echo $container | jq -c ".runtimeId" | sed 's/"//g')
    break
  fi
done

mkdir -p $TUNNEL_LOG_DIR_PATH
touch $TUNNEL_LOG_FILE_PATH

echo "30分経つと接続が切れます。"

aws ssm start-session \
  --target "ecs:hentai-salon-prd_"$TASK_ID"_"$RUNTIME_ID \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["hentai-salon-prd-database-cluster.cluster-cfseg2w2mg6o.ap-northeast-1.rds.amazonaws.com"],"portNumber":["3306"], "localPortNumber":["13306"]}' \
  --profile hentai-salon > $TUNNEL_LOG_FILE_PATH

# 1日経ったログは消す
find $TUNNEL_LOG_DIR_PATH -type f -mtime +1 | xargs rm
