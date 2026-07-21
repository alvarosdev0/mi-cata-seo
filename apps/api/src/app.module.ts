import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { auth } from './auth';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { ArticlesModule } from './articles/articles.module';
import { QueueModule } from './queue/queue.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 30,
    }]),
    AuthModule.forRoot({
      auth,
      bodyParser: {
        json: { limit: "2mb" },
        urlencoded: { limit: "2mb", extended: true },
        rawBody: true,
      },
    }),
    PrismaModule,
    ProductsModule,
    ArticlesModule,
    QueueModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
