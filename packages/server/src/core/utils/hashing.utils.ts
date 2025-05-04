import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10; // ソルトラウンド数を定数化

/**
 * パスワードをハッシュ化します。
 * @param password 平文パスワード
 * @returns ハッシュ化されたパスワードのPromise
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 平文パスワードとハッシュ化されたパスワードを比較します。
 * @param plainPassword 平文パスワード
 * @param hashedPassword ハッシュ化されたパスワード
 * @returns パスワードが一致する場合は true、それ以外は false のPromise
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
} 
