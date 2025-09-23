import { ApplicationStatus } from '@generated/prisma';
export declare class CreateApplicationDto {
    title: string;
    locale?: string;
    status?: ApplicationStatus;
}
