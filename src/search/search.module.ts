import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SearchController } from './search.controller';
import { ExternalService } from '../external/external.service';

@Module({
    imports: [HttpModule],
    controllers: [SearchController],
    providers: [ExternalService],
})
export class SearchModule { } 