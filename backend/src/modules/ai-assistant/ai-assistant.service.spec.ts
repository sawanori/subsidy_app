import { Test, TestingModule } from '@nestjs/testing';
import { AIAssistantService } from './services/ai-assistant.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { 
  AnalyzeIssuesDto, 
  SuggestSolutionsDto, 
  ElaboratePlanDto,
  SuggestKPIsDto,
  AnalyzeRisksDto,
  AnalyzeMarketDto,
  GenerateGanttDto,
  GenerateSummaryDto,
  AIAssistantRequestDto 
} from './dto/ai-assistant.dto';
import { PromptCategory } from './prompts/templates';

// Mock OpenAI module
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  })),
}));

describe('AIAssistantService', () => {
  let service: AIAssistantService;
  let config: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIAssistantService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AIAssistantService>(AIAssistantService);
    config = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeIssues', () => {
    it('should analyze business issues and return structured response', async () => {
      const dto: AnalyzeIssuesDto = {
        businessDescription: 'Manufacturing company with manual processes',
        painPoints: 'Time consuming manual tasks',
      };

      mockConfigService.get.mockReturnValue(undefined); // No API key - mock mode

      const result = await service.analyzeIssues(dto);

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('category');
      expect(result.category).toBe(PromptCategory.ANALYSIS);
      expect(result.type).toBe('json');
    });

    it('should handle API errors gracefully', async () => {
      const dto: AnalyzeIssuesDto = {
        businessDescription: 'Test business',
        painPoints: 'Test pain points',
      };

      mockConfigService.get.mockReturnValue('test-api-key');

      const result = await service.analyzeIssues(dto);
      expect(result).toHaveProperty('content');
    });
  });

  describe('suggestSolutions', () => {
    it('should suggest solutions based on identified issues', async () => {
      const dto: SuggestSolutionsDto = {
        currentIssues: [
          { category: 'efficiency', description: 'Manual data entry', impact: 'High' }
        ],
        businessType: 'Manufacturing',
        maxAmount: 5000000,
        implementationPeriod: '6 months',
      };

      mockConfigService.get.mockReturnValue(undefined);

      const result = await service.suggestSolutions(dto);

      expect(result).toHaveProperty('content');
      expect(result.category).toBe(PromptCategory.SUGGESTION);
    });
  });

  describe('elaboratePlan', () => {
    it('should elaborate 5W1H plan structure', async () => {
      const dto: ElaboratePlanDto = {
        planSummary: 'Implement new system',
        targetIssue: 'Manual process inefficiency',
      };

      mockConfigService.get.mockReturnValue(undefined);

      const result = await service.elaboratePlan(dto);

      expect(result).toHaveProperty('content');
      expect(result.category).toBe(PromptCategory.ELABORATION);
    });
  });

  describe('suggestKPIs', () => {
    it('should suggest KPI targets based on business plan', async () => {
      const dto: SuggestKPIsDto = {
        businessPlan: 'Digital transformation project',
        expectedEffects: 'Increase sales, Improve efficiency',
      };

      mockConfigService.get.mockReturnValue(undefined);

      const result = await service.suggestKPIs(dto);

      expect(result).toHaveProperty('content');
      expect(result.category).toBe(PromptCategory.SUGGESTION);
    });
  });

  describe('generateGantt', () => {
    it('should generate gantt chart data', async () => {
      const dto: GenerateGanttDto = {
        businessPlan: 'System implementation project',
        implementationPeriod: '6 months',
        mainActivities: ['Requirements analysis', 'Development', 'Testing'],
      };

      mockConfigService.get.mockReturnValue(undefined);

      const result = await service.generateGantt(dto);

      expect(result).toHaveProperty('content');
      expect(result.category).toBe(PromptCategory.PLANNING);
    });
  });

  describe('analyzeRisks', () => {
    it('should analyze project risks', async () => {
      const dto: AnalyzeRisksDto = {
        businessPlan: 'Digital transformation project',
        implementationDetails: 'Company-wide system implementation',
      };

      mockConfigService.get.mockReturnValue(undefined);

      const result = await service.analyzeRisks(dto);

      expect(result).toHaveProperty('content');
      expect(result.category).toBe(PromptCategory.RISK);
    });
  });

  describe('analyzeMarket', () => {
    it('should analyze market conditions', async () => {
      const dto: AnalyzeMarketDto = {
        businessDescription: 'E-commerce platform',
        targetCustomer: 'Small businesses',
        region: 'Tokyo',
      };

      mockConfigService.get.mockReturnValue(undefined);

      const result = await service.analyzeMarket(dto);

      expect(result).toHaveProperty('content');
      expect(result.category).toBe(PromptCategory.MARKET);
    });
  });

  describe('generateSummary', () => {
    it('should generate application summary', async () => {
      const dto: GenerateSummaryDto = {
        companyInfo: { name: 'Test Corp', industry: 'IT' },
        currentIssues: [{ category: 'efficiency', description: 'Manual work' }],
        solutions: 'System automation',
        expectedEffects: 'Increased productivity',
        requestedAmount: 5000000,
      };

      mockConfigService.get.mockReturnValue(undefined);

      const result = await service.generateSummary(dto);

      expect(result).toHaveProperty('content');
      expect(result.category).toBe(PromptCategory.SUMMARY);
    });
  });

  describe('processRequest', () => {
    it('should process custom AI request', async () => {
      const dto: AIAssistantRequestDto = {
        templateName: 'ANALYZE_ISSUES',
        variables: {
          businessDescription: 'Test business',
          painPoints: 'Manual processes',
        },
        category: PromptCategory.ANALYSIS,
      };

      mockConfigService.get.mockReturnValue(undefined);

      const result = await service.processRequest(dto);

      expect(result).toHaveProperty('content');
      expect(result.category).toBe(PromptCategory.ANALYSIS);
    });

    it('should throw BadRequestException for invalid template', async () => {
      const dto: AIAssistantRequestDto = {
        templateName: 'INVALID_TEMPLATE',
        variables: {},
        category: PromptCategory.ANALYSIS,
      };

      await expect(service.processRequest(dto)).rejects.toThrow(BadRequestException);
    });
  });
});