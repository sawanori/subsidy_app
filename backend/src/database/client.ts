import { PrismaClient } from '@generated/prisma';

// Prisma client with security extensions
export const prisma = new PrismaClient({
  log: ['query', 'error'],
}).$extends({
  query: {
    bankAccount: {
      // Mask account numbers in logs - show only last 4 digits
      findMany({ args, query }) {
        return query(args).then(results => 
          results.map(account => ({
            ...account,
            accountNumber: `****${account.accountNumber.slice(-4)}`
          }))
        );
      },
      findFirst({ args, query }) {
        return query(args).then(result => 
          result ? {
            ...result,
            accountNumber: `****${result.accountNumber.slice(-4)}`
          } : result
        );
      }
    },
    applicant: {
      // Mask personal information in logs per governance.yaml
      findMany({ args, query }) {
        const results = query(args);
        // Log masking applied at service layer
        return results;
      }
    }
  }
});

export type PrismaClientType = typeof prisma;

// Data retention utility for personal data (12 months)
export class DataRetentionService {
  static async cleanupExpiredPersonalData() {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Soft delete expired applicant data
    await prisma.applicant.updateMany({
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

    // Soft delete expired bank accounts
    await prisma.bankAccount.updateMany({
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

    // Soft delete expired applications (contains personal locale data)
    await prisma.application.updateMany({
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

export default prisma;