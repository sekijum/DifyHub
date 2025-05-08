import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "@/core/auth/strategies/jwt.strategy";
import { LocalStrategy } from "@/core/auth/strategies/local.strategy";
import { MailerConfigModule } from "@/core/mailer/mailer.module";
import { JwtAuthGuard } from "@/core/auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "@/core/auth/guards/optional-jwt-auth.guard";
import { RolesGuard } from "@/core/auth/guards/roles.guard";

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: async () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN },
      }),
    }),
    MailerConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    RolesGuard,
  ],
  exports: [AuthService, JwtAuthGuard, OptionalJwtAuthGuard, RolesGuard],
})
export class AuthModule {}
