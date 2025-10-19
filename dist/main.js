"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const corsOrigins = process.env.CORS_ORIGIN === '*'
        ? '*'
        : process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
            : ['http://localhost:3000', 'http://localhost:3001'];
    app.enableCors({
        origin: corsOrigins,
        credentials: corsOrigins !== '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('NFT Marketplace API')
        .setDescription('Solana NFT Marketplace Backend API - Blockchain\'den doğrudan NFT verilerini çeker')
        .setVersion('1.0')
        .addTag('auth', 'Authentication operations')
        .addTag('nft', 'NFT marketplace operations')
        .addTag('nft-admin', 'NFT admin operations (requires JWT authentication)')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token (obtained from /auth/login)',
        in: 'header',
    }, 'JWT-auth')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    await app.listen(process.env.PORT ?? 3001);
    console.log(`🚀 Server running on http://localhost:${process.env.PORT ?? 3001}`);
    console.log(`📚 Swagger docs available at http://localhost:${process.env.PORT ?? 3001}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map