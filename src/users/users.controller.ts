import { Controller, Get, Param, Logger } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    private readonly logger = new Logger(UsersController.name);

    constructor(private readonly usersService: UsersService) { }

    /**
     * Get user information by user code
     * @param code The user code to search for
     * @returns Promise<any> User information
     */
    @Get(':code')
    async getUserByCode(@Param('code') code: string): Promise<any> {
        this.logger.log(`Fetching user with code: ${code}`);
        return this.usersService.getUserByCode(code);
    }
} 