import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { UserPayload } from "@/core/auth/types/user-payload.interface";

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as UserPayload;
  },
);
