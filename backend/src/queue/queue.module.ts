import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Phase 2 stub: registers the BullMQ connection so a `notifications` queue can be
 * added later (e.g. reminders for PlanActionRH.dateSuivi) without touching the rest
 * of the app's wiring. No processor/queue is registered yet - nothing is enqueued
 * in Phase 1.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = new URL(config.getOrThrow<string>('REDIS_URL'));
        return {
          connection: {
            host: redisUrl.hostname,
            port: Number(redisUrl.port || 6379),
          },
        };
      },
    }),
  ],
})
export class QueueModule {}
