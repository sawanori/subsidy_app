"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
describe('AppController', () => {
    let appController;
    let appService;
    beforeEach(async () => {
        const app = await testing_1.Test.createTestingModule({
            controllers: [app_controller_1.AppController],
            providers: [app_service_1.AppService],
        }).compile();
        appController = app.get(app_controller_1.AppController);
        appService = app.get(app_service_1.AppService);
    });
    describe('root', () => {
        it('should return "Subsidy App Backend API is running!"', () => {
            expect(appController.getHello()).toBe('Subsidy App Backend API is running!');
        });
    });
    describe('health', () => {
        it('should return health status object', () => {
            const result = appController.getHealth();
            expect(result).toHaveProperty('status', 'ok');
            expect(result).toHaveProperty('timestamp');
            expect(typeof result.timestamp).toBe('string');
        });
    });
});
//# sourceMappingURL=app.controller.spec.js.map