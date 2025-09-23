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
exports.TimezoneMiddleware = void 0;
const common_1 = require("@nestjs/common");
const i18n_service_1 = require("../i18n/i18n.service");
let TimezoneMiddleware = class TimezoneMiddleware {
    constructor(i18nService) {
        this.i18nService = i18nService;
    }
    use(req, res, next) {
        const timezoneHeader = req.headers['x-timezone'];
        const acceptLanguage = req.headers['accept-language'];
        req.timezone = timezoneHeader || 'Asia/Tokyo';
        req.locale = this.i18nService.detectLocale(acceptLanguage);
        req.i18n = this.i18nService;
        res.setHeader('x-server-timezone', req.timezone);
        res.setHeader('x-server-locale', req.locale);
        next();
    }
};
exports.TimezoneMiddleware = TimezoneMiddleware;
exports.TimezoneMiddleware = TimezoneMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [i18n_service_1.I18nService])
], TimezoneMiddleware);
//# sourceMappingURL=timezone.middleware.js.map