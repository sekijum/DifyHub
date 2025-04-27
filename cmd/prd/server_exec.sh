#!/bin/bash

TASK_ID=`aws ecs list-tasks \
  --cluster hentai-salon-prd \
  --service-name server \
  --desired-status RUNNING \
  --profile hentai-salon \
  | jq '.taskArns[0]' \
  | sed 's/"//g' \
  | cut -f 3 -d '/'`

aws ecs execute-command \
  --cluster hentai-salon-prd \
  --container app \
  --task $TASK_ID \
  --interactive \
  --command "/bin/sh" \
  --profile hentai-salon
