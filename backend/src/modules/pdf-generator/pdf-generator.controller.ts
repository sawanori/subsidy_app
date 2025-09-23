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
@Controller('api/pdf-generator')
export class PdfGeneratorController {
  constructor(private readonly pdfService: ExtendedPdfService) {}

  @Get('application/:applicationId')
  @ApiOperation({ summary: '拡張申請書PDFを生成' })
  @ApiParam({ name: 'applicationId', description: '申請ID' })
  @ApiResponse({ status: 200, description: 'PDF生成成功' })
  @ApiResponse({ status: 404, description: '申請が見つかりません' })
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="application.pdf"')
  async generateApplicationPdf(
    @Param('applicationId') applicationId: string,
    @Res() res: Response,
  ) {
    try {
      const pdfBuffer = await this.pdfService.generateExtendedApplicationPdf(applicationId);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="application_${applicationId}.pdf"`,
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

  @Get('application/:applicationId/preview')
  @ApiOperation({ summary: '拡張申請書PDFをプレビュー' })
  @ApiParam({ name: 'applicationId', description: '申請ID' })
  @ApiResponse({ status: 200, description: 'PDFプレビュー成功' })
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline')
  async previewApplicationPdf(
    @Param('applicationId') applicationId: string,
    @Res() res: Response,
  ) {
    try {
      const pdfBuffer = await this.pdfService.generateExtendedApplicationPdf(applicationId);
      
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

  @Get('application/:applicationId/summary')
  @ApiOperation({ summary: 'サマリーレポートPDFを生成' })
  @ApiParam({ name: 'applicationId', description: '申請ID' })
  @ApiResponse({ status: 200, description: 'サマリーPDF生成成功' })
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="summary.pdf"')
  async generateSummaryPdf(
    @Param('applicationId') applicationId: string,
    @Res() res: Response,
  ) {
    try {
      const pdfBuffer = await this.pdfService.generateSummaryReport(applicationId);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="summary_${applicationId}.pdf"`,
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