import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ExternalService } from '../external/external.service';

interface SearchResponse {
    success: boolean;
    msg: string;
    obj: {
        id: number;
        inboundId: number;
        enable: boolean;
        email: string;
        up: number;
        down: number;
        expiryTime: number;
        total: number;
        reset: number;
        status: 'active' | 'expired';
        timeUntilEnd?: string;
    };
}

@Controller('search')
export class SearchController {
    private readonly logger = new Logger(SearchController.name);

    constructor(private readonly externalService: ExternalService) { }

    /**
     * Search for client traffic information
     * @param q The search query (email)
     * @returns Promise<SearchResponse> Search results
     */
    @Get()
    async search(@Query('q') query: string): Promise<SearchResponse> {
        this.logger.log(`Searching for client traffic with email: ${query}`);
        const response = await this.externalService.search(query);

        // Convert expiry time to milliseconds and compare with current time
        const currentTime = Date.now();
        const expiryTime = response.obj.expiryTime; // Convert timestamp with asia/tehran

        if (expiryTime === 0) {
            response.obj.status = 'active';
        } else if (expiryTime < currentTime) {
            response.obj.status = 'expired';
        } else {
            // Account is still active
            response.obj.status = 'active';

            // Calculate time until end
            const timeUntilEnd = expiryTime - currentTime;
            const days = Math.floor(timeUntilEnd / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeUntilEnd % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeUntilEnd % (1000 * 60 * 60)) / (1000 * 60));

            response.obj.timeUntilEnd = `${days}d ${hours}h ${minutes}m`;
        }

        return response;
    }
} 