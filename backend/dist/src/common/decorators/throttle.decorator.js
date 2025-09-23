"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Throttle = exports.THROTTLE_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.THROTTLE_KEY = 'throttle';
const Throttle = (limit, ttl) => (0, common_1.SetMetadata)(exports.THROTTLE_KEY, { limit, ttl });
exports.Throttle = Throttle;
//# sourceMappingURL=throttle.decorator.js.map