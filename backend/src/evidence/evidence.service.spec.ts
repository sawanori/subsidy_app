import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EvidenceService } from './evidence.service';
import { PrismaService } from '../prisma/prisma.service';
import { FileProcessorService } from './services/file-processor.service';
import { SecurityService } from './services/security.service';
import { EvidenceSource, ProcessingStatus } from './interfaces/evidence.interface';

describe('EvidenceService', () => {
  let service: EvidenceService;
  let prismaService: jest.Mocked<PrismaService>;
  let fileProcessor: jest.Mocked<FileProcessorService>;
  let securityService: jest.Mocked<SecurityService>;

  const mockEvidence = {
    id: 'evidence_test_123',
    type: 'PDF',
    source: EvidenceSource.UPLOAD,
    originalFilename: 'test.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    content: {
      text: 'Test extracted content',
      tables: [],
      images: []
    },
    metadata: {
      processingTime: 1000,
      extractedAt: new Date(),
      language: 'ja'
    },
    status: ProcessingStatus.COMPLETED,
    createdAt: new Date(),
    processedAt: new Date()
  };

  beforeEach(async () => {
    const mockPrismaService = {
      evidence: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
        aggregate: jest.fn(),
        delete: jest.fn()
      }
    };

    const mockFileProcessor = {
      processFile: jest.fn()
    };

    const mockSecurityService = {
      scanFile: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvidenceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService
        },
        {
          provide: FileProcessorService,
          useValue: mockFileProcessor
        },
        {
          provide: SecurityService,
          useValue: mockSecurityService
        }
      ],
    }).compile();

    service = module.get<EvidenceService>(EvidenceService);
    prismaService = module.get(PrismaService);
    fileProcessor = module.get(FileProcessorService);
    securityService = module.get(SecurityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processFile', () => {
    it('should process file successfully', async () => {
      const buffer = Buffer.from('test content');
      const filename = 'test.pdf';
      const mimeType = 'application/pdf';

      fileProcessor.processFile.mockResolvedValue(mockEvidence as any);
      prismaService.evidence.create.mockResolvedValue(mockEvidence as any);

      const result = await service.processFile(
        buffer,
        filename,
        mimeType,
        EvidenceSource.UPLOAD
      );

      expect(result).toBeDefined();
      expect(result.type).toBe('PDF');
      expect(fileProcessor.processFile).toHaveBeenCalledWith(
        buffer,
        filename,
        mimeType,
        EvidenceSource.UPLOAD,
        {}
      );
      expect(prismaService.evidence.create).toHaveBeenCalled();
    });

    it('should handle processing errors', async () => {
      const buffer = Buffer.from('test content');
      const filename = 'test.pdf';
      const mimeType = 'application/pdf';

      fileProcessor.processFile.mockRejectedValue(new Error('Processing failed'));
      prismaService.evidence.create.mockResolvedValue({} as any);

      await expect(
        service.processFile(buffer, filename, mimeType, EvidenceSource.UPLOAD)
      ).rejects.toThrow('Processing failed');

      // Should still save failed record
      expect(prismaService.evidence.create).toHaveBeenCalled();
    });
  });

  describe('importFromURL', () => {
    it('should import from valid URL', async () => {
      // Mock fetch globally
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          headers: new Map([['content-type', 'application/pdf']]),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
        })
      ) as jest.Mock;

      securityService.scanFile.mockResolvedValue({
        isSafe: true,
        fileSignatureValid: true,
        scanCompletedAt: new Date(),
        scanEngine: 'test'
      });

      fileProcessor.processFile.mockResolvedValue({
        ...mockEvidence,
        source: EvidenceSource.URL_FETCH
      } as any);

      prismaService.evidence.create.mockResolvedValue({} as any);

      const result = await service.importFromURL('https://example.com/test.pdf');

      expect(result).toBeDefined();
      expect(result.source).toBe(EvidenceSource.URL_FETCH);
      expect(securityService.scanFile).toHaveBeenCalled();
      expect(fileProcessor.processFile).toHaveBeenCalled();
    });

    it('should reject invalid URLs', async () => {
      await expect(
        service.importFromURL('ftp://invalid.com/file.pdf')
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle HTTP errors', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        })
      ) as jest.Mock;

      await expect(
        service.importFromURL('https://example.com/notfound.pdf')
      ).rejects.toThrow('HTTP 404: Not Found');
    });

    it('should handle security scan failures', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          headers: new Map([['content-type', 'application/pdf']]),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
        })
      ) as jest.Mock;

      securityService.scanFile.mockResolvedValue({
        isSafe: false,
        fileSignatureValid: false,
        scanCompletedAt: new Date(),
        scanEngine: 'test',
        suspiciousPatterns: ['malware detected']
      });

      await expect(
        service.importFromURL('https://example.com/malicious.pdf')
      ).rejects.toThrow('URL content failed security scan');
    });
  });

  describe('listEvidence', () => {
    it('should return paginated evidence list', async () => {
      const mockList = [mockEvidence];
      prismaService.evidence.findMany.mockResolvedValue(mockList as any);
      prismaService.evidence.count.mockResolvedValue(1);

      const result = await service.listEvidence({
        page: 1,
        limit: 20
      });

      expect(result).toEqual({
        items: mockList,
        total: 1,
        page: 1,
        limit: 20
      });
    });

    it('should support filtering by type and source', async () => {
      prismaService.evidence.findMany.mockResolvedValue([]);
      prismaService.evidence.count.mockResolvedValue(0);

      await service.listEvidence({
        type: 'PDF' as any,
        source: EvidenceSource.UPLOAD,
        page: 1,
        limit: 10
      });

      expect(prismaService.evidence.findMany).toHaveBeenCalledWith({
        where: {
          type: 'PDF',
          source: EvidenceSource.UPLOAD
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should support search functionality', async () => {
      prismaService.evidence.findMany.mockResolvedValue([]);
      prismaService.evidence.count.mockResolvedValue(0);

      await service.listEvidence({
        search: 'test query',
        page: 1,
        limit: 10
      });

      expect(prismaService.evidence.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { originalFilename: { contains: 'test query', mode: 'insensitive' } },
            { content: { path: ['text'], string_contains: 'test query' } }
          ]
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('getEvidence', () => {
    it('should return evidence by ID', async () => {
      prismaService.evidence.findUnique.mockResolvedValue(mockEvidence as any);

      const result = await service.getEvidence('evidence_test_123');

      expect(result).toBeDefined();
      expect(result.id).toBe('evidence_test_123');
      expect(prismaService.evidence.findUnique).toHaveBeenCalledWith({
        where: { id: 'evidence_test_123' }
      });
    });

    it('should throw NotFoundException for non-existent evidence', async () => {
      prismaService.evidence.findUnique.mockResolvedValue(null);

      await expect(
        service.getEvidence('non_existent_id')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStatistics', () => {
    it('should return evidence statistics', async () => {
      prismaService.evidence.count.mockResolvedValue(10);
      prismaService.evidence.groupBy.mockImplementation(({ by }) => {
        if (by.includes('type')) {
          return Promise.resolve([
            { type: 'PDF', _count: 5 },
            { type: 'IMAGE', _count: 3 }
          ]);
        }
        if (by.includes('source')) {
          return Promise.resolve([
            { source: 'UPLOAD', _count: 7 },
            { source: 'URL_FETCH', _count: 3 }
          ]);
        }
        return Promise.resolve([]);
      });
      prismaService.evidence.aggregate.mockImplementation(({ _sum, _avg }) => {
        if (_sum) {
          return Promise.resolve({ _sum: { size: 1024000 } });
        }
        if (_avg) {
          return Promise.resolve({ _avg: { processingTime: 2500 } });
        }
        return Promise.resolve({});
      });

      const result = await service.getStatistics();

      expect(result).toEqual({
        total: 10,
        byType: { PDF: 5, IMAGE: 3 },
        bySource: { UPLOAD: 7, URL_FETCH: 3 },
        totalSize: 1024000,
        avgProcessingTime: 2500,
        successRate: 1.0 // 10/10
      });
    });
  });

  describe('deleteEvidence', () => {
    it('should delete evidence by ID', async () => {
      prismaService.evidence.findUnique.mockResolvedValue(mockEvidence as any);
      prismaService.evidence.delete.mockResolvedValue(mockEvidence as any);

      await service.deleteEvidence('evidence_test_123');

      expect(prismaService.evidence.delete).toHaveBeenCalledWith({
        where: { id: 'evidence_test_123' }
      });
    });

    it('should throw error for non-existent evidence', async () => {
      prismaService.evidence.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteEvidence('non_existent_id')
      ).rejects.toThrow(NotFoundException);
    });
  });
});