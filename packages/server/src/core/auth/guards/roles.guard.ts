import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@prisma/client";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // @Roles() デコレータで指定されたロールを取得
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(), // メソッドレベルのメタデータを優先
      context.getClass(), // クラスレベルのメタデータ
    ]);

    // @Roles() が指定されていない場合は、アクセスを許可 (ガードの意味がないため)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // リクエストオブジェクトからユーザー情報を取得 (JwtAuthGuard などで設定されている前提)
    const { user } = context.switchToHttp().getRequest();

    console.log("user", user);
    // ユーザー情報が存在しない、またはユーザーにロールがない場合は拒否
    if (!user || !user.role) {
      return false;
    }

    // ユーザーのロールが必要なロールのいずれかに含まれているか確認
    return requiredRoles.some((role) => user.role === role);
  }
}
