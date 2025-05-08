import { loadTemplate } from "./template-loader";

/**
 * テンプレートローダーのテスト用スクリプト
 * このファイルは開発時のテスト用であり、本番環境では使用しません
 */
function testTemplateLoader() {
  try {
    // パスワードリセットテンプレートのテスト
    const resetTemplate = loadTemplate("password-reset", {
      name: "テストユーザー",
      resetUrl: "https://example.com/reset-password?token=test-token",
    });
    console.log("パスワードリセットテンプレート:");
    console.log(resetTemplate);
    console.log("------------------------------");

    // ウェルカムメールテンプレートのテスト
    const welcomeTemplate = loadTemplate("welcome", {
      name: "新規ユーザー",
      loginUrl: "https://example.com/signin",
    });
    console.log("ウェルカムメールテンプレート:");
    console.log(welcomeTemplate);
    console.log("------------------------------");

    // 開発者申請承認テンプレートのテスト
    const approvedTemplate = loadTemplate("developer-request-approved", {
      name: "開発者ユーザー",
      reason: "テスト承認理由",
      newAppUrl: "https://example.com/my/apps/new",
    });
    console.log("開発者申請承認テンプレート:");
    console.log(approvedTemplate);
    console.log("------------------------------");

    console.log("テンプレートローダーのテスト完了");
  } catch (error) {
    console.error(
      "テンプレートローダーのテスト中にエラーが発生しました:",
      error,
    );
  }
}

// テスト実行（このファイルが直接実行された場合のみ）
if (require.main === module) {
  testTemplateLoader();
}
