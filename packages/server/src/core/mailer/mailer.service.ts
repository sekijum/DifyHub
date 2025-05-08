import { Injectable } from "@nestjs/common";
import { MailerService as NestMailerService } from "@nestjs-modules/mailer";
import { User } from "@prisma/client"; // 必要に応じてUserモデルをインポート
import { loadTemplate } from "./template-loader";

@Injectable()
export class MailerService {
  constructor(private readonly mailerService: NestMailerService) {}

  /**
   * パスワードリセット用のメールを送信する
   * @param user ユーザー情報
   * @param token パスワードリセットトークン
   */
  async sendPasswordResetEmail(
    user: Pick<User, "email" | "name">,
    token: string,
  ) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const textContent = loadTemplate("password-reset", {
      name: user.name || "",
      resetUrl,
    });

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: "パスワードのリセット | DifyHub",
        text: textContent,
      });
      console.log(`Password reset email sent successfully to ${user.email}`);
    } catch (error: any) {
      console.error(
        `Failed to send password reset email to ${user.email}`,
        error.stack,
      );
      throw new Error("パスワードリセットメールの送信に失敗しました。");
    }
  }

  /**
   * 新規登録ユーザーにウェルカムメールを送信する
   * @param user ユーザー情報 (少なくとも email と name が必要)
   */
  async sendWelcomeEmail(user: Pick<User, "email" | "name">) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const loginUrl = `${frontendUrl}/signin`;

    const textContent = loadTemplate("welcome", {
      name: user.name || "",
      loginUrl,
    });

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: "DifyHub へようこそ！",
        text: textContent,
      });
      console.log(`Welcome email sent successfully to ${user.email}`);
    } catch (error: any) {
      console.error(
        `Failed to send welcome email to ${user.email}`,
        error.stack,
      );
      // Welcomeメールの送信失敗は、サインアップ処理全体を失敗させないようにエラーをスローしない
    }
  }

  /**
   * 開発者申請が承認されたことを通知するメール
   * @param user ユーザー情報 (少なくとも email と name が必要)
   * @param resultReason 承認理由
   */
  async sendDeveloperRequestApprovedEmail(
    user: Pick<User, "email" | "name">,
    resultReason?: string,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const newAppUrl = `${frontendUrl}/my/apps/new`;
    const reason = resultReason || "開発者としての十分な実績を確認できました。";

    const textContent = loadTemplate("developer-request-approved", {
      name: user.name || "",
      reason,
      newAppUrl,
    });

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: "DifyHub 開発者申請が承認されました",
        text: textContent,
      });
      console.log(
        `Developer request approved email sent successfully to ${user.email}`,
      );
    } catch (error: any) {
      console.error(
        `Failed to send developer approval email to ${user.email}`,
        error.stack,
      );
      // メール送信失敗はログに記録するが、処理全体の失敗にはしない
    }
  }

  /**
   * 開発者申請が却下されたことを通知するメール
   * @param user ユーザー情報 (少なくとも email と name が必要)
   * @param resultReason 却下理由（オプション）
   */
  async sendDeveloperRequestRejectedEmail(
    user: Pick<User, "email" | "name">,
    resultReason?: string,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const contactUrl = `${frontendUrl}/contact`;
    const reason = resultReason || "詳細な理由は記載されていません";

    const textContent = loadTemplate("developer-request-rejected", {
      name: user.name || "",
      reason,
      contactUrl,
    });

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: "DifyHub 開発者申請の結果について",
        text: textContent,
      });
      console.log(
        `Developer request rejected email sent successfully to ${user.email}`,
      );
    } catch (error: any) {
      console.error(
        `Failed to send developer rejection email to ${user.email}`,
        error.stack,
      );
      // メール送信失敗はログに記録するが、処理全体の失敗にはしない
    }
  }

  // --- アプリ関連のメール通知 ---

  /**
   * アプリが公開されたことを通知するメール
   * @param user ユーザー情報 (少なくとも email と name が必要)
   * @param appName アプリ名
   */
  async sendAppPublishedEmail(
    user: Pick<User, "email" | "name">,
    appName: string,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const appDetailsUrl = `${frontendUrl}/my/apps`;

    const textContent = loadTemplate("app-published", {
      name: user.name || "",
      appName,
      appDetailsUrl,
    });

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: `【DifyHub】あなたのアプリ「${appName}」が公開されました`,
        text: textContent,
      });
      console.log(`App published email sent successfully to ${user.email}`);
    } catch (error: any) {
      console.error(
        `Failed to send app published email to ${user.email}`,
        error.stack,
      );
      // メール送信失敗はログに記録するが、処理全体の失敗にはしない
    }
  }

  /**
   * アプリが非公開になったことを通知するメール
   * @param user ユーザー情報 (少なくとも email と name が必要)
   * @param appName アプリ名
   * @param resultReason 非公開理由（オプション）
   */
  async sendAppPrivateEmail(
    user: Pick<User, "email" | "name">,
    appName: string,
    resultReason?: string,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const appDetailsUrl = `${frontendUrl}/my/apps`;
    const contactUrl = `${frontendUrl}/contact`;
    const reason =
      resultReason ||
      "コンテンツポリシーに準拠していません。詳細はサポートにお問い合わせください。";

    const textContent = loadTemplate("app-private", {
      name: user.name || "",
      appName,
      reason,
      appDetailsUrl,
      contactUrl,
    });

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: `【DifyHub】アプリ「${appName}」が非公開になりました`,
        text: textContent,
      });
      console.log(`App private email sent successfully to ${user.email}`);
    } catch (error: any) {
      console.error(
        `Failed to send app private email to ${user.email}`,
        error.stack,
      );
      // メール送信失敗はログに記録するが、処理全体の失敗にはしない
    }
  }

  /**
   * アプリが停止されたことを通知するメール
   * @param user ユーザー情報 (少なくとも email と name が必要)
   * @param appName アプリ名
   * @param resultReason 停止理由（オプション）
   */
  async sendAppSuspendedEmail(
    user: Pick<User, "email" | "name">,
    appName: string,
    resultReason?: string,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const appDetailsUrl = `${frontendUrl}/my/apps`;
    const contactUrl = `${frontendUrl}/contact`;
    const reason =
      resultReason ||
      "利用規約違反の可能性があるため、一時的に停止されました。詳細はサポートにお問い合わせください。";

    const textContent = loadTemplate("app-suspended", {
      name: user.name || "",
      appName,
      reason,
      appDetailsUrl,
      contactUrl,
    });

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: `【DifyHub】アプリ「${appName}」が停止されました`,
        text: textContent,
      });
      console.log(`App suspended email sent successfully to ${user.email}`);
    } catch (error: any) {
      console.error(
        `Failed to send app suspended email to ${user.email}`,
        error.stack,
      );
      // メール送信失敗はログに記録するが、処理全体の失敗にはしない
    }
  }

  /**
   * アプリがアーカイブされたことを通知するメール
   * @param user ユーザー情報 (少なくとも email と name が必要)
   * @param appName アプリ名
   */
  async sendAppArchivedEmail(
    user: Pick<User, "email" | "name">,
    appName: string,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const appDetailsUrl = `${frontendUrl}/my/apps`;

    const textContent = loadTemplate("app-archived", {
      name: user.name || "",
      appName,
      appDetailsUrl,
    });

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: `【DifyHub】アプリ「${appName}」がアーカイブされました`,
        text: textContent,
      });
      console.log(`App archived email sent successfully to ${user.email}`);
    } catch (error: any) {
      console.error(
        `Failed to send app archived email to ${user.email}`,
        error.stack,
      );
      // メール送信失敗はログに記録するが、処理全体の失敗にはしない
    }
  }

  // 他のメール送信メソッド (例: パスワードリセット、メールアドレス確認など) もここに追加可能
}
