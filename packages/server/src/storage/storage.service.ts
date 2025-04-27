import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { Readable } from 'stream';

@Injectable()
export class StorageService implements OnModuleInit {
  private minioClient: Minio.Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private configService: ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get('MINIO_ENDPOINT'),
      port: parseInt(this.configService.get('MINIO_PORT')),
      useSSL: false,
      accessKey: this.configService.get('MINIO_ACCESS_KEY'),
      secretKey: this.configService.get('MINIO_SECRET_KEY'),
    });
    this.bucketName = this.configService.get('MINIO_BUCKET_NAME');
  }

  async onModuleInit() {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`バケット '${this.bucketName}' を作成しました`);
      } else {
        this.logger.log(`バケット '${this.bucketName}' は既に存在します`);
      }

      // パブリックポリシーを設定
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucketName}/*`],
          },
        ],
      };

      await this.minioClient.setBucketPolicy(
        this.bucketName,
        JSON.stringify(policy),
      );
      this.logger.log(`バケット '${this.bucketName}' にパブリックポリシーを設定しました`);
    } catch (err) {
      this.logger.error('MinIOの初期化エラー:', err);
      throw err;
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    objectName: string,
    contentType?: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.minioClient.putObject(
        this.bucketName,
        objectName,
        file.buffer,
        file.size,
        { 'Content-Type': contentType || file.mimetype },
        (err, etag) => {
          if (err) {
            this.logger.error(`ファイルアップロードエラー: ${err}`);
            return reject(err);
          }
          const fileUrl = `http://${this.configService.get(
            'MINIO_ENDPOINT',
          )}:${this.configService.get('MINIO_PORT')}/${
            this.bucketName
          }/${objectName}`;
          this.logger.log(`ファイルをアップロードしました: ${fileUrl}`);
          resolve(fileUrl);
        },
      );
    });
  }

  async uploadBuffer(
    buffer: Buffer,
    objectName: string,
    contentType: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.minioClient.putObject(
        this.bucketName,
        objectName,
        buffer,
        buffer.length,
        { 'Content-Type': contentType },
        (err, etag) => {
          if (err) {
            this.logger.error(`バッファアップロードエラー: ${err}`);
            return reject(err);
          }
          const fileUrl = `http://${this.configService.get(
            'MINIO_ENDPOINT',
          )}:${this.configService.get('MINIO_PORT')}/${
            this.bucketName
          }/${objectName}`;
          this.logger.log(`バッファをアップロードしました: ${fileUrl}`);
          resolve(fileUrl);
        },
      );
    });
  }

  async getFile(objectName: string): Promise<Readable> {
    return this.minioClient.getObject(this.bucketName, objectName);
  }

  async deleteFile(objectName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.minioClient.removeObject(this.bucketName, objectName, (err) => {
        if (err) {
          this.logger.error(`ファイル削除エラー: ${err}`);
          return reject(err);
        }
        this.logger.log(`ファイルを削除しました: ${objectName}`);
        resolve();
      });
    });
  }

  async generateThumbnail(videoBuffer: Buffer): Promise<Buffer> {
    // 実際には ffmpeg などを使用して動画からサムネイルを生成する
    // ここではシミュレーションのみを行い、実際のロジックは実装しません
    this.logger.log('サムネイル生成（シミュレーション）');
    return Buffer.from('サムネイルデータ');
  }

  // オブジェクト名からURLを生成するユーティリティメソッド
  getFileUrl(objectName: string): string {
    return `http://${this.configService.get('MINIO_ENDPOINT')}:${this.configService.get(
      'MINIO_PORT',
    )}/${this.bucketName}/${objectName}`;
  }
} 
