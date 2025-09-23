import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { I18nModule } from '../common/i18n/i18n.module';

@Global()
@Module({
  imports: [I18nModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}