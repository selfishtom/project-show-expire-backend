import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ExternalService } from '../external/external.service';

@Module({
    controllers: [AuthController],
    providers: [AuthService, ExternalService],
})
export class AuthModule { } 