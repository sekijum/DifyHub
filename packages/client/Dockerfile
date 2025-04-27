FROM node:22.14.0-slim as base

ENV LANG C.UTF-8
ENV TZ Asia/Tokyo
ENV PORT 3000
ENV ROOTPATH /app

WORKDIR $ROOTPATH

COPY packages/client $ROOTPATH

# RUN npm ci \
#     && npm cache clean --force \
#     && npm run build

RUN npm install
EXPOSE 3000

# 開発用イメージ
FROM base as dev
# ENTRYPOINT ["npm", "run", "dev"]
CMD ["/bin/bash"]
