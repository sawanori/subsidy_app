import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { OpenAIProvider } from './llm/openai.provider';
import { PromptBuilderService } from './prompts/prompt-builder.service';
import { Draft } from '@generated/prisma';

/**
 * DraftService - 草案生成・管理サービス
 *
 * RAG (Retrieval-Augmented Generation) パターンで実装
 * SchemeTemplateを参照し、制度要件に適合した草案を生成
 */
@Injectable()
export class DraftService {
  private readonly logger = new Logger(DraftService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmProvider: OpenAIProvider,
    private readonly promptBuilder: PromptBuilderService,
  ) {}

  /**
   * 草案生成（RAG実装）
   *
   * 1. SchemeTemplateをDBから取得（Retrieval）
   * 2. ProjectデータとテンプレートをプロンプトでCombine
   * 3. LLMで草案生成（Generation）
   * 4. 版管理でDraft保存
   */
  async createDraft(params: {
    projectId: string;
    schemeId: string;
  }): Promise<Draft> {
    const { projectId, schemeId } = params;

    this.logger.log(
      `Starting draft generation for project ${projectId}, scheme ${schemeId}`,
    );

    // 1. Retrieval: Fetch SchemeTemplate requirements
    const template = await this.prisma.schemeTemplate.findUnique({
      where: { schemeId },
    });

    if (!template) {
      throw new NotFoundException(
        `SchemeTemplate not found for schemeId: ${schemeId}`,
      );
    }

    // 2. Retrieval: Fetch Project data
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        drafts: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project not found: ${projectId}`);
    }

    // Calculate next version
    const nextVersion =
      project.drafts.length > 0 ? project.drafts[0].version + 1 : 1;

    // 3. RAG Prompt Construction (using optimized PromptBuilder)
    const prompt = this.promptBuilder.buildRAGPrompt(template, project);

    // Log prompt quality for debugging
    const quality = this.promptBuilder.calculatePromptQuality(prompt);
    this.logger.debug(
      `Prompt quality score: ${quality.score}/100 ${quality.feedback.length > 0 ? `(${quality.feedback.join(', ')})` : ''}`,
    );

    // 4. LLM Generation
    const startTime = Date.now();
    const response = await this.llmProvider.generate(prompt, {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 4000,
    });

    const generationDuration = Date.now() - startTime;

    this.logger.log(
      `LLM generation completed in ${generationDuration}ms, ${response.tokensUsed.total} tokens, cost: ¥${response.estimatedCost}`,
    );

    // 5. Parse response and structure sections
    const sections = this.parseGeneratedSections(response.text, template);

    // 6. Save Draft with version management
    const draft = await this.prisma.draft.create({
      data: {
        projectId,
        version: nextVersion,
        sections,
        references: [],
        metadata: {
          model: response.model,
          tokensUsed: response.tokensUsed,
          estimatedCost: response.estimatedCost,
          duration: generationDuration,
          timestamp: new Date().toISOString(),
        },
      },
    });

    this.logger.log(`Draft v${nextVersion} created successfully: ${draft.id}`);

    return draft;
  }

  /**
   * LLM生成テキストからセクションをパース
   */
  private parseGeneratedSections(text: string, template: any): any {
    try {
      // Extract JSON from markdown code block if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;

      const parsed = JSON.parse(jsonText);

      // Validate against template requirements
      this.validateSections(parsed, template.requirements);

      return parsed;
    } catch (error) {
      this.logger.error(`Failed to parse generated sections: ${error.message}`);
      // Return empty structure as fallback
      return {
        background: text.substring(0, 2000),
        problemSolution: '',
        plan5w1h: {},
        kpi: [],
        roadmap: [],
        budget: [],
        team: [],
        risks: [],
        differentiation: '',
      };
    }
  }

  /**
   * セクションバリデーション
   */
  private validateSections(sections: any, requirements: any): void {
    const sectionReqs = requirements.sections;

    for (const req of sectionReqs) {
      if (!req.required) continue;

      const section = sections[req.id];

      if (!section) {
        this.logger.warn(`Required section missing: ${req.id}`);
        continue;
      }

      // Check character count for text sections
      if (req.minChars && typeof section === 'string') {
        if (section.length < req.minChars) {
          this.logger.warn(
            `Section ${req.id} is too short: ${section.length} < ${req.minChars}`,
          );
        }
        if (req.maxChars && section.length > req.maxChars) {
          this.logger.warn(
            `Section ${req.id} is too long: ${section.length} > ${req.maxChars}`,
          );
        }
      }

      // Check item count for array sections
      if (req.minItems && Array.isArray(section)) {
        if (section.length < req.minItems) {
          this.logger.warn(
            `Section ${req.id} has too few items: ${section.length} < ${req.minItems}`,
          );
        }
      }
    }
  }

  /**
   * 草案取得
   */
  async getDraft(id: string): Promise<Draft | null> {
    return this.prisma.draft.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });
  }

  /**
   * プロジェクトの全草案取得
   */
  async getDraftsByProject(projectId: string): Promise<Draft[]> {
    return this.prisma.draft.findMany({
      where: { projectId },
      orderBy: { version: 'desc' },
    });
  }

  /**
   * 草案削除
   */
  async deleteDraft(id: string): Promise<void> {
    await this.prisma.draft.delete({
      where: { id },
    });
  }
}

