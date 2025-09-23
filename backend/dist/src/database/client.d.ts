export declare const prisma: import("@generated/prisma/runtime/library").DynamicClientExtensionThis<import("@generated/prisma").Prisma.TypeMap<import("@generated/prisma/runtime/library").InternalArgs & {
    result: {};
    model: {};
    query: {};
    client: {};
}, {}>, import("@generated/prisma").Prisma.TypeMapCb<{
    log: ("query" | "error")[];
}>, {
    result: {};
    model: {};
    query: {};
    client: {};
}>;
export type PrismaClientType = typeof prisma;
export declare class DataRetentionService {
    static cleanupExpiredPersonalData(): Promise<void>;
}
export default prisma;
