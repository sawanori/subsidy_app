import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ApplicationStatus } from '@generated/prisma';

describe('ApplicationsController', () => {
  let controller: ApplicationsController;
  let service: ApplicationsService;

  const mockApplicationsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        {
          provide: ApplicationsService,
          useValue: mockApplicationsService,
        },
      ],
    }).compile();

    controller = module.get<ApplicationsController>(ApplicationsController);
    service = module.get<ApplicationsService>(ApplicationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an application', async () => {
      const dto: CreateApplicationDto = {
        title: 'Test Application',
        locale: 'ja',
        status: ApplicationStatus.DRAFT,
      };

      const expected = {
        id: '1',
        userId: 'user-1',
        applicantId: 'applicant-1',
        ...dto,
        submittedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        baselines: null,
      };

      mockApplicationsService.create.mockResolvedValue(expected);

      const result = await controller.create(dto);
      expect(result).toEqual(expected);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return an array of applications', async () => {
      const expected = [
        {
          id: '1',
          title: 'Test 1',
          status: ApplicationStatus.DRAFT,
        },
      ];

      mockApplicationsService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll();
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should return a single application', async () => {
      const expected = {
        id: '1',
        title: 'Test Application',
      };

      mockApplicationsService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne('1');
      expect(result).toEqual(expected);
      expect(service.findOne).toHaveBeenCalledWith('1');
    });
  });
});