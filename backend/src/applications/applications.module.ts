import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { I18nModule } from '../common/i18n/i18n.module';
import { TemplateModule } from '../template/template.module';

@Module({
  imports: [I18nModule, TemplateModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}