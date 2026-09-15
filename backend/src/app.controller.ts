import { Controller, Get, ServiceUnavailableException, Version, VERSION_NEUTRAL } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  // Stays at /health regardless of API version - the Docker healthcheck and any
  // uptime/monitoring probe should never have to track a version bump. The endpoint
  // pings the database so an orchestrator doesn't declare the API "healthy" while it
  // can no longer serve a single request that touches data.
  @Version(VERSION_NEUTRAL)
  @Get('health')
  async health() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'up' };
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'down' });
    }
  }
}