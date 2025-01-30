import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SocialController } from './controllers/social.controller';
import { XProvider } from '@gitroom/nestjs-libraries/integrations/social/x.provider';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

import { DatabaseModule } from '@gitroom/nestjs-libraries/database/prisma/database.module';
import { ApiModule } from '@gitroom/backend/api/api.module';
import { APP_GUARD } from '@nestjs/core';
import { PoliciesGuard } from '@gitroom/backend/services/auth/permissions/permissions.guard';
import { BullMqModule } from '@gitroom/nestjs-libraries/bull-mq-transport-new/bull.mq.module';
import { PluginModule } from '@gitroom/plugins/plugin.module';
import { PublicApiModule } from '@gitroom/backend/public-api/public.api.module';
import { ThrottlerBehindProxyGuard } from '@gitroom/nestjs-libraries/throttler/throttler.provider';
import { ThrottlerModule } from '@nestjs/throttler';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullMqModule,
    DatabaseModule,
    ApiModule,
    PluginModule,
    PublicApiModule,
    ThrottlerModule.forRoot([
      {
        ttl: 3600000,
        limit: 30,
      },
    ]),
  ],
  controllers: [SocialController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PoliciesGuard,
    },
    XProvider,
    JwtStrategy,
    PrismaService,
  ],
  get exports() {
    return [...this.imports];
  },
})
export class AppModule {}
