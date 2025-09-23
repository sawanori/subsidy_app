import { Test, TestingModule } from '@nestjs/testing';
import { TimezoneMiddleware } from './timezone.middleware';
import { I18nService } from '../i18n/i18n.service';

describe('TimezoneMiddleware', () => {
  let middleware: TimezoneMiddleware;
  let i18nService: jest.Mocked<I18nService>;

  beforeEach(async () => {
    const mockI18nService = {
      detectLocale: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimezoneMiddleware,
        { provide: I18nService, useValue: mockI18nService },
      ],
    }).compile();

    middleware = module.get<TimezoneMiddleware>(TimezoneMiddleware);
    i18nService = module.get(I18nService);
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should set timezone and locale from headers', () => {
    const req: any = {
      headers: {
        'x-timezone': 'America/New_York',
        'accept-language': 'en-US,en;q=0.9',
      },
    };
    const res: any = {
      setHeader: jest.fn(),
    };
    const next = jest.fn();

    i18nService.detectLocale.mockReturnValue('en');

    middleware.use(req, res, next);

    expect(req.timezone).toBe('America/New_York');
    expect(req.locale).toBe('en');
    expect(req.i18n).toBe(i18nService);
    expect(res.setHeader).toHaveBeenCalledWith('x-server-timezone', 'America/New_York');
    expect(res.setHeader).toHaveBeenCalledWith('x-server-locale', 'en');
    expect(next).toHaveBeenCalled();
  });

  it('should use default timezone when not provided', () => {
    const req: any = {
      headers: {
        'accept-language': 'ja',
      },
    };
    const res: any = {
      setHeader: jest.fn(),
    };
    const next = jest.fn();

    i18nService.detectLocale.mockReturnValue('ja');

    middleware.use(req, res, next);

    expect(req.timezone).toBe('Asia/Tokyo');
    expect(req.locale).toBe('ja');
    expect(next).toHaveBeenCalled();
  });

  it('should handle missing headers gracefully', () => {
    const req: any = {
      headers: {},
    };
    const res: any = {
      setHeader: jest.fn(),
    };
    const next = jest.fn();

    i18nService.detectLocale.mockReturnValue('ja');

    middleware.use(req, res, next);

    expect(req.timezone).toBe('Asia/Tokyo');
    expect(req.locale).toBe('ja');
    expect(next).toHaveBeenCalled();
  });
});