import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { SupabaseService } from '@/supabase/supabase.service';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const exists = promisify(fs.exists);

export enum StorageBucket {
  EVIDENCE_FILES = 'evidence-files',
  GENERATED_DOCUMENTS = 'generated-documents',
  TEMP_FILES = 'temp-files',
}

export interface UploadOptions {
  bucket: StorageBucket;
  userId: string;
  applicationId?: string;
  fileName: string;
  contentType?: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly useSupabase: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {
    this.useSupabase = this.configService.get<string>('USE_SUPABASE_STORAGE') === 'true';
    this.ensureUploadDir();

    if (this.useSupabase) {
      this.logger.log('✅ Supabase Storage enabled');
    } else {
      this.logger.warn('⚠️  Using local file storage (set USE_SUPABASE_STORAGE=true for production)');
    }
  }

  private async ensureUploadDir() {
    try {
      await mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  /**
   * Upload file to storage (Supabase or local)
   */
  async uploadFile(buffer: Buffer, options: UploadOptions): Promise<string> {
    if (this.useSupabase) {
      return this.uploadToSupabase(buffer, options);
    } else {
      return this.uploadToLocal(buffer, options);
    }
  }

  /**
   * Download file from storage (Supabase or local)
   */
  async downloadFile(filePath: string, bucket?: StorageBucket): Promise<Buffer> {
    if (this.useSupabase && bucket) {
      return this.downloadFromSupabase(filePath, bucket);
    } else {
      return this.downloadFromLocal(filePath);
    }
  }

  /**
   * Delete file from storage (Supabase or local)
   */
  async deleteFile(filePath: string, bucket?: StorageBucket): Promise<void> {
    if (this.useSupabase && bucket) {
      return this.deleteFromSupabase(filePath, bucket);
    } else {
      return this.deleteFromLocal(filePath);
    }
  }

  /**
   * Get signed URL for temporary access (Supabase only)
   */
  async getSignedUrl(filePath: string, bucket: StorageBucket, expiresIn: number = 3600): Promise<string> {
    if (!this.useSupabase) {
      throw new Error('Signed URLs are only available with Supabase Storage');
    }

    const signedUrl = await this.supabaseService.createSignedUrl(bucket, filePath, expiresIn);
    return signedUrl;
  }

  // ========================================
  // Supabase Storage Methods
  // ========================================

  private async uploadToSupabase(buffer: Buffer, options: UploadOptions): Promise<string> {
    const filePath = this.buildFilePath(options);

    const data = await this.supabaseService.uploadFile(
      options.bucket,
      filePath,
      buffer,
      options.contentType,
    );

    this.logger.log(`✅ Uploaded to Supabase: ${filePath}`);
    return data.path;
  }

  private async downloadFromSupabase(filePath: string, bucket: StorageBucket): Promise<Buffer> {
    const data = await this.supabaseService.downloadFile(bucket, filePath);
    return Buffer.from(await data.arrayBuffer());
  }

  private async deleteFromSupabase(filePath: string, bucket: StorageBucket): Promise<void> {
    await this.supabaseService.deleteFile(bucket, [filePath]);
    this.logger.log(`🗑️  Deleted from Supabase: ${filePath}`);
  }

  // ========================================
  // Local Storage Methods (Fallback)
  // ========================================

  private async uploadToLocal(buffer: Buffer, options: UploadOptions): Promise<string> {
    const filePath = path.join(this.uploadDir, this.buildFilePath(options));
    const dirPath = path.dirname(filePath);

    await mkdir(dirPath, { recursive: true });
    await writeFile(filePath, buffer);

    this.logger.log(`📁 Saved to local storage: ${filePath}`);
    return filePath;
  }

  private async downloadFromLocal(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.uploadDir, filePath);
    return await readFile(fullPath);
  }

  private async deleteFromLocal(filePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, filePath);
    if (await exists(fullPath)) {
      await unlink(fullPath);
      this.logger.log(`🗑️  Deleted from local storage: ${fullPath}`);
    }
  }

  // ========================================
  // Legacy Methods (for backward compatibility)
  // ========================================

  async saveFile(filename: string, buffer: Buffer): Promise<string> {
    const filePath = path.join(this.uploadDir, filename);
    await writeFile(filePath, buffer);
    return filePath;
  }

  async readFile(filename: string): Promise<Buffer> {
    const filePath = path.join(this.uploadDir, filename);
    return await readFile(filePath);
  }

  getFilePath(filename: string): string {
    return path.join(this.uploadDir, filename);
  }

  // ========================================
  // Helper Methods
  // ========================================

  private buildFilePath(options: UploadOptions): string {
    const parts = [options.userId];

    if (options.applicationId) {
      parts.push(options.applicationId);
    }

    parts.push(options.fileName);

    return parts.join('/');
  }

  /**
   * Clean up temporary files older than specified hours
   */
  async cleanupTempFiles(olderThanHours: number = 24): Promise<void> {
    if (!this.useSupabase) {
      this.logger.warn('Temp file cleanup is only available with Supabase Storage');
      return;
    }

    const files = await this.supabaseService.listFiles(StorageBucket.TEMP_FILES);

    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const oldFiles = files.filter(file => new Date(file.created_at) < cutoffTime);

    if (oldFiles.length > 0) {
      await this.supabaseService.deleteFile(
        StorageBucket.TEMP_FILES,
        oldFiles.map(f => f.name),
      );
      this.logger.log(`🧹 Cleaned up ${oldFiles.length} temp files`);
    }
  }
}