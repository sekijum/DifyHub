#!/bin/bash

CURRENT_DIRECTORY=$(cd $(dirname $0); pwd)
ROOTPATH=$(dirname ${CURRENT_DIRECTORY})
BACKUP_FILE="backup/$(date +'%Y-%m-%d')/$(date +'%H:%M:%S').dump"
BACKUP_DIR="backup"
CT="$(date +'%Y:%m:%d-%H:%M:%S')"

mkdir -p "$(dirname $BACKUP_FILE)"
touch  $BACKUP_FILE
echo $BACKUP_FILE

mysqldump -u hentai_salon -p -P 13306 -h 127.0.0.1 hentai_salon > $BACKUP_FILE
