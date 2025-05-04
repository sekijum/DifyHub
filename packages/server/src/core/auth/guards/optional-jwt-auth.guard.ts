import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // handleRequestをオーバーライドして、認証エラー時に例外をスローしないようにする
  handleRequest(err, user, info, context, status) {
    // err: Passport が strategy 検証中にエラーを検出した場合 (例: JWTの形式不正)
    // user: strategy の validate メソッドが返すペイロード (認証成功時)
    // info: 追加情報 (例: トークン期限切れのエラー詳細)

    // デバッグ用にログ出力 (必要に応じて)
    // if (err || info) {
    //   console.debug('Optional Auth Guard - Error/Info:', { err, info: info?.message || info });
    // }

    // 認証が成功した場合は user ペイロードを返し、req.user にセットされる
    // 失敗した場合 (user が falsy) でも、null や undefined をそのまま返すことで、
    // 例外をスローせずに後続の処理に進む
    return user;
  }
} 
