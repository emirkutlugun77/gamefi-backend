import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

   app.enableCors({
    origin: '*',
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });


  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('NFT Marketplace API')
    .setDescription('Solana NFT Marketplace Backend API - Blockchain\'den doğrudan NFT verilerini çeker')
    .setVersion('1.0')
    .addTag('auth', 'Authentication operations')
    .addTag('nft', 'NFT marketplace operations')
    .addTag('nft-admin', 'NFT admin operations (requires JWT authentication)')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token (obtained from /auth/login)',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  await app.listen(process.env.PORT ?? 3001);
  console.log(`🚀 Server running on http://localhost:${process.env.PORT ?? 3001}`);
  console.log(`📚 Swagger docs available at http://localhost:${process.env.PORT ?? 3001}/api`);
}
bootstrap();
