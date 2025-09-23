import { Module } from '@nestjs/common';
import { ExtendedApplicationController } from './extended-application.controller';
import { ExtendedApplicationService } from './extended-application.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExtendedApplicationController],
  providers: [ExtendedApplicationService],
  exports: [ExtendedApplicationService],
})
export class ExtendedApplicationModule {}