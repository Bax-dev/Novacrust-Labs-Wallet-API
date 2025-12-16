import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Wallet API')
    .setDescription('A simple wallet service API with wallet creation, funding, and transfer capabilities')
    .setVersion('1.0')
    .addTag('wallets', 'Wallet management endpoints')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/swagger', app, document);

  await app.listen(process.env.PORT || 3000);
  console.log(`Application is running on: http://localhost:${process.env.PORT || 3000}`);
  console.log(`Swagger UI is available at: http://localhost:${process.env.PORT || 3000}/api/v1/swagger`);
}
bootstrap();

