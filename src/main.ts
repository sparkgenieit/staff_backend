import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Serialize BigInt values in JSON responses (e.g., Prisma BigInt IDs)
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // graceful shutdown with Prisma
  const prisma = app.get(PrismaService);
  await prisma.enableShutdownHooks(app);

  // default to 5001 (override with PORT env if set)
  const port = Number(process.env.PORT) || 5001;
  await app.listen(port);
  console.log(`API on http://localhost:${port}`);
}
bootstrap();
