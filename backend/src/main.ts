import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Middleware
  app.use(helmet());
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
    credentials: true,
  });

  // Global Prefix & Validation
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API Documentation (OpenAPI 3.0)
  const config = new DocumentBuilder()
    .setTitle('NUTRIO - Healthy Food E-Commerce API')
    .setDescription(
      `Tài liệu API Nền tảng Thương mại Điện tử Thực phẩm Lành mạnh & Dinh dưỡng Cá nhân hóa NUTRIO.
      
### Tính năng nổi bật:
- 🥗 **Sản phẩm & Dinh dưỡng**: Nutri-Score (Grade A-E), Macro (Protein, Carb, Fat), Lọc dị ứng & Chế độ ăn (Keto, Eat Clean, Vegan...).
- 📊 **Hồ sơ sức khỏe**: Tính tự động BMI, BMR, TDEE, Calo mục tiêu, Nhật ký ăn uống & Nhật ký nước.
- 📦 **Quản lý kho FEFO**: Phân bổ lô hàng xuất theo hạn sử dụng sớm nhất.
- 🎯 **Quiz Dinh dưỡng**: Trắc nghiệm cá nhân hóa gợi ý thực phẩm theo thể trạng.
- 🍲 **Công thức & Thực đơn**: Shop the Recipe, Kế hoạch ăn 7 ngày.`,
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT Authorization',
        description: 'Nhập access token JWT của bạn (ví dụ: Bearer <token>)',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health', 'Kiểm tra trạng thái máy chủ & kết nối CSDL')
    .addTag('Auth', 'Xác thực, Đăng ký, Đăng nhập & Quản lý phiên')
    .addTag('Users', 'Quản lý thông tin tài khoản, Hồ sơ người dùng & Sổ địa chỉ')
    .addTag('Health Profile', 'Hồ sơ dinh dưỡng, BMI, BMR, TDEE & Quản lý Dị ứng/Chế độ ăn')
    .addTag('Categories', 'Danh mục thực phẩm, Nhãn hàng & Chứng nhận (Organic, VietGAP)')
    .addTag('Products', 'Danh sách sản phẩm, Tìm kiếm, Chi tiết, Biến thể & Nutrition Facts')
    .addTag('Carts', 'Giỏ hàng & Máy tính dinh dưỡng giỏ hàng')
    .addTag('Orders', 'Tạo đơn hàng, Phân bổ kho FEFO, Lịch sử trạng thái & Thanh toán')
    .addTag('Coupons & Flash Sales', 'Mã giảm giá, Combo tiết kiệm & Flash sale')
    .addTag('Quiz', 'Bài trắc nghiệm dinh dưỡng & Gợi ý thực phẩm cá nhân hóa')
    .addTag('Recipes & Meal Plans', 'Công thức món ăn chuẩn Eat Clean & Thực đơn mẫu')
    .addTag('Reviews', 'Đánh giá & Bình luận sản phẩm')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'NUTRIO API Documentation',
  });

  const port = process.env.PORT || 5001;
  await app.listen(port);
  console.log(`🚀 NUTRIO Backend Server running at: http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger API Docs available at:    http://localhost:${port}/api/docs`);
}

bootstrap();
