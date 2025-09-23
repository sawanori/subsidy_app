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
exports.TimestampInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const i18n_service_1 = require("../i18n/i18n.service");
let TimestampInterceptor = class TimestampInterceptor {
    constructor(i18nService) {
        this.i18nService = i18nService;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const timezone = request.timezone || 'Asia/Tokyo';
        const locale = request.locale || 'ja';
        return next.handle().pipe((0, operators_1.map)((data) => {
            return this.transformTimestamps(data, timezone, locale);
        }));
    }
    transformTimestamps(data, timezone, locale) {
        if (data === null || data === undefined) {
            return data;
        }
        if (Array.isArray(data)) {
            return data.map(item => this.transformTimestamps(item, timezone, locale));
        }
        if (typeof data === 'object') {
            const transformed = { ...data };
            const timestampFields = [
                'createdAt',
                'updatedAt',
                'deletedAt',
                'submittedAt',
                'startDate',
                'endDate',
                'dueDate'
            ];
            timestampFields.forEach(field => {
                if (transformed[field] && transformed[field] instanceof Date) {
                    transformed[`${field}_utc`] = transformed[field].toISOString();
                    transformed[`${field}_formatted`] = this.i18nService.formatDateTime(transformed[field], undefined, { timezone, locale });
                }
            });
            Object.keys(transformed).forEach(key => {
                if (typeof transformed[key] === 'object' && transformed[key] !== null) {
                    transformed[key] = this.transformTimestamps(transformed[key], timezone, locale);
                }
            });
            return transformed;
        }
        return data;
    }
};
exports.TimestampInterceptor = TimestampInterceptor;
exports.TimestampInterceptor = TimestampInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [i18n_service_1.I18nService])
], TimestampInterceptor);
//# sourceMappingURL=timestamp.interceptor.js.map