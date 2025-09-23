import { PrismaService } from '../prisma/prisma.service';
import { FileProcessorService } from './services/file-processor.service';
import { SecurityService } from './services/security.service';
import { ProcessedEvidence, EvidenceSource, EvidenceProcessingOptions } from './interfaces/evidence.interface';
import { EvidenceListDto, EvidenceStatsDto } from './dto';
export declare class EvidenceService {
    private readonly prisma;
    private readonly fileProcessor;
    private readonly securityService;
    private readonly logger;
    constructor(prisma: PrismaService, fileProcessor: FileProcessorService, securityService: SecurityService);
    processFile(buffer: Buffer, filename: string, mimeType: string, source: EvidenceSource, options?: EvidenceProcessingOptions): Promise<ProcessedEvidence>;
    importFromURL(url: string, options?: EvidenceProcessingOptions): Promise<ProcessedEvidence>;
    listEvidence(params: EvidenceListDto): Promise<{
        items: ProcessedEvidence[];
        total: number;
        page: number;
        limit: number;
    }>;
    getEvidence(id: string): Promise<ProcessedEvidence>;
    reprocessEvidence(id: string, options: EvidenceProcessingOptions): Promise<ProcessedEvidence>;
    getStatistics(): Promise<EvidenceStatsDto>;
    deleteEvidence(id: string): Promise<void>;
    private saveEvidence;
    private saveFailedEvidence;
    private mapPrismaToEvidence;
    private extractFilenameFromURL;
    private getExtensionFromMimeType;
    private generateId;
}
