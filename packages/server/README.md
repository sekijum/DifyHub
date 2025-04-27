# BondageZog サーバー (NestJS)

YouTubeクローンアプリのバックエンドAPI。NestJS 11、Prisma、MySQLを使用しています。

## 機能

- RESTful API
- JWT認証
- ユーザー管理
- 動画管理
- コメント管理
- チャンネル管理
- 高評価・低評価機能
- MinIOによるファイルストレージ

## セットアップ

```bash
# パッケージのインストール
npm install

# Prismaクライアントの生成
npm run prisma:generate

# 開発サーバーの起動
npm run start:dev

# プロダクションビルド
npm run build

# プロダクション実行
npm run start:prod
```

## データベースセットアップ

```bash
# マイグレーションの実行
npm run prisma:migrate

# 初期データの投入
npm run prisma:seed

# Prisma Studioの起動（データベース管理UI）
npm run prisma:studio
```

## 構成

```
server/
├── prisma/          # Prisma設定とマイグレーション
│   ├── migrations/  # マイグレーションファイル
│   ├── schema.prisma # データベーススキーマ
│   └── seed.ts      # 初期データ
├── src/             # ソースコード
│   ├── auth/        # 認証モジュール
│   ├── users/       # ユーザーモジュール
│   ├── videos/      # 動画モジュール
│   ├── comments/    # コメントモジュール
│   ├── channels/    # チャンネルモジュール
│   ├── likes/       # 高評価・低評価モジュール
│   ├── storage/     # ストレージモジュール（MinIO）
│   ├── app.module.ts # メインモジュール
│   └── main.ts      # エントリーポイント
├── Dockerfile       # Dockerビルド設定
└── package.json     # 依存関係
```

## 環境変数

以下の環境変数が必要です：

```
# データベース接続
DATABASE_URL="mysql://root:password@mysql:3306/bondagezog"

# MinIO設定
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=bondagezog
```

## API ドキュメント

Swaggerドキュメントがアプリケーション実行時に生成されます：

```
http://localhost:3000/api/docs
```

## 注意点

- データベーススキーマの変更時は `npm run prisma:migrate` を実行してください
- 開発環境では `prisma:seed` を使用して初期データを投入できます
- MinIOバケットは自動作成されますが、事前にMinIOサーバーが起動している必要があります 
