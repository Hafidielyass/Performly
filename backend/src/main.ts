import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // When behind a reverse proxy / load balancer, req.ip must come from the X-Forwarded-For
  // chain instead of the proxy's address, or rate limiting would key every user to one IP.
  app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 0));

  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Every route is versioned (/v1/...) except ones explicitly marked VERSION_NEUTRAL
  // (the Docker healthcheck hits /health directly and must never move under a version).
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // No implicit "allow any origin" fallback: CORS_ORIGIN must be set explicitly, or the
  // request is rejected. `credentials: true` + a reflected/any origin would let any website
  // ride the browser's cookies (the refresh token) against this API.
  const corsOrigin = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim());
  if (!corsOrigin || corsOrigin.length === 0) {
    throw new Error('CORS_ORIGIN must be set (comma-separated list of allowed origins).');
  }
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  const port = process.env.PORT ?? 3001;
  // Close Prisma / BullMQ connections cleanly on SIGTERM/SIGINT so a rolling
  // (re)deploy never leaves half-open TCP connections behind.
  app.enableShutdownHooks();
  await app.listen(port);
}
bootstrap();
