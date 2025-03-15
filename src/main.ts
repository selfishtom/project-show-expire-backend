import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
    // SSL configuration
    const httpsOptions = {
        key: fs.readFileSync(path.join(__dirname, '../ssl/private.key')),
        cert: fs.readFileSync(path.join(__dirname, '../ssl/certificate.crt')),
    };

    const app = await NestFactory.create(AppModule, {
        httpsOptions,
        logger: WinstonModule.createLogger({
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.colorize(),
                        winston.format.simple(),
                    ),
                }),
                new winston.transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                }),
                new winston.transports.File({
                    filename: 'logs/combined.log',
                }),
            ],
        }),
    });

    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        allowedHeaders: 'Content-Type,Authorization',
    });

    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api/v1');

    const port = process.env.PORT || 443; // Changed to default HTTPS port
    await app.listen(port);
    console.log(`Application is running on: https://localhost:${port}`);
}

bootstrap(); 