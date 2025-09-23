"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const timezone_middleware_1 = require("./timezone.middleware");
const i18n_service_1 = require("../i18n/i18n.service");
describe('TimezoneMiddleware', () => {
    let middleware;
    let i18nService;
    beforeEach(async () => {
        const mockI18nService = {
            detectLocale: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                timezone_middleware_1.TimezoneMiddleware,
                { provide: i18n_service_1.I18nService, useValue: mockI18nService },
            ],
        }).compile();
        middleware = module.get(timezone_middleware_1.TimezoneMiddleware);
        i18nService = module.get(i18n_service_1.I18nService);
    });
    it('should be defined', () => {
        expect(middleware).toBeDefined();
    });
    it('should set timezone and locale from headers', () => {
        const req = {
            headers: {
                'x-timezone': 'America/New_York',
                'accept-language': 'en-US,en;q=0.9',
            },
        };
        const res = {
            setHeader: jest.fn(),
        };
        const next = jest.fn();
        i18nService.detectLocale.mockReturnValue('en');
        middleware.use(req, res, next);
        expect(req.timezone).toBe('America/New_York');
        expect(req.locale).toBe('en');
        expect(req.i18n).toBe(i18nService);
        expect(res.setHeader).toHaveBeenCalledWith('x-server-timezone', 'America/New_York');
        expect(res.setHeader).toHaveBeenCalledWith('x-server-locale', 'en');
        expect(next).toHaveBeenCalled();
    });
    it('should use default timezone when not provided', () => {
        const req = {
            headers: {
                'accept-language': 'ja',
            },
        };
        const res = {
            setHeader: jest.fn(),
        };
        const next = jest.fn();
        i18nService.detectLocale.mockReturnValue('ja');
        middleware.use(req, res, next);
        expect(req.timezone).toBe('Asia/Tokyo');
        expect(req.locale).toBe('ja');
        expect(next).toHaveBeenCalled();
    });
    it('should handle missing headers gracefully', () => {
        const req = {
            headers: {},
        };
        const res = {
            setHeader: jest.fn(),
        };
        const next = jest.fn();
        i18nService.detectLocale.mockReturnValue('ja');
        middleware.use(req, res, next);
        expect(req.timezone).toBe('Asia/Tokyo');
        expect(req.locale).toBe('ja');
        expect(next).toHaveBeenCalled();
    });
});
//# sourceMappingURL=timezone.middleware.spec.js.map