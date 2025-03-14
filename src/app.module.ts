import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { SearchModule } from './search/search.module';
import { ExternalService } from './external/external.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ScheduleModule.forRoot(),
        HttpModule,
        SearchModule,
    ],
    providers: [ExternalService],
})
export class AppModule { } 