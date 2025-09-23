import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Priority, KpiCategory, ChartType, TaskType } from '../src/modules/extended-application/dto';

describe('Extended Application Features (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testApplicationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));

    await app.init();

    // Create a test application
    const testApplication = await prisma.application.create({
      data: {
        businessName: 'Test Corporation E2E',
        applicant: {
          create: {
            companyName: 'Test Corporation E2E',
            representativeName: 'Test User',
            email: 'test@example.com',
            phoneNumber: '03-1234-5678',
            postalCode: '100-0001',
            address: 'Tokyo',
            employeeCount: 50,
            capital: 10000000,
          },
        },
        plan: {
          create: {
            projectTitle: 'Test Project E2E',
            summary: 'Test project for E2E testing',
            objectives: ['Objective 1', 'Objective 2'],
            targetMarket: 'B2B',
            competitiveAdvantage: 'Innovation',
            riskAssessment: 'Low risk',
          },
        },
        budget: {
          create: {
            totalAmount: 5000000,
            subsidyAmount: 2500000,
            selfFunding: 2500000,
            subsidyRate: 50,
          },
        },
      },
    });
    
    testApplicationId = testApplication.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.ganttTask.deleteMany({
      where: { applicationId: testApplicationId },
    });
    await prisma.kpiTarget.deleteMany({
      where: { applicationId: testApplicationId },
    });
    await prisma.detailedPlan.deleteMany({
      where: { applicationId: testApplicationId },
    });
    await prisma.purposeBackground.deleteMany({
      where: { applicationId: testApplicationId },
    });
    await prisma.budget.deleteMany({
      where: { applicationId: testApplicationId },
    });
    await prisma.plan.deleteMany({
      where: { applicationId: testApplicationId },
    });
    await prisma.applicant.deleteMany({
      where: { applicationId: testApplicationId },
    });
    await prisma.application.deleteMany({
      where: { id: testApplicationId },
    });
    
    await app.close();
  });

  describe('/api/extended-application/purpose-background', () => {
    it('POST should create purpose background', () => {
      const dto = {
        applicationId: testApplicationId,
        currentIssues: [
          { category: 'efficiency', description: 'Manual processes', impact: 'High' },
          { category: 'quality', description: 'Data inconsistency', impact: 'Medium' }
        ],
        painPoints: 'Time consuming manual data entry',
        rootCause: 'Lack of automation systems',
        solution: 'Implement automated workflow system',
        approach: 'Phased implementation approach',
        uniqueValue: 'AI-powered data processing',
        logicTree: {
          problem: 'Inefficient processes',
          causes: ['Manual work', 'No automation'],
          solutions: ['Workflow system', 'AI integration']
        }
      };

      return request(app.getHttpServer())
        .post('/api/extended-application/purpose-background')
        .send(dto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data).toHaveProperty('applicationId', testApplicationId);
          expect(res.body.data.painPoints).toBe(dto.painPoints);
        });
    });

    it('GET should retrieve purpose background', () => {
      return request(app.getHttpServer())
        .get(`/api/extended-application/purpose-background/${testApplicationId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body.data).toHaveProperty('applicationId', testApplicationId);
          expect(res.body.data).toHaveProperty('currentIssues');
          expect(Array.isArray(res.body.data.currentIssues)).toBe(true);
        });
    });
  });

  describe('/api/extended-application/detailed-plans', () => {
    it('POST should create detailed plans', () => {
      const dto = {
        plans: [
          {
            applicationId: testApplicationId,
            what: 'Implement CRM system',
            why: 'Improve customer management',
            who: 'IT development team',
            where: 'Head office',
            when: '2024 Q1-Q2',
            how: 'Agile development methodology',
            priority: Priority.HIGH,
            category: 'Technology',
            expectedResult: '50% improvement in customer response time',
            orderIndex: 0,
          },
          {
            applicationId: testApplicationId,
            what: 'Staff training program',
            why: 'Enhance skills for new system',
            who: 'All staff members',
            where: 'Training room',
            when: '2024 Q2',
            how: 'Hands-on workshops',
            priority: Priority.MEDIUM,
            category: 'Education',
            expectedResult: '90% staff proficiency',
            orderIndex: 1,
          }
        ]
      };

      return request(app.getHttpServer())
        .post('/api/extended-application/detailed-plans')
        .send(dto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body.data).toHaveProperty('count', 2);
        });
    });

    it('GET should retrieve detailed plans', () => {
      return request(app.getHttpServer())
        .get(`/api/extended-application/detailed-plans/${testApplicationId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBe(2);
          expect(res.body.data[0]).toHaveProperty('what');
          expect(res.body.data[0]).toHaveProperty('priority');
        });
    });
  });

  describe('/api/extended-application/kpi-targets', () => {
    it('POST should create KPI targets', () => {
      const dto = {
        targets: [
          {
            applicationId: testApplicationId,
            category: KpiCategory.SALES,
            metric: 'Monthly Revenue',
            unit: 'JPY',
            currentValue: 1000000,
            year1Target: 1200000,
            year2Target: 1500000,
            year3Target: 2000000,
            chartType: ChartType.LINE,
            displayOrder: 0,
          },
          {
            applicationId: testApplicationId,
            category: KpiCategory.CUSTOMERS,
            metric: 'Customer Count',
            unit: 'count',
            currentValue: 100,
            year1Target: 150,
            year2Target: 200,
            year3Target: 300,
            chartType: ChartType.BAR,
            displayOrder: 1,
          }
        ]
      };

      return request(app.getHttpServer())
        .post('/api/extended-application/kpi-targets')
        .send(dto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body.data).toHaveProperty('count', 2);
        });
    });

    it('GET should retrieve KPI targets with growth rates', () => {
      return request(app.getHttpServer())
        .get(`/api/extended-application/kpi-targets/${testApplicationId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBe(2);
          
          const salesKpi = res.body.data.find(kpi => kpi.category === KpiCategory.SALES);
          expect(salesKpi).toHaveProperty('growthRateYear1', 20); // (1200000-1000000)/1000000*100
          expect(salesKpi).toHaveProperty('growthRateYear2', 25); // (1500000-1200000)/1200000*100
        });
    });
  });

  describe('/api/extended-application/gantt-tasks', () => {
    it('POST should create Gantt tasks', () => {
      const dto = {
        tasks: [
          {
            applicationId: testApplicationId,
            taskName: 'Requirements Analysis',
            taskType: TaskType.TASK,
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-31'),
            duration: 30,
            progress: 100,
            assignee: 'Project Manager',
            milestone: false,
            critical: true,
            dependencies: [{ taskId: 'dep-1', type: 'FS' }],
            orderIndex: 0,
          },
          {
            applicationId: testApplicationId,
            taskName: 'System Development',
            taskType: TaskType.TASK,
            startDate: new Date('2024-02-01'),
            endDate: new Date('2024-04-30'),
            duration: 90,
            progress: 50,
            assignee: 'Development Team',
            milestone: false,
            critical: true,
            dependencies: [],
            orderIndex: 1,
          },
          {
            applicationId: testApplicationId,
            taskName: 'Go Live',
            taskType: TaskType.MILESTONE,
            startDate: new Date('2024-05-01'),
            endDate: new Date('2024-05-01'),
            duration: 1,
            progress: 0,
            assignee: 'Project Team',
            milestone: true,
            critical: false,
            dependencies: [],
            orderIndex: 2,
          }
        ]
      };

      return request(app.getHttpServer())
        .post('/api/extended-application/gantt-tasks')
        .send(dto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body.data).toHaveProperty('count', 3);
        });
    });

    it('GET should retrieve Gantt tasks with delay calculation', () => {
      return request(app.getHttpServer())
        .get(`/api/extended-application/gantt-tasks/${testApplicationId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBe(3);
          
          const task = res.body.data[0];
          expect(task).toHaveProperty('taskName');
          expect(task).toHaveProperty('delayDays');
          expect(task).toHaveProperty('estimatedCompletionDate');
          expect(task).toHaveProperty('milestone');
          expect(task).toHaveProperty('critical');
        });
    });
  });

  describe('/api/ai-assistant', () => {
    it('POST /analyze-issues should return AI analysis', () => {
      const dto = {
        businessDescription: 'Manufacturing company with manual inventory management',
        painPoints: 'Time consuming stock counting and data entry errors',
      };

      return request(app.getHttpServer())
        .post('/api/ai-assistant/analyze-issues')
        .send(dto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body.data).toHaveProperty('content');
          expect(res.body.data).toHaveProperty('type');
          expect(res.body.data).toHaveProperty('category');
        });
    });

    it('POST /suggest-solutions should return solution suggestions', () => {
      const dto = {
        currentIssues: [
          { category: 'efficiency', description: 'Manual inventory', impact: 'High' }
        ],
        businessType: 'Manufacturing',
        maxAmount: 5000000,
        implementationPeriod: '6 months',
      };

      return request(app.getHttpServer())
        .post('/api/ai-assistant/suggest-solutions')
        .send(dto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body.data).toHaveProperty('content');
          expect(res.body.data.category).toBe('suggestion');
        });
    });

    it('POST /elaborate-plan should return detailed 5W1H plan', () => {
      const dto = {
        planSummary: 'Implement inventory management system',
        targetIssue: 'Manual stock management inefficiency',
      };

      return request(app.getHttpServer())
        .post('/api/ai-assistant/elaborate-plan')
        .send(dto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body.data).toHaveProperty('content');
          expect(res.body.data.category).toBe('elaboration');
        });
    });
  });

  describe('/api/pdf-generator', () => {
    it('GET /application/:id should generate complete PDF', () => {
      return request(app.getHttpServer())
        .get(`/api/pdf-generator/application/${testApplicationId}`)
        .expect(200)
        .expect((res) => {
          expect(res.headers['content-type']).toBe('application/pdf');
          expect(res.headers['content-disposition']).toContain('attachment');
          expect(Buffer.isBuffer(res.body)).toBe(true);
        });
    });

    it('GET /application/:id/summary should generate summary PDF', () => {
      return request(app.getHttpServer())
        .get(`/api/pdf-generator/application/${testApplicationId}/summary`)
        .expect(200)
        .expect((res) => {
          expect(res.headers['content-type']).toBe('application/pdf');
          expect(res.headers['content-disposition']).toContain('attachment');
          expect(Buffer.isBuffer(res.body)).toBe(true);
        });
    });

    it('GET /application/:id/preview should return HTML preview', () => {
      return request(app.getHttpServer())
        .get(`/api/pdf-generator/application/${testApplicationId}/preview`)
        .expect(200)
        .expect((res) => {
          expect(res.headers['content-type']).toContain('text/html');
          expect(res.text).toContain('<!DOCTYPE html');
          expect(res.text).toContain('補助金申請書');
        });
    });

    it('GET /application/invalid-id should return 404', () => {
      return request(app.getHttpServer())
        .get('/api/pdf-generator/application/invalid-id')
        .expect(404);
    });
  });

  describe('Integration Flow', () => {
    it('should handle complete application workflow', async () => {
      // 1. Create new application for integration test
      const newApp = await prisma.application.create({
        data: {
          businessName: 'Integration Test Corp',
          applicant: {
            create: {
              companyName: 'Integration Test Corp',
              representativeName: 'Integration User',
              email: 'integration@test.com',
              phoneNumber: '03-1234-9999',
              postalCode: '100-0002',
              address: 'Tokyo Integration',
              employeeCount: 25,
              capital: 5000000,
            },
          },
          plan: {
            create: {
              projectTitle: 'Integration Test Project',
              summary: 'End-to-end integration test',
              objectives: ['Test integration'],
              targetMarket: 'Testing',
              competitiveAdvantage: 'E2E testing',
              riskAssessment: 'Low risk',
            },
          },
          budget: {
            create: {
              totalAmount: 2000000,
              subsidyAmount: 1000000,
              selfFunding: 1000000,
              subsidyRate: 50,
            },
          },
        },
      });

      // 2. Create purpose background
      await request(app.getHttpServer())
        .post('/api/extended-application/purpose-background')
        .send({
          applicationId: newApp.id,
          currentIssues: [{ category: 'test', description: 'Integration test', impact: 'Low' }],
          painPoints: 'Integration testing',
          solution: 'E2E test solution',
        })
        .expect(201);

      // 3. Create detailed plans
      await request(app.getHttpServer())
        .post('/api/extended-application/detailed-plans')
        .send({
          plans: [{
            applicationId: newApp.id,
            what: 'Integration test',
            why: 'Testing purpose',
            who: 'Test team',
            where: 'Test environment',
            when: 'Now',
            how: 'Automated',
            priority: Priority.LOW,
            category: 'Testing',
            expectedResult: 'Success',
            orderIndex: 0,
          }]
        })
        .expect(201);

      // 4. Generate AI suggestions
      await request(app.getHttpServer())
        .post('/api/ai-assistant/analyze-issues')
        .send({
          businessDescription: 'Integration test business',
          painPoints: 'Testing challenges',
        })
        .expect(201);

      // 5. Generate PDF
      await request(app.getHttpServer())
        .get(`/api/pdf-generator/application/${newApp.id}`)
        .expect(200);

      // Cleanup
      await prisma.detailedPlan.deleteMany({ where: { applicationId: newApp.id } });
      await prisma.purposeBackground.deleteMany({ where: { applicationId: newApp.id } });
      await prisma.budget.deleteMany({ where: { applicationId: newApp.id } });
      await prisma.plan.deleteMany({ where: { applicationId: newApp.id } });
      await prisma.applicant.deleteMany({ where: { applicationId: newApp.id } });
      await prisma.application.deleteMany({ where: { id: newApp.id } });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid application ID gracefully', () => {
      return request(app.getHttpServer())
        .post('/api/extended-application/purpose-background')
        .send({
          applicationId: 'invalid-id',
          painPoints: 'Test',
          solution: 'Test',
        })
        .expect(404);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/api/extended-application/detailed-plans')
        .send({
          plans: []
        })
        .expect(400);
    });

    it('should handle malformed JSON gracefully', () => {
      return request(app.getHttpServer())
        .post('/api/extended-application/purpose-background')
        .send('invalid-json')
        .expect(400);
    });
  });
});