import { Body, Controller, Post } from '@nestjs/common';
import { ValidateService } from './validate.service';

@Controller('validate')
export class ValidateController {
  constructor(private readonly validateService: ValidateService) {}

  @Post('plan')
  async validatePlan(@Body() body: any) {
    return this.validateService.validatePlan(body);
  }

  /**
   * Phase 4: 草案検証エンドポイント
   * POST /api/validate/draft
   */
  @Post('draft')
  async validateDraft(@Body() body: { draftId: string; schemeId: string }) {
    return this.validateService.validateDraft(body);
  }
}

