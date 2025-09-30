import { Test, TestingModule } from '@nestjs/testing';
import { ExtendedPdfService } from './extended-pdf.service';
import { ExtendedApplicationService } from '../../extended-application/extended-application.service';
import { ApplicationsService } from '../../../applications/applications.service';
import { NotFoundException } from '@nestjs/common';
import { KpiCategory, ChartType, TaskType, Priority } from '../../extended-application/dto';

// Mock puppeteer
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn(),
      pdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
      close: jest.fn(),
    }),
    close: jest.fn(),
  }),
}));

// Mock handlebars
jest.mock('handlebars', () => ({
  compile: jest.fn().mockReturnValue(() => 'compiled-html-template'),
  registerHelper: jest.fn(),
}));

// Mock Chart.js
jest.mock('chart.js/auto', () => ({
  default: jest.fn().mockImplementation(() => ({
    toBase64Image: jest.fn().mockReturnValue('data:image/png;base64,mock-chart'),
    destroy: jest.fn(),
  })),
}));

describe('ExtendedPdfService', () => {
  let service: ExtendedPdfService;
  let extendedApplicationService: ExtendedApplicationService;
  let applicationsService: ApplicationsService;

  const mockExtendedApplicationService = {
    getAllExtendedData: jest.fn(),
    getPurposeBackground: jest.fn(),
    getDetailedPlans: jest.fn(),
    getKpiTargets: jest.fn(),
    getGanttTasks: jest.fn(),
    getOrganizationStructure: jest.fn(),
    getRiskAssessments: jest.fn(),
    getSupplementaryMaterials: jest.fn(),
  };

  const mockApplicationsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExtendedPdfService,
        {
          provide: ExtendedApplicationService,
          useValue: mockExtendedApplicationService,
        },
        {
          provide: ApplicationsService,
          useValue: mockApplicationsService,
        },
      ],
    }).compile();

    service = module.get<ExtendedPdfService>(ExtendedPdfService);
    extendedApplicationService = module.get<ExtendedApplicationService>(ExtendedApplicationService);
    applicationsService = module.get<ApplicationsService>(ApplicationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateExtendedApplicationPdf', () => {
    const mockApplicationData = {
      id: 'app-123',
      businessName: 'Test Corporation',
      applicantName: 'John Doe',
      contactEmail: 'john@test.com',
      contactPhone: '03-1234-5678',
      businessScale: '中小企業',
      industry: 'IT',
      foundedYear: 2020,
      employees: 50,
      createdAt: new Date(),
    };

    const mockPurposeBackground = {
      id: 'pb-123',
      applicationId: 'app-123',
      currentIssues: [
        { category: 'efficiency', description: 'Manual processes', impact: 'High' }
      ],
      painPoints: 'Time consuming tasks',
      solution: 'Process automation',
      approach: 'Gradual implementation',
    };

    const mockDetailedPlans = [
      {
        id: 'dp-123',
        applicationId: 'app-123',
        what: 'Implement CRM system',
        why: 'Improve customer management',
        who: 'IT team',
        where: 'Head office',
        when: '2024 Q1',
        how: 'Agile development',
        priority: Priority.HIGH,
        category: 'Technology',
        expectedResult: 'Increased efficiency',
        orderIndex: 0,
      }
    ];

    const mockKpiTargets = [
      {
        id: 'kpi-123',
        applicationId: 'app-123',
        category: KpiCategory.SALES,
        metric: 'Monthly Revenue',
        unit: 'JPY',
        currentValue: 1000000,
        year1Target: 1200000,
        year2Target: 1500000,
        year3Target: 2000000,
        chartType: ChartType.LINE,
        displayOrder: 0,
        growthRateYear1: 20,
        growthRateYear2: 25,
        growthRateYear3: 33.3,
      }
    ];

    const mockGanttTasks = [
      {
        id: 'task-123',
        applicationId: 'app-123',
        taskName: 'System Development',
        taskType: TaskType.TASK,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        duration: 90,
        progress: 0,
        assignee: 'Development Team',
        milestone: false,
        critical: true,
        orderIndex: 0,
        delayDays: 0,
        estimatedCompletionDate: new Date('2024-03-31'),
      }
    ];

    beforeEach(() => {
      mockApplicationsService.findOne.mockResolvedValue(mockApplicationData);
      mockExtendedApplicationService.getAllExtendedData.mockResolvedValue({
        purposeBackground: mockPurposeBackground,
        detailedPlans: mockDetailedPlans,
        kpiTargets: mockKpiTargets,
        ganttTasks: mockGanttTasks,
        organizationStructure: null,
        riskAssessments: [],
        supplementaryMaterials: [],
      });
    });

    it('should generate PDF successfully with complete data', async () => {
      const result = await service.generateExtendedApplicationPdf('app-123');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('mock-pdf-content');
      expect(mockApplicationsService.findOne).toHaveBeenCalledWith('app-123');
      expect(mockExtendedApplicationService.getAllExtendedData).toHaveBeenCalledWith('app-123');
    });

    it('should handle missing application gracefully', async () => {
      mockApplicationsService.findOne.mockResolvedValue(null);

      await expect(service.generateExtendedApplicationPdf('non-existent')).rejects.toThrow();
    });

    it('should handle missing extended data gracefully', async () => {
      mockExtendedApplicationService.getAllExtendedData.mockResolvedValue({
        purposeBackground: null,
        detailedPlans: [],
        kpiTargets: [],
        ganttTasks: [],
        organizationStructure: null,
        riskAssessments: [],
        supplementaryMaterials: [],
      });

      const result = await service.generateExtendedApplicationPdf('app-123');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('mock-pdf-content');
    });
  });

  describe('generateSummaryReport', () => {
    it('should generate summary PDF with key metrics only', async () => {
      const result = await service.generateSummaryReport('app-123');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('mock-pdf-content');
    });
  });

  // Remove generatePreviewHtml test as it's not a public method

  describe('private helper methods', () => {
    describe('generateKpiChart', () => {
      it('should generate KPI chart for line chart type', () => {
        const kpiData = [
          {
            category: KpiCategory.SALES,
            metric: 'Revenue',
            currentValue: 1000000,
            year1Target: 1200000,
            year2Target: 1500000,
            year3Target: 2000000,
            chartType: ChartType.LINE,
          }
        ];

        // Access private method for testing
        const result = (service as any).generateKpiChart(kpiData);

        expect(typeof result).toBe('string');
        expect(result).toContain('data:image/png;base64');
      });

      it('should generate KPI chart for bar chart type', () => {
        const kpiData = [
          {
            category: KpiCategory.CUSTOMERS,
            metric: 'Customer Count',
            currentValue: 100,
            year1Target: 150,
            year2Target: 200,
            year3Target: 300,
            chartType: ChartType.BAR,
          }
        ];

        const result = (service as any).generateKpiChart(kpiData);

        expect(typeof result).toBe('string');
        expect(result).toContain('data:image/png;base64');
      });
    });

    describe('generateGanttChart', () => {
      it('should generate SVG gantt chart', () => {
        const tasks = [
          {
            taskName: 'Development',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-03-31'),
            progress: 50,
            milestone: false,
            critical: true,
          }
        ];

        const result = (service as any).generateGanttChart(tasks);

        expect(typeof result).toBe('string');
        expect(result).toContain('<svg');
        expect(result).toContain('Development');
      });

      it('should handle empty task list', () => {
        const result = (service as any).generateGanttChart([]);

        expect(typeof result).toBe('string');
        expect(result).toContain('<svg');
      });
    });

    describe('generateOrganizationChart', () => {
      it('should generate organization chart SVG', () => {
        const orgStructure = {
          departments: [
            { name: 'IT', roles: ['Manager', 'Developer'] },
            { name: 'Sales', roles: ['Sales Manager', 'Sales Rep'] }
          ]
        };

        const result = (service as any).generateOrganizationChart(orgStructure);

        expect(typeof result).toBe('string');
        expect(result).toContain('<svg');
      });

      it('should handle null organization structure', () => {
        const result = (service as any).generateOrganizationChart(null);

        expect(typeof result).toBe('string');
        expect(result).toContain('<svg');
      });
    });

    describe('generateRiskMatrix', () => {
      it('should generate risk matrix SVG', () => {
        const risks = [
          {
            riskName: 'Technical Risk',
            probability: 3,
            impact: 4,
            riskLevel: 'HIGH',
          }
        ];

        const result = (service as any).generateRiskMatrix(risks);

        expect(typeof result).toBe('string');
        expect(result).toContain('<svg');
        expect(result).toContain('Technical Risk');
      });

      it('should handle empty risk list', () => {
        const result = (service as any).generateRiskMatrix([]);

        expect(typeof result).toBe('string');
        expect(result).toContain('<svg');
      });
    });
  });

  describe('error handling', () => {
    it('should handle puppeteer errors gracefully', async () => {
      const puppeteer = require('puppeteer');
      puppeteer.launch.mockRejectedValueOnce(new Error('Puppeteer launch failed'));

      const mockApplicationData = { id: 'app-123', businessName: 'Test' };
      mockApplicationsService.findOne.mockResolvedValue(mockApplicationData);
      mockExtendedApplicationService.getPurposeBackground.mockResolvedValue(null);
      mockExtendedApplicationService.getDetailedPlans.mockResolvedValue([]);
      mockExtendedApplicationService.getKpiTargets.mockResolvedValue([]);
      mockExtendedApplicationService.getGanttTasks.mockResolvedValue([]);
      mockExtendedApplicationService.getOrganizationStructure.mockResolvedValue(null);
      mockExtendedApplicationService.getRiskAssessments.mockResolvedValue([]);
      mockExtendedApplicationService.getSupplementaryMaterials.mockResolvedValue([]);

      await expect(service.generateExtendedApplicationPdf('app-123')).rejects.toThrow(
        'Puppeteer launch failed'
      );
    });

    it('should handle template compilation errors', async () => {
      const handlebars = require('handlebars');
      handlebars.compile.mockImplementationOnce(() => {
        throw new Error('Template compilation failed');
      });

      await expect(service.generateExtendedApplicationPdf('app-123')).rejects.toThrow();
    });
  });
});