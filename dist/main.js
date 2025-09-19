"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: ['http://localhost:3000', 'http://localhost:3001', 'https://localhost:3000', 'https://localhost:3001'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('NFT Marketplace API')
        .setDescription('Solana NFT Marketplace Backend API - Blockchain\'den doğrudan NFT verilerini çeker')
        .setVersion('1.0')
        .addTag('nft', 'NFT marketplace operations')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    await app.listen(process.env.PORT ?? 3001);
    console.log(`🚀 Server running on http://localhost:${process.env.PORT ?? 3001}`);
    console.log(`📚 Swagger docs available at http://localhost:${process.env.PORT ?? 3001}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map