"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: '.env.test' });
if (!process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/subsidy_test';
}
beforeAll(async () => {
});
afterAll(async () => {
});
jest.setTimeout(30000);
//# sourceMappingURL=setup.js.map