import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL is not configured');
    }

    // Use service key if available, otherwise use anon key
    const supabaseKey = supabaseServiceKey || supabaseAnonKey;

    if (!supabaseKey) {
      throw new Error('Neither SUPABASE_SERVICE_KEY nor SUPABASE_ANON_KEY is configured');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    this.logger.log('Supabase client initialized successfully');
  }

  /**
   * Get the Supabase client instance
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Upload file to Supabase Storage
   */
  async uploadFile(
    bucket: string,
    path: string,
    file: Buffer | Uint8Array,
    contentType?: string,
  ) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: false,
      });

    if (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw error;
    }

    return data;
  }

  /**
   * Download file from Supabase Storage
   */
  async downloadFile(bucket: string, path: string) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .download(path);

    if (error) {
      this.logger.error(`Failed to download file: ${error.message}`);
      throw error;
    }

    return data;
  }

  /**
   * Delete file from Supabase Storage
   */
  async deleteFile(bucket: string, paths: string[]) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .remove(paths);

    if (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      throw error;
    }

    return data;
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Create a signed URL for temporary access
   */
  async createSignedUrl(bucket: string, path: string, expiresIn = 900) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      this.logger.error(`Failed to create signed URL: ${error.message}`);
      throw error;
    }

    return data.signedUrl;
  }

  /**
   * List files in a bucket
   */
  async listFiles(bucket: string, path?: string, options?: {
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .list(path, options);

    if (error) {
      this.logger.error(`Failed to list files: ${error.message}`);
      throw error;
    }

    return data;
  }

  /**
   * Create a storage bucket
   */
  async createBucket(name: string, options?: {
    public?: boolean;
    fileSizeLimit?: number;
    allowedMimeTypes?: string[];
  }) {
    const { data, error } = await this.supabase.storage
      .createBucket(name, {
        public: options?.public ?? false,
        fileSizeLimit: options?.fileSizeLimit,
        allowedMimeTypes: options?.allowedMimeTypes,
      });

    if (error) {
      this.logger.error(`Failed to create bucket: ${error.message}`);
      throw error;
    }

    return data;
  }

  /**
   * Execute a database query through Supabase
   */
  async query<T = any>(
    table: string,
    operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert',
    params?: any,
  ): Promise<T[]> {
    const queryBuilder = this.supabase.from(table);
    let result: any;

    switch (operation) {
      case 'select': {
        let selectQuery = queryBuilder.select(params?.columns || '*');
        if (params?.filters) {
          Object.entries(params.filters).forEach(([key, value]) => {
            selectQuery = selectQuery.eq(key, value as any);
          });
        }
        result = await selectQuery;
        break;
      }
      case 'insert':
        result = await queryBuilder.insert(params);
        break;
      case 'update': {
        let updateQuery = queryBuilder.update(params.data);
        if (params?.filters) {
          Object.entries(params.filters).forEach(([key, value]) => {
            updateQuery = updateQuery.eq(key, value as any);
          });
        }
        result = await updateQuery;
        break;
      }
      case 'delete': {
        let deleteQuery = queryBuilder.delete();
        if (params?.filters) {
          Object.entries(params.filters).forEach(([key, value]) => {
            deleteQuery = deleteQuery.eq(key, value as any);
          });
        }
        result = await deleteQuery;
        break;
      }
      case 'upsert':
        result = await queryBuilder.upsert(params);
        break;
    }

    const { data, error } = result;

    if (error) {
      this.logger.error(`Database operation failed: ${error.message}`);
      throw error;
    }

    return data as T[];
  }

  /**
   * Subscribe to real-time changes
   */
  subscribeToChanges(
    table: string,
    callback: (payload: any) => void,
    filter?: { event?: 'INSERT' | 'UPDATE' | 'DELETE'; filter?: string },
  ) {
    const channel = this.supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes' as any,
        {
          event: filter?.event || '*',
          schema: 'public',
          table,
          filter: filter?.filter,
        },
        callback,
      )
      .subscribe();

    return channel;
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channel: any) {
    await this.supabase.removeChannel(channel);
  }
}