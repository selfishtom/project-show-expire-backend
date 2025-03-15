import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

async function bootstrap() {
    // SSL configuration
    let httpsOptions = undefined;

    if (process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH) {
        try {
            httpsOptions = {
                key: fs.readFileSync(process.env.SSL_KEY_PATH),
                cert: fs.readFileSync(process.env.SSL_CERT_PATH),
            };
        } catch (error) {
            console.warn('SSL certificates not found, running without SSL:', error.message);
        }
    }

    const app = await NestFactory.create(AppModule, {
        ...(httpsOptions && { httpsOptions }),
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

    const port = process.env.PORT || 443;
    await app.listen(port);
    console.log(`Application is running on: ${httpsOptions ? 'https' : 'http'}://localhost:${port}`);
}

bootstrap(); 