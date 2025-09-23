"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataRetentionService = exports.prisma = void 0;
const prisma_1 = require("@generated/prisma");
exports.prisma = new prisma_1.PrismaClient({
    log: ['query', 'error'],
}).$extends({
    query: {
        bankAccount: {
            findMany({ args, query }) {
                return query(args).then(results => results.map(account => ({
                    ...account,
                    accountNumber: `****${account.accountNumber.slice(-4)}`
                })));
            },
            findFirst({ args, query }) {
                return query(args).then(result => result ? {
                    ...result,
                    accountNumber: `****${result.accountNumber.slice(-4)}`
                } : result);
            }
        },
        applicant: {
            findMany({ args, query }) {
                const results = query(args);
                return results;
            }
        }
    }
});
class DataRetentionService {
    static async cleanupExpiredPersonalData() {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        await exports.prisma.applicant.updateMany({
            where: {
                createdAt: {
                    lt: twelveMonthsAgo
                },
                deletedAt: null
            },
            data: {
                deletedAt: new Date()
            }
        });
        await exports.prisma.bankAccount.updateMany({
            where: {
                createdAt: {
                    lt: twelveMonthsAgo
                },
                deletedAt: null
            },
            data: {
                deletedAt: new Date()
            }
        });
        await exports.prisma.application.updateMany({
            where: {
                createdAt: {
                    lt: twelveMonthsAgo
                },
                deletedAt: null
            },
            data: {
                deletedAt: new Date()
            }
        });
        console.log(`Data retention cleanup completed for data older than ${twelveMonthsAgo}`);
    }
}
exports.DataRetentionService = DataRetentionService;
exports.default = exports.prisma;
//# sourceMappingURL=client.js.map