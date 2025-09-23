"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("@generated/prisma");
const i18n_service_1 = require("../common/i18n/i18n.service");
let PrismaService = class PrismaService extends prisma_1.PrismaClient {
    constructor(i18nService) {
        super();
        this.i18nService = i18nService;
    }
    async onModuleInit() {
        try {
            await this.$connect();
        }
        catch (error) {
            console.log('Database connection skipped for development mode');
        }
    }
    convertTimestampsToUtc(data) {
        const timestampFields = [
            'createdAt',
            'updatedAt',
            'deletedAt',
            'submittedAt',
            'startDate',
            'endDate',
            'dueDate'
        ];
        for (const field of timestampFields) {
            if (data[field] && typeof data[field] !== 'undefined') {
                if (typeof data[field] === 'string') {
                    data[field] = new Date(data[field]);
                }
                if (data[field] instanceof Date) {
                    const dateString = data[field].toISOString();
                    if (!dateString.endsWith('Z')) {
                        data[field] = this.i18nService?.toUtc(data[field]) || new Date(data[field].getTime());
                    }
                }
            }
        }
        Object.keys(data).forEach(key => {
            if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
                this.convertTimestampsToUtc(data[key]);
            }
        });
        return data;
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [i18n_service_1.I18nService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map