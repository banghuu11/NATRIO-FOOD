import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { UPLOAD_DIR } from './core/uploads.controller';

// Prisma returns BIGINT ids – make them JSON-serialisable everywhere.
(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  const origins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .concat(['http://localhost:3000', 'http://127.0.0.1:3000']);
  app.enableCors({ origin: [...new Set(origins)], credentials: true });

  app.useStaticAssets(UPLOAD_DIR, { prefix: '/uploads/', maxAge: '7d' });
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('NUTRIO Food API')
    .setDescription('API thương mại điện tử thực phẩm dinh dưỡng NUTRIO: sản phẩm, giỏ hàng, đặt hàng, dinh dưỡng cá nhân hóa và quản trị.')
    .setVersion('2.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config), {
    swaggerOptions: { persistAuthorization: true, docExpansion: 'none', filter: true },
    customSiteTitle: 'NUTRIO API Docs',
  });

  const port = process.env.PORT || 5001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 NUTRIO API:  http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger:     http://localhost:${port}/api/docs`);
}

bootstrap();
