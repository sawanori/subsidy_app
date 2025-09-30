import { Module } from '@nestjs/common';
import { ValidateController } from './validate.controller';
import { ValidateService } from './validate.service';
import { PrismaModule } from '@prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ValidateController],
  providers: [ValidateService],
  exports: [ValidateService],
})
export class ValidateModule {}
