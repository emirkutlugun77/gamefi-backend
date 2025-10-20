import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend access
 /* const corsOrigins = process.env.CORS_ORIGIN === '*'
    ? '*'
    : process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
      : ['http://localhost:3000', 'http://localhost:3001'];

  app.enableCors({
    origin: corsOrigins,
    credentials: corsOrigins !== '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });*/

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
