import { Logger } from "@nestjs/common";

/**
 * アプリケーション全体で使用するログユーティリティ
 */
class AppLogger {
  private static instance: AppLogger;
  private readonly logger: Logger;

  private constructor() {
    this.logger = new Logger("App");
  }

  /**
   * AppLoggerのシングルトンインスタンスを取得
   */
  public static getInstance(): AppLogger {
    if (!AppLogger.instance) {
      AppLogger.instance = new AppLogger();
    }
    return AppLogger.instance;
  }

  /**
   * 情報ログを出力
   * @param message ログメッセージ
   * @param context ログのコンテキスト（クラス名やメソッド名）
   */
  log(message: string, context?: string): void {
    this.logger.log(message, context);
  }

  /**
   * エラーログを出力
   * @param message エラーメッセージ
   * @param trace スタックトレース
   * @param context ログのコンテキスト（クラス名やメソッド名）
   */
  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, trace, context);
  }

  /**
   * 警告ログを出力
   * @param message 警告メッセージ
   * @param context ログのコンテキスト（クラス名やメソッド名）
   */
  warn(message: string, context?: string): void {
    this.logger.warn(message, context);
  }

  /**
   * デバッグログを出力
   * @param message デバッグメッセージ
   * @param context ログのコンテキスト（クラス名やメソッド名）
   */
  debug(message: string, context?: string): void {
    this.logger.debug(message, context);
  }

  /**
   * 詳細なログを出力
   * @param message 詳細メッセージ
   * @param context ログのコンテキスト（クラス名やメソッド名）
   */
  verbose(message: string, context?: string): void {
    this.logger.verbose(message, context);
  }
}

// シングルトンインスタンスをエクスポート
export const logger = AppLogger.getInstance();
