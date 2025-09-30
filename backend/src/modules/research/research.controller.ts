import { Controller, Get, Post, Body, Param, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ResearchService } from './research.service';

@Controller('research')
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Post('fetch')
  async fetch(@Body() fetchDto: any) {
    return this.researchService.fetchData(fetchDto);
  }

  @Post('ingest')
  async ingest(@Body() ingestDto: any) {
    return this.researchService.ingestData(ingestDto);
  }

  @Post('embedding')
  async createEmbedding(@Body() embeddingDto: any) {
    return this.researchService.createEmbedding(embeddingDto);
  }

  @Get(':id')
  async getResearch(@Param('id') id: string) {
    return this.researchService.findOne(id);
  }

  @Get()
  async listResearch(@Query() query: any) {
    return this.researchService.findAll(query);
  }

  @Post('summarize')
  async summarize(@Body() body: any) {
    return this.researchService.summarize(body);
  }

  @Post('csv')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/csv',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title: string; xLabel?: string; yLabel?: string },
  ) {
    return this.researchService.processCsv(file, body);
  }

  /**
   * e-Stat統計データ取得
   *
   * POST /research/estat
   * Body: { statsDataId: string, title?: string }
   */
  @Post('estat')
  async fetchEStat(@Body() body: { statsDataId: string; title?: string; indicators?: string[] }) {
    return this.researchService.fetchEStatData(body);
  }

  /**
   * e-Stat統計表検索
   *
   * GET /research/estat/search?searchWord=EC&surveyYears=2023
   */
  @Get('estat/search')
  async searchEStat(@Query('searchWord') searchWord: string, @Query('surveyYears') surveyYears?: string) {
    return this.researchService.searchEStatTables({ searchWord, surveyYears });
  }

  /**
   * RESASデータ取得
   *
   * POST /research/resas
   * Body: { prefCode: string, dataType: 'population' | 'industry', title?: string }
   */
  @Post('resas')
  async fetchResas(
    @Body() body: { prefCode: string; dataType: 'population' | 'industry'; title?: string },
  ) {
    return this.researchService.fetchResasData(body);
  }

  /**
   * RESAS都道府県一覧取得
   *
   * GET /research/resas/prefectures
   */
  @Get('resas/prefectures')
  async getResasPrefectures() {
    return this.researchService.getResasPrefectures();
  }
}
