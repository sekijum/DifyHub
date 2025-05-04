FROM node:22.14.0-slim as base

ENV LANG C.UTF-8
ENV TZ Asia/Tokyo
ENV PORT 3000
ENV ROOTPATH /app

WORKDIR $ROOTPATH

# OpenSSL をインストール (Debian/Ubuntu系)
RUN apt-get update -y && apt-get install -y openssl --no-install-recommends && rm -rf /var/lib/apt/lists/*

# package.json と package-lock.json をコピー
COPY packages/server/package*.json ./

# 依存関係をインストール (ci の方が望ましい場合もある)
RUN npm install 

# ソースコードをコピー (node_modules を上書きしないように .dockerignore を使うのが理想)
COPY packages/server/ . 

# @nestjs/cli は devDependencies に含めるべきか？
# RUN npm i -g @nestjs/cli # グローバルインストールは通常避ける

EXPOSE 8080

# 開発用イメージ
FROM base as dev
# ENTRYPOINT ["npm", "run", "dev"]
# 開発時はボリュームマウントでソースが同期されるため、CMD は変更なしでも良い場合がある
CMD ["/bin/bash"]
