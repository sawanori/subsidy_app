import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  HttpStatus,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ExtendedPdfService } from './services/extended-pdf.service';

@ApiTags('PDF Generator')
@Controller('pdf-generator')
export class PdfGeneratorController {
  constructor(private readonly pdfService: ExtendedPdfService) {}

  @Get('draft/:draftId')
  @ApiOperation({ summary: '草案からPDF生成' })
  @ApiParam({ name: 'draftId', description: '草案ID' })
  @ApiResponse({ status: 200, description: 'PDF生成成功' })
  @ApiResponse({ status: 404, description: '草案が見つかりません' })
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="application.pdf"')
  async generateApplicationPdf(
    @Param('draftId') draftId: string,
    @Res() res: Response,
  ) {
    try {
      const pdfBuffer = await this.pdfService.generateExtendedApplicationPdf(draftId);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="application_${draftId}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      res.send(pdfBuffer);
    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'PDF生成に失敗しました',
        error: error.message,
      });
    }
  }

  @Get('draft/:draftId/preview')
  @ApiOperation({ summary: '草案PDFプレビュー' })
  @ApiParam({ name: 'draftId', description: '草案ID' })
  @ApiResponse({ status: 200, description: 'PDFプレビュー成功' })
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline')
  async previewApplicationPdf(
    @Param('draftId') draftId: string,
    @Res() res: Response,
  ) {
    try {
      const pdfBuffer = await this.pdfService.generateExtendedApplicationPdf(draftId);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Content-Length': pdfBuffer.length,
      });

      res.send(pdfBuffer);
    } catch (error) {
      console.error('PDF preview error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'PDFプレビューに失敗しました',
        error: error.message,
      });
    }
  }

  @Get('draft/:draftId/summary')
  @ApiOperation({ summary: 'サマリーレポートPDF生成' })
  @ApiParam({ name: 'draftId', description: '草案ID' })
  @ApiResponse({ status: 200, description: 'サマリーPDF生成成功' })
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="summary.pdf"')
  async generateSummaryPdf(
    @Param('draftId') draftId: string,
    @Res() res: Response,
  ) {
    try {
      const pdfBuffer = await this.pdfService.generateSummaryReport(draftId);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="summary_${draftId}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      res.send(pdfBuffer);
    } catch (error) {
      console.error('Summary PDF generation error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'サマリーPDF生成に失敗しました',
        error: error.message,
      });
    }
  }

  @Post('batch')
  @ApiOperation({ summary: '複数のPDFを一括生成' })
  @ApiResponse({ status: 200, description: 'バッチPDF生成成功' })
  async generateBatchPdfs(
    @Res() res: Response,
  ) {
    // TODO: 複数PDF生成とZIP化の実装
    res.status(HttpStatus.NOT_IMPLEMENTED).json({
      message: 'バッチPDF生成は現在実装中です',
    });
  }
}
