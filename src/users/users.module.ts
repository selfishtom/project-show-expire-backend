import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ExternalService } from '../external/external.service';

@Module({
    controllers: [UsersController],
    providers: [UsersService, ExternalService],
})
export class UsersModule { } 