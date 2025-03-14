import { Injectable, Logger } from '@nestjs/common';
import { ExternalService } from '../external/external.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(private readonly externalService: ExternalService) { }

    /**
     * Refresh the session
     * @returns Promise<{ success: boolean }> Success status
     */
    async refreshSession(): Promise<{ success: boolean }> {
        try {
            await this.externalService.login();
            this.logger.log('Session refreshed successfully');
            return { success: true };
        } catch (error) {
            this.logger.error('Failed to refresh session:', error);
            return { success: false };
        }
    }
} 