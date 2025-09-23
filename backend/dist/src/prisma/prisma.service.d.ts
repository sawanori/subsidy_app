import { OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@generated/prisma';
import { I18nService } from '../common/i18n/i18n.service';
export declare class PrismaService extends PrismaClient implements OnModuleInit {
    private readonly i18nService?;
    constructor(i18nService?: I18nService);
    onModuleInit(): Promise<void>;
    convertTimestampsToUtc(data: any): any;
    onModuleDestroy(): Promise<void>;
}
