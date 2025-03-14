import { Controller, Post, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(private readonly authService: AuthService) { }

    /**
     * Refresh the session
     * @returns Promise<{ success: boolean }> Success status
     */
    @Post('refresh')
    async refreshSession(): Promise<{ success: boolean }> {
        this.logger.log('Refreshing session');
        return this.authService.refreshSession();
    }
} 