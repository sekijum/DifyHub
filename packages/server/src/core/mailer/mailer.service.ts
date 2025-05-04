import { Injectable } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client'; // 必要に応じてUserモデルをインポート

@Injectable()
export class MailerService {
  constructor(
    private readonly mailerService: NestMailerService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * パスワードリセット用のメールを送信する
   * @param user ユーザー情報
   * @param token パスワードリセットトークン
   */
  async sendPasswordResetEmail(user: Pick<User, 'email' | 'name'>, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const textContent = `
${user.name || '利用者'} 様

DifyHubのパスワードリセットのリクエストを受け付けました。
下記のURLからパスワードのリセットを行ってください。

${resetUrl}

このリンクは24時間有効です。

このメールに心当たりがない場合は、このメールを無視してください。
あなたのアカウントに変更はありません。

DifyHub チーム
`;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'パスワードのリセット | DifyHub',
        text: textContent,
      });
      console.log(`Password reset email sent successfully to ${user.email}`);
    } catch (error: any) {
      console.error(`Failed to send password reset email to ${user.email}`, error.stack);
      throw new Error('パスワードリセットメールの送信に失敗しました。');
    }
  }

  /**
   * 新規登録ユーザーにウェルカムメールを送信する
   * @param user ユーザー情報 (少なくとも email と name が必要)
   */
  async sendWelcomeEmail(user: Pick<User, 'email' | 'name'>): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const loginUrl = `${frontendUrl}/signin`;
    
    const textContent = `
${user.name || '新規ユーザー'} 様

DifyHubへの登録ありがとうございます！

AIアプリケーションのハブへようこそ。DifyHubでは、様々なAIアプリを探索したり、
お気に入りのアプリを見つけたりすることができます。

サインインはこちら: ${loginUrl}

何かご不明な点がございましたら、お気軽にサポートまでお問い合わせください。

DifyHub チーム
`;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'DifyHub へようこそ！',
        text: textContent,
      });
      console.log(`Welcome email sent successfully to ${user.email}`);
    } catch (error: any) {
      console.error(`Failed to send welcome email to ${user.email}`, error.stack);
      // Welcomeメールの送信失敗は、サインアップ処理全体を失敗させないようにエラーをスローしない
    }
  }

  /**
   * 開発者申請が承認されたことを通知するメール
   * @param user ユーザー情報 (少なくとも email と name が必要)
   * @param resultReason 承認理由
   */
  async sendDeveloperRequestApprovedEmail(
    user: Pick<User, 'email' | 'name'>,
    resultReason?: string
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const newAppUrl = `${frontendUrl}/my/apps/new`;
    const reason = resultReason || '開発者としての十分な実績を確認できました。';
    
    const textContent = `
${user.name} 様

DifyHubへの開発者申請が承認されましたのでお知らせします。

【承認理由】
${reason}

これにより、DifyHubプラットフォームでアプリを公開することができるようになりました。
新しく開発者権限が付与され、以下の機能が利用可能になりました：

- アプリの作成と公開
- アプリの収益化とデータ分析
- ユーザーフィードバックの管理

開発者ダッシュボードにアクセスして、早速最初のアプリを公開してみましょう！
新しいアプリを作成する: ${newAppUrl}

開発者として活躍されることを楽しみにしています。
お困りのことがあれば、いつでもサポートチームにお問い合わせください。

DifyHubをご利用いただきありがとうございます。

DifyHub チーム

※このメールは自動送信されています。返信はできませんのでご了承ください。
`;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'DifyHub 開発者申請が承認されました',
        text: textContent,
      });
      console.log(`Developer request approved email sent successfully to ${user.email}`);
    } catch (error: any) {
      console.error(`Failed to send developer approval email to ${user.email}`, error.stack);
      // メール送信失敗はログに記録するが、処理全体の失敗にはしない
    }
  }

  /**
   * 開発者申請が却下されたことを通知するメール
   * @param user ユーザー情報 (少なくとも email と name が必要)
   * @param resultReason 却下理由（オプション）
   */
  async sendDeveloperRequestRejectedEmail(
    user: Pick<User, 'email' | 'name'>, 
    resultReason?: string
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const contactUrl = `${frontendUrl}/contact`;
    const reason = resultReason || '詳細な理由は記載されていません';
    
    const textContent = `
${user.name} 様

いつもDifyHubをご利用いただき、ありがとうございます。

誠に申し訳ございませんが、DifyHubへの開発者申請は承認されませんでした。

【理由】
${reason}

開発者として再申請される場合は、以下の点にご注意ください：
- より詳細な申請理由を記載してください
- ポートフォリオやサンプル作品へのリンクを追加してください
- 開発者としての実績や経験について記載してください

ご不明な点がございましたら、サポートチームにお問い合わせください。
サポートに問い合わせる: ${contactUrl}

引き続きDifyHubをよろしくお願いいたします。

DifyHub チーム

※このメールは自動送信されています。返信はできませんのでご了承ください。
`;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'DifyHub 開発者申請の結果について',
        text: textContent,
      });
      console.log(`Developer request rejected email sent successfully to ${user.email}`);
    } catch (error: any) {
      console.error(`Failed to send developer rejection email to ${user.email}`, error.stack);
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
    user: Pick<User, 'email' | 'name'>,
    appName: string
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const appDetailsUrl = `${frontendUrl}/my/apps`;
    
    const textContent = `
${user.name} 様

あなたのアプリ「${appName}」が公開されました。おめでとうございます！

アプリは現在DifyHubで公開されており、すべてのユーザーに利用可能になっています。
アプリの利用状況や評価は開発者ダッシュボードから確認できます。

アプリ管理ページ: ${appDetailsUrl}

何かご質問がありましたら、サポートチームにお問い合わせください。

DifyHubをご利用いただきありがとうございます。

DifyHub チーム

※このメールは自動送信されています。返信はできませんのでご了承ください。
`;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: `【DifyHub】あなたのアプリ「${appName}」が公開されました`,
        text: textContent,
      });
      console.log(`App published email sent successfully to ${user.email}`);
    } catch (error: any) {
      console.error(`Failed to send app published email to ${user.email}`, error.stack);
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
    user: Pick<User, 'email' | 'name'>,
    appName: string,
    resultReason?: string
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const appDetailsUrl = `${frontendUrl}/my/apps`;
    const contactUrl = `${frontendUrl}/contact`;
    const reason = resultReason || 'コンテンツポリシーに準拠していません。詳細はサポートにお問い合わせください。';
    
    const textContent = `
${user.name} 様

あなたのアプリ「${appName}」は、以下の理由により非公開になりました。

【非公開理由】
${reason}

アプリの修正後、再度公開申請を行うことができます。
アプリの管理は開発者ダッシュボードから行ってください。

アプリ管理ページ: ${appDetailsUrl}

ご不明な点がございましたら、サポートチームにお問い合わせください。
サポートに問い合わせる: ${contactUrl}

DifyHubをご利用いただきありがとうございます。

DifyHub チーム

※このメールは自動送信されています。返信はできませんのでご了承ください。
`;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: `【DifyHub】アプリ「${appName}」が非公開になりました`,
        text: textContent,
      });
      console.log(`App private email sent successfully to ${user.email}`);
    } catch (error: any) {
      console.error(`Failed to send app private email to ${user.email}`, error.stack);
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
    user: Pick<User, 'email' | 'name'>,
    appName: string,
    resultReason?: string
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const appDetailsUrl = `${frontendUrl}/my/apps`;
    const contactUrl = `${frontendUrl}/contact`;
    const reason = resultReason || '利用規約違反の可能性があるため、一時的に停止されました。詳細はサポートにお問い合わせください。';
    
    const textContent = `
${user.name} 様

あなたのアプリ「${appName}」は、以下の理由により停止されました。

【停止理由】
${reason}

停止されたアプリはユーザーに表示されず、利用することができません。
アプリの停止に関する詳細や対応方法については、サポートチームにお問い合わせください。

アプリ管理ページ: ${appDetailsUrl}
サポートに問い合わせる: ${contactUrl}

DifyHubをご利用いただきありがとうございます。

DifyHub チーム

※このメールは自動送信されています。返信はできませんのでご了承ください。
`;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: `【DifyHub】アプリ「${appName}」が停止されました`,
        text: textContent,
      });
      console.log(`App suspended email sent successfully to ${user.email}`);
    } catch (error: any) {
      console.error(`Failed to send app suspended email to ${user.email}`, error.stack);
      // メール送信失敗はログに記録するが、処理全体の失敗にはしない
    }
  }

  /**
   * アプリがアーカイブされたことを通知するメール
   * @param user ユーザー情報 (少なくとも email と name が必要)
   * @param appName アプリ名
   */
  async sendAppArchivedEmail(
    user: Pick<User, 'email' | 'name'>,
    appName: string
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const appDetailsUrl = `${frontendUrl}/my/apps`;
    
    const textContent = `
${user.name} 様

あなたのアプリ「${appName}」が管理者によってアーカイブされました。

アーカイブされたアプリはユーザーに表示されなくなります。
必要に応じて、開発者ダッシュボードからアプリの再公開申請を行うことができます。

アプリ管理ページ: ${appDetailsUrl}

ご不明な点がございましたら、サポートチームにお問い合わせください。

DifyHubをご利用いただきありがとうございます。

DifyHub チーム

※このメールは自動送信されています。返信はできませんのでご了承ください。
`;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: `【DifyHub】アプリ「${appName}」がアーカイブされました`,
        text: textContent,
      });
      console.log(`App archived email sent successfully to ${user.email}`);
    } catch (error: any) {
      console.error(`Failed to send app archived email to ${user.email}`, error.stack);
      // メール送信失敗はログに記録するが、処理全体の失敗にはしない
    }
  }

  // 他のメール送信メソッド (例: パスワードリセット、メールアドレス確認など) もここに追加可能
} 
