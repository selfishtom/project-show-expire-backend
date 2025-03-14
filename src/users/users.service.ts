import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ExternalService } from '../external/external.service';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(private readonly externalService: ExternalService) { }

    /**
     * Get user information by user code
     * @param userCode The user code to search for
     * @returns Promise<any> User information
     */
    async getUserByCode(userCode: string): Promise<any> {
        try {
            const response = await this.externalService.search(userCode);
            if (!response.success || !response.obj) {
                throw new NotFoundException(`User with code ${userCode} not found`);
            }
            return response.obj;
        } catch (error) {
            this.logger.error(`Error fetching user with code ${userCode}:`, error);
            throw error;
        }
    }
} 