import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AxiosResponse } from 'axios';

interface ClientTraffic {
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
}

interface SearchResponse {
    success: boolean;
    msg: string;
    obj: ClientTraffic;
}

@Injectable()
export class ExternalService {
    private readonly logger = new Logger(ExternalService.name);
    private lastLoginTime: Date | null = null;
    private readonly SESSION_DURATION = 590 * 60 * 1000; // 5h:50min in milliseconds
    private cookies: string[] = [];

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Perform login to external site
     * @returns Promise<void>
     */
    async login(): Promise<void> {
        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.configService.get('EXTERNAL_SITE_URL')}${this.configService.get('EXTERNAL_SITE_PATH')}/login`,
                    {
                        username: this.configService.get('EXTERNAL_SITE_USERNAME'),
                        password: this.configService.get('EXTERNAL_SITE_PASSWORD'),
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    },
                ),
            );

            if (response.status === 200) {
                this.lastLoginTime = new Date();
                // Extract cookies from response headers
                const setCookieHeaders = response.headers['set-cookie'];
                if (setCookieHeaders) {
                    this.cookies = setCookieHeaders.map(cookie => cookie.split(';')[0]);
                }
                this.logger.log('Successfully logged in to external site');
            } else {
                this.logger.error(`Login failed with status ${response.status}`);
                throw new Error('Login failed');
            }
        } catch (error) {
            this.logger.error('Failed to login to external site:', error);
            throw error;
        }
    }

    /**
     * Ensure we have a valid session
     * @returns Promise<void>
     */
    private async ensureValidSession(): Promise<void> {
        if (!this.lastLoginTime ||
            Date.now() - this.lastLoginTime.getTime() >= this.SESSION_DURATION) {
            await this.login();
        }
    }

    /**
     * Perform text search on external site
     * @param searchText The text to search for
     * @returns Promise<SearchResponse> Search results
     */
    async search(searchText: string): Promise<SearchResponse> {
        try {
            await this.ensureValidSession();

            const url = `${this.configService.get('EXTERNAL_SITE_URL')}${this.configService.get('EXTERNAL_SITE_PATH')}/panel/api/inbounds/getClientTraffics/${searchText}`;
            this.logger.log(`Making request to: ${url}`);

            const response: AxiosResponse<SearchResponse | string> = await firstValueFrom(
                this.httpService.get(url, {
                    headers: {
                        Cookie: this.cookies.join('; '),
                    },
                }),
            );

            this.logger.log(`Response status: ${response.status}`);

            // Check if response is HTML (indicating session expired)
            if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
                this.logger.log('Received HTML response, session likely expired. Attempting to re-login...');
                this.lastLoginTime = null; // Force re-login
                await this.ensureValidSession();

                // Retry the request after re-login
                const retryResponse: AxiosResponse<SearchResponse> = await firstValueFrom(
                    this.httpService.get(url, {
                        headers: {
                            Cookie: this.cookies.join('; '),
                        },
                    }),
                );

                if (!retryResponse.data.success) {
                    this.logger.error(`Search failed after re-login: ${retryResponse.data.msg}`);
                    return {
                        success: false,
                        msg: retryResponse.data.msg || 'Search failed',
                        obj: null
                    };
                }

                return retryResponse.data;
            }

            // Type guard to check if response.data is SearchResponse
            if (typeof response.data === 'object' && response.data !== null && 'success' in response.data) {
                if (!response.data.success) {
                    this.logger.error(`Search failed: ${response.data.msg}`);
                    return {
                        success: false,
                        msg: response.data.msg || 'Search failed',
                        obj: null
                    };
                }
                return response.data;
            }

            // If we get here, something unexpected happened
            this.logger.error('Unexpected response format');
            return {
                success: false,
                msg: 'Unexpected response format',
                obj: null
            };
        } catch (error) {
            this.logger.error(`Failed to perform search for "${searchText}":`, error);
            if (error.response) {
                this.logger.error(`Error response: ${JSON.stringify(error.response.data)}`);
                this.logger.error(`Error status: ${error.response.status}`);
            }
            return {
                success: false,
                msg: error.response?.data?.msg || error.message || 'Failed to perform search',
                obj: null
            };
        }
    }

    /**
     * Refresh session every 5 Hours
     */
    @Cron(CronExpression.EVERY_5_HOURS)
    async refreshSession() {
        try {
            await this.login();
            this.logger.log('Session refreshed successfully');
        } catch (error) {
            this.logger.error('Failed to refresh session:', error);
        }
    }
} 
