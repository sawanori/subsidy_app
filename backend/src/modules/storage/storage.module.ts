import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import { SupabaseModule } from '@/supabase/supabase.module';

@Module({
  imports: [ConfigModule, SupabaseModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}