import * as fs from "fs";
import * as path from "path";

/**
 * テンプレートファイルを読み込み、変数を置換するユーティリティ関数
 * @param templateName テンプレートファイル名（拡張子なし）
 * @param variables 置換する変数のオブジェクト
 */
export function loadTemplate(
  templateName: string,
  variables: Record<string, string>,
): string {
  // テンプレートファイルのパス
  const templatePath = path.join(__dirname, "templates", `${templateName}.txt`);

  try {
    // テンプレートファイルを読み込む
    let templateContent = fs.readFileSync(templatePath, "utf8");

    // 変数を置換
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\$\\{${key}\\}`, "g");
      templateContent = templateContent.replace(regex, value || "");
    });

    return templateContent;
  } catch (error) {
    console.error(
      `テンプレートファイルの読み込みに失敗しました: ${templateName}`,
      error,
    );
    throw new Error(
      `メールテンプレートの読み込みに失敗しました: ${templateName}`,
    );
  }
}
