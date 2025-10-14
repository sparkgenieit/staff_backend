import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Serialize BigInt values in JSON responses (e.g., Prisma BigInt IDs)
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

function parseAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS || '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowList = parseAllowedOrigins();
  const isDev = process.env.NODE_ENV !== 'production';

  app.enableCors({
    origin: allowList.length
      ? (origin, cb) => {
          // No Origin (mobile apps, curl, same-origin) → allow
          if (!origin) return cb(null, true);
          if (allowList.includes(origin)) return cb(null, true);
          // Helpful log for debugging
          // eslint-disable-next-line no-console
          console.warn('CORS blocked origin:', origin, 'Allowed:', allowList);
          return cb(new Error('Not allowed by CORS'), false);
        }
      : (origin, cb) => {
          // Dev default: allow everything to avoid CORS errors
          return cb(null, true);
        },
    credentials: true, // allow sending Authorization header
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With',
    exposedHeaders: 'Content-Disposition',
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // graceful shutdown with Prisma
  const prisma = app.get(PrismaService);
  await prisma.enableShutdownHooks(app);

  const port = Number(process.env.PORT) || 5001;
  await app.listen(port);
  console.log(`API on http://localhost:${port}`);
  if (allowList.length) {
    console.log('CORS allow list:', allowList.join(', '));
  } else {
    console.log('CORS: allowing ALL origins (dev default). Set ALLOWED_ORIGINS to restrict.');
  }
}
bootstrap();