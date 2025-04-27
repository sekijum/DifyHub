#!/bin/bash

if ! [ -e "$1" ]; then
    echo "ファイルが存在しません。"
fi

mysql -h hentai-salon-mysql -u root -p hentai_salon < $1
