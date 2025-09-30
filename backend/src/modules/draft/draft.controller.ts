import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DraftService } from './draft.service';

/**
 * DraftController - 草案生成・管理API
 *
 * RAGベースの草案生成と版管理機能を提供
 */
@Controller('draft')
export class DraftController {
  constructor(private readonly draftService: DraftService) {}

  /**
   * POST /api/draft
   *
   * 草案生成（RAG実装）
   * SchemeTemplateとProjectデータから申請書草案を生成
   *
   * @param body.projectId - プロジェクトID
   * @param body.schemeId - 制度ID (例: jizokuka-2025-v1)
   * @returns Draft - 生成された草案（版管理済み）
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDraft(
    @Body() body: { projectId: string; schemeId: string },
  ): Promise<any> {
    return this.draftService.createDraft(body);
  }

  /**
   * GET /api/draft/:id
   *
   * 草案取得
   *
   * @param id - Draft ID
   * @returns Draft - 草案詳細
   */
  @Get(':id')
  async getDraft(@Param('id') id: string): Promise<any> {
    return this.draftService.getDraft(id);
  }

  /**
   * GET /api/draft/project/:projectId
   *
   * プロジェクトの全草案取得（版管理一覧）
   *
   * @param projectId - プロジェクトID
   * @returns Draft[] - 草案リスト（版番号降順）
   */
  @Get('project/:projectId')
  async getDraftsByProject(@Param('projectId') projectId: string): Promise<any> {
    return this.draftService.getDraftsByProject(projectId);
  }

  /**
   * DELETE /api/draft/:id
   *
   * 草案削除
   *
   * @param id - Draft ID
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDraft(@Param('id') id: string): Promise<void> {
    return this.draftService.deleteDraft(id);
  }
}

